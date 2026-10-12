package com.tradelect.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    private Long id;

    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "Part number is required")
    private String partNumber;

    private String description;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Category is required")
    private String category;

    private String subCategory;

    private String modelNumber;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    private BigDecimal discountPrice;

    private Integer stockQuantity;

    private String stockStatus;

    private List<String> imageUrls;

    private Map<String, String> specifications;

    private String dataSheetUrl;

    private Long sellerId;

    private Double rating;

    private Integer reviewCount;

    private LocalDateTime createdAt;
}
