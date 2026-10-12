package com.tradelect.order.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PurchaseDto {
    private Long id;
    private Long userId;
    private Long productId;
    private String productName;
    private String partNumber;
    private String brand;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private String deliveryAddress;
    private String contactName;
    private String contactPhone;
    private String notes;
    private String status;
    private String paymentMethod;
    private String paymentId;
    private String paymentStatus;
    private String deliveryPartner;
    private String trackingNumber;
    private LocalDateTime expectedDeliveryDate;
    private LocalDateTime actualDeliveryDate;
    private LocalDateTime createdAt;
}
