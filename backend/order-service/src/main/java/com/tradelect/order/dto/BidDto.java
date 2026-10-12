package com.tradelect.order.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BidDto {
    private Long id;
    private Long userId;
    private Long productId;
    private String productName;
    private String partNumber;
    private BigDecimal offerPrice;
    private Integer quantity;
    private String message;
    private String deliveryAddress;
    private String contactPerson;
    private String contactPhone;
    private String bidderType;
    private String status;
    private String adminResponse;
    private LocalDateTime createdAt;
}
