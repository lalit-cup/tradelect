package com.tradelect.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BidRequest {
    @NotNull private Long productId;
    private String productName;
    private String partNumber;
    @NotNull @Positive private BigDecimal offerPrice;
    @NotNull @Positive private Integer quantity;
    private String message;
    private String deliveryAddress;
    private String contactPerson;
    private String contactPhone;
    private String bidderType;
}
