package com.tradelect.product.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_brand", columnList = "brand"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_part_number", columnList = "partNumber")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String partNumber;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String category;

    private String subCategory;

    private String modelNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    private BigDecimal discountPrice;

    @Column(nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StockStatus stockStatus = StockStatus.IN_STOCK;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> imageUrls;

    @ElementCollection
    @CollectionTable(name = "product_specifications", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "spec_key")
    @Column(name = "spec_value")
    private java.util.Map<String, String> specifications;

    private String dataSheetUrl;

    @Column(nullable = false)
    private Long sellerId;

    @Builder.Default
    private boolean active = true;

    private Double rating;

    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.stockStatus = this.stockQuantity > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK;
    }
}
