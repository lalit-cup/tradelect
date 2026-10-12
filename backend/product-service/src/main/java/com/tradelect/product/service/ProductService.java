package com.tradelect.product.service;

import com.tradelect.product.dto.ProductDto;
import com.tradelect.product.dto.ProductSearchRequest;
import com.tradelect.product.model.Product;
import com.tradelect.product.model.StockStatus;
import com.tradelect.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    // ── Search ─────────────────────────────────────────────────────────────────
    public Page<ProductDto> searchProducts(ProductSearchRequest request) {
        Sort sort = buildSort(request.getSortBy());
        Pageable pageable = PageRequest.of(
                request.getPage() != null ? request.getPage() : 0,
                request.getSize() != null ? request.getSize() : 20,
                sort);

        StockStatus stockStatus = null;
        if (request.getStockStatus() != null && !request.getStockStatus().isEmpty()) {
            try { stockStatus = StockStatus.valueOf(request.getStockStatus().toUpperCase()); }
            catch (IllegalArgumentException e) { log.warn("Invalid stock status: {}", request.getStockStatus()); }
        }

        String search   = blank(request.getSearch());
        String brand    = blank(request.getBrand());
        String category = blank(request.getCategory());

        return productRepository.searchProducts(search, brand, category, stockStatus,
                request.getMinPrice(), request.getMaxPrice(), pageable).map(this::toDto);
    }

    public ProductDto getProductById(Long id) {
        return toDto(productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id)));
    }

    public ProductDto getProductByPartNumber(String partNumber) {
        return toDto(productRepository.findByPartNumber(partNumber)
                .orElseThrow(() -> new RuntimeException("Product not found: " + partNumber)));
    }

    // ── Create ─────────────────────────────────────────────────────────────────
    @Transactional
    public ProductDto createProduct(ProductDto request, Long sellerId) {
        Product product = Product.builder()
                .name(request.getName()).partNumber(request.getPartNumber())
                .description(request.getDescription()).brand(request.getBrand())
                .category(request.getCategory()).subCategory(request.getSubCategory())
                .modelNumber(request.getModelNumber()).price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .imageUrls(request.getImageUrls()).specifications(request.getSpecifications())
                .dataSheetUrl(request.getDataSheetUrl()).sellerId(sellerId).build();

        Product saved = productRepository.save(product);
        log.info("Product created: {} by seller: {}", saved.getPartNumber(), sellerId);

        // Notify all registered customers about the new product
        notifyUsersOfNewProduct(saved);
        return toDto(saved);
    }

    // ── Update ─────────────────────────────────────────────────────────────────
    @Transactional
    public ProductDto updateProduct(Long id, ProductDto request, Long sellerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        if (!product.getSellerId().equals(sellerId))
            throw new RuntimeException("Unauthorized to update this product");

        product.setName(request.getName()); product.setDescription(request.getDescription());
        product.setBrand(request.getBrand()); product.setCategory(request.getCategory());
        product.setSubCategory(request.getSubCategory()); product.setModelNumber(request.getModelNumber());
        product.setPrice(request.getPrice()); product.setDiscountPrice(request.getDiscountPrice());
        product.setPartNumber(request.getPartNumber());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getImageUrls() != null) product.setImageUrls(request.getImageUrls());
        if (request.getSpecifications() != null) product.setSpecifications(request.getSpecifications());
        if (request.getDataSheetUrl() != null) product.setDataSheetUrl(request.getDataSheetUrl());

        return toDto(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id, Long sellerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        if (!product.getSellerId().equals(sellerId))
            throw new RuntimeException("Unauthorized to delete this product");
        product.setActive(false);
        productRepository.save(product);
    }

    public List<String> getAllBrands()      { return productRepository.findAllBrands(); }
    public List<String> getAllCategories()  { return productRepository.findAllCategories(); }
    public List<ProductDto> getFeaturedProducts() {
        return productRepository.findFeaturedProducts(PageRequest.of(0, 8))
                .stream().map(this::toDto).collect(Collectors.toList());
    }
    public Page<ProductDto> getSellerProducts(Long sellerId, int page, int size) {
        return productRepository.findBySellerIdAndActive(sellerId, true,
                PageRequest.of(page, size, Sort.by("createdAt").descending())).map(this::toDto);
    }

    // ── Bulk Excel import ──────────────────────────────────────────────────────
    @Transactional
    public Map<String, Object> bulkImportProducts(MultipartFile file, Long sellerId) {
        List<ProductDto> created = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet.getRow(0) == null) throw new RuntimeException("Excel file is empty");
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                try { created.add(createProduct(rowToProductDto(row), sellerId)); }
                catch (Exception e) { errors.add("Row " + (i + 1) + ": " + e.getMessage()); }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }
        Map<String,Object> result = new HashMap<>();
        result.put("imported", created.size()); result.put("errors", errors.size());
        result.put("errorDetails", errors); result.put("products", created);
        return result;
    }

    // ── Kafka: notify customers ────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private void notifyUsersOfNewProduct(Product product) {
        try {
            RestTemplate rest = new RestTemplate();

            // Collect all user IDs: dealers + customers
            List<String> allUserIds = new ArrayList<>();

            // Notify DEALERS
            try {
                var dealerResp = rest.getForEntity(authServiceUrl + "/api/auth/users/dealers", Map.class);
                if (dealerResp.getStatusCode().is2xxSuccessful() && dealerResp.getBody() != null) {
                    List<Object> ids = (List<Object>) dealerResp.getBody().get("data");
                    if (ids != null) ids.forEach(id -> allUserIds.add(id.toString()));
                }
            } catch (Exception e) {
                log.warn("Could not fetch dealer IDs: {}", e.getMessage());
            }

            // Notify CUSTOMERS
            try {
                var custResp = rest.getForEntity(authServiceUrl + "/api/auth/users/customers", Map.class);
                if (custResp.getStatusCode().is2xxSuccessful() && custResp.getBody() != null) {
                    List<Object> ids = (List<Object>) custResp.getBody().get("data");
                    if (ids != null) ids.forEach(id -> allUserIds.add(id.toString()));
                }
            } catch (Exception e) {
                log.warn("Could not fetch customer IDs: {}", e.getMessage());
            }

            if (allUserIds.isEmpty()) {
                log.info("No users found to notify for product={}", product.getPartNumber());
                return;
            }

            Map<String, Object> event = new HashMap<>();
            event.put("productId",   product.getId().toString());
            event.put("productName", product.getName());
            event.put("brand",       product.getBrand());
            event.put("category",    product.getCategory());
            event.put("price",       product.getPrice().toPlainString());
            event.put("target",      "ALL");
            event.put("userIds",     allUserIds);

            kafkaTemplate.send("product-created-events", event);
            log.info("Fired product-created-events for product={} to {} users (dealers+customers)",
                    product.getPartNumber(), allUserIds.size());

        } catch (Exception e) {
            log.warn("Could not send product-created notification: {}", e.getMessage());
        }
    }

    // ── Internal helpers ───────────────────────────────────────────────────────
    private Sort buildSort(String sortBy) {
        if (sortBy == null) return Sort.by("createdAt").descending();
        return switch (sortBy.toLowerCase()) {
            case "price_asc"  -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            case "name_asc"   -> Sort.by("name").ascending();
            case "rating"     -> Sort.by("rating").descending();
            default           -> Sort.by("createdAt").descending();
        };
    }

    private ProductDto toDto(Product p) {
        return ProductDto.builder()
                .id(p.getId()).name(p.getName()).partNumber(p.getPartNumber())
                .description(p.getDescription()).brand(p.getBrand()).category(p.getCategory())
                .subCategory(p.getSubCategory()).modelNumber(p.getModelNumber())
                .price(p.getPrice()).discountPrice(p.getDiscountPrice())
                .stockQuantity(p.getStockQuantity()).stockStatus(p.getStockStatus().name())
                .imageUrls(p.getImageUrls()).specifications(p.getSpecifications())
                .dataSheetUrl(p.getDataSheetUrl()).sellerId(p.getSellerId())
                .rating(p.getRating()).reviewCount(p.getReviewCount()).createdAt(p.getCreatedAt())
                .build();
    }

    private ProductDto rowToProductDto(Row row) {
        String name = cellStr(row,0), pn = cellStr(row,1), brand = cellStr(row,2), cat = cellStr(row,3);
        if (name==null||name.isBlank()) throw new RuntimeException("Name (A) required");
        if (pn==null||pn.isBlank())    throw new RuntimeException("Part# (B) required");
        if (brand==null||brand.isBlank()) throw new RuntimeException("Brand (C) required");
        if (cat==null||cat.isBlank())  throw new RuntimeException("Category (D) required");
        String ps = cellStr(row,7);
        if (ps==null||ps.isBlank()) throw new RuntimeException("Price (H) required");
        BigDecimal price;
        try { price = new BigDecimal(ps.replaceAll("[^\\d.]","")); }
        catch (Exception e) { throw new RuntimeException("Invalid price: "+ps); }
        BigDecimal dp = null;
        String dps = cellStr(row,8);
        if (dps!=null&&!dps.isBlank()) try { dp = new BigDecimal(dps.replaceAll("[^\\d.]","")); } catch (Exception ignored) {}
        int stock = 0;
        String ss = cellStr(row,9);
        if (ss!=null&&!ss.isBlank()) try { stock = Integer.parseInt(ss.replaceAll("[^\\d]","")); } catch (Exception ignored) {}
        return ProductDto.builder().name(name).partNumber(pn).brand(brand).category(cat)
                .subCategory(cellStr(row,4)).modelNumber(cellStr(row,5)).description(cellStr(row,6))
                .price(price).discountPrice(dp).stockQuantity(stock).dataSheetUrl(cellStr(row,10)).build();
    }

    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell==null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) yield cell.getLocalDateTimeCellValue().toString();
                double v = cell.getNumericCellValue();
                yield v==Math.floor(v) ? String.valueOf((long)v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCachedFormulaResultType()==CellType.NUMERIC
                ? String.valueOf((long)cell.getNumericCellValue())
                : cell.getRichStringCellValue().getString().trim();
            default -> null;
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int c=row.getFirstCellNum(); c<row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell!=null&&cell.getCellType()!=CellType.BLANK&&!cell.toString().trim().isEmpty()) return false;
        }
        return true;
    }

    private String blank(String s) { return (s==null||s.isBlank()) ? null : s.trim(); }
}
