package com.tradelect.order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class WishlistRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;
    private String productName;
    private String partNumber;
    private String brand;
    @Positive(message = "Quantity must be positive")
    private Integer quantity = 1;
    private String notes;
    private String deliveryAddress;
    private String contactPerson;
    private String contactPhone;
}
