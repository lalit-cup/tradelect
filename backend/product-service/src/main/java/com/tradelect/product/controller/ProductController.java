package com.tradelect.product.controller;

import com.tradelect.product.dto.ProductDto;
import com.tradelect.product.dto.ProductSearchRequest;
import com.tradelect.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Map<String,Object>> searchProducts(ProductSearchRequest request) {
        Page<ProductDto> products = productService.searchProducts(request);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", products.getContent());
        r.put("totalElements", products.getTotalElements());
        r.put("totalPages", products.getTotalPages());
        r.put("currentPage", products.getNumber());
        return ResponseEntity.ok(r);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String,Object>> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true, "data", productService.getProductById(id)));
    }

    @GetMapping("/part/{partNumber}")
    public ResponseEntity<Map<String,Object>> getByPartNumber(@PathVariable String partNumber) {
        return ResponseEntity.ok(Map.of("success", true, "data", productService.getProductByPartNumber(partNumber)));
    }

    @GetMapping("/featured")
    public ResponseEntity<Map<String,Object>> getFeatured() {
        return ResponseEntity.ok(Map.of("success", true, "data", productService.getFeaturedProducts()));
    }

    @GetMapping("/brands")
    public ResponseEntity<Map<String,Object>> getBrands() {
        return ResponseEntity.ok(Map.of("success", true, "data", productService.getAllBrands()));
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String,Object>> getCategories() {
        return ResponseEntity.ok(Map.of("success", true, "data", productService.getAllCategories()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DEALER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> createProduct(
            @Valid @RequestBody ProductDto request,
            @RequestHeader("X-User-Id") Long sellerId) {
        ProductDto p = productService.createProduct(request, sellerId);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("message", "Product created successfully"); r.put("data", p);
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEALER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDto request,
            @RequestHeader("X-User-Id") Long sellerId) {
        ProductDto p = productService.updateProduct(id, request, sellerId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Product updated", "data", p));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEALER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> deleteProduct(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long sellerId) {
        productService.deleteProduct(id, sellerId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Product deleted"));
    }

    @GetMapping("/seller/my-listings")
    @PreAuthorize("hasAnyRole('DEALER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> getMyListings(
            @RequestHeader("X-User-Id") Long sellerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ProductDto> products = productService.getSellerProducts(sellerId, page, size);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", products.getContent());
        r.put("totalElements", products.getTotalElements());
        r.put("totalPages", products.getTotalPages());
        return ResponseEntity.ok(r);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DEALER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> bulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") Long sellerId) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("success",false,"message","File is empty"));
        String fn = file.getOriginalFilename();
        if (fn == null || (!fn.endsWith(".xlsx") && !fn.endsWith(".xls")))
            return ResponseEntity.badRequest().body(Map.of("success",false,"message","Only .xlsx/.xls supported"));
        try {
            Map<String,Object> result = productService.bulkImportProducts(file, sellerId);
            int imported = (int) result.get("imported"), errors = (int) result.get("errors");
            Map<String,Object> r = new HashMap<>(result);
            r.put("success", true);
            r.put("message", imported + " product(s) imported" + (errors > 0 ? ", " + errors + " skipped" : ""));
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    @GetMapping("/import/template")
    @PreAuthorize("hasAnyRole('DEALER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = wb.createSheet("Products");
            org.apache.poi.ss.usermodel.CellStyle hs = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font f = wb.createFont();
            f.setBold(true); f.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
            hs.setFont(f);
            hs.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.DARK_BLUE.getIndex());
            hs.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            String[] headers = {"Name*","Part Number*","Brand*","Category*","Sub-Category","Model Number","Description","Price (₹)*","Discount Price","Stock Qty","Data Sheet URL"};
            org.apache.poi.ss.usermodel.Row hr = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell c = hr.createCell(i);
                c.setCellValue(headers[i]); c.setCellStyle(hs);
                sheet.setColumnWidth(i, i < 4 ? 6000 : 5000);
            }
            String[] sample = {"Siemens 3RT2 Contactor 9A","3RT2015-1BB41","Siemens","Contactors & Relays","Power Contactors","3RT2015","3-pole contactor 9A 4kW","4500","3800","50","https://example.com/ds.pdf"};
            org.apache.poi.ss.usermodel.Row sr = sheet.createRow(1);
            for (int i = 0; i < sample.length; i++) sr.createCell(i).setCellValue(sample[i]);
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            wb.write(out);
            return ResponseEntity.ok()
                .header("Content-Disposition","attachment; filename=tradelect_product_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(out.toByteArray());
        }
    }
}
