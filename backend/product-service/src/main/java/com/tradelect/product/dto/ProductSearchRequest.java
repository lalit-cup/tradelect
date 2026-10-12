package com.tradelect.product.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductSearchRequest {
    private String search;
    private String brand;
    private String category;
    private String modelNumber;
    private String partNumber;
    private String stockStatus;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String sortBy;
    private Integer page = 0;
    private Integer size = 20;
}
