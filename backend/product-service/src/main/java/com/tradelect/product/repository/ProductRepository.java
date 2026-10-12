package com.tradelect.product.repository;

import com.tradelect.product.model.Product;
import com.tradelect.product.model.StockStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByPartNumber(String partNumber);

    Page<Product> findByBrandIgnoreCaseAndActive(String brand, boolean active, Pageable pageable);

    Page<Product> findByCategoryIgnoreCaseAndActive(String category, boolean active, Pageable pageable);

    Page<Product> findByModelNumberIgnoreCaseAndActive(String modelNumber, boolean active, Pageable pageable);

    Page<Product> findByActive(boolean active, Pageable pageable);

    Page<Product> findBySellerIdAndActive(Long sellerId, boolean active, Pageable pageable);

    @Query("""
        SELECT p FROM Product p WHERE p.active = true
        AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:brand IS NULL OR LOWER(p.brand) = LOWER(:brand))
        AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
        AND (:stockStatus IS NULL OR p.stockStatus = :stockStatus)
        AND (:minPrice IS NULL OR p.price >= :minPrice)
        AND (:maxPrice IS NULL OR p.price <= :maxPrice)
    """)
    Page<Product> searchProducts(
            @Param("search") String search,
            @Param("brand") String brand,
            @Param("category") String category,
            @Param("stockStatus") StockStatus stockStatus,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.active = true ORDER BY p.brand")
    List<String> findAllBrands();

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.active = true ORDER BY p.category")
    List<String> findAllCategories();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stockStatus = 'IN_STOCK' ORDER BY p.createdAt DESC")
    List<Product> findFeaturedProducts(Pageable pageable);
}
