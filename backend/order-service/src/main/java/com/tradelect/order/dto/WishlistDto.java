package com.tradelect.order.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistDto {
    private Long id;
    private Long productId;
    private String productName;
    private String partNumber;
    private String brand;
    private BigDecimal price;
    private Integer quantity;
    private String notes;
    private String deliveryAddress;
    private String contactPerson;
    private String contactPhone;
    private String status;
    private LocalDateTime createdAt;
}
