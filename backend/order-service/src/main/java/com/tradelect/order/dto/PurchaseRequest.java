package com.tradelect.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PurchaseRequest {
    @NotNull private Long productId;
    private String productName;
    private String partNumber;
    private String brand;
    @NotNull @Positive private Integer quantity;
    @NotNull @Positive private BigDecimal unitPrice;
    @NotBlank private String deliveryAddress;
    private String contactName;
    private String contactPhone;
    private String notes;
    private String paymentMethod;  // "ONLINE" or "COD"
    private String paymentId;      // Razorpay payment ID for online payments
    private String razorpayOrderId; // Razorpay order ID
}
