package com.tradelect.order.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchases")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Purchase {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "part_number")
    private String partNumber;

    private String brand;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "delivery_address", length = 1000)
    private String deliveryAddress;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    private PurchaseStatus status;

    // Payment
    @Column(name = "payment_method")
    private String paymentMethod;   // "ONLINE" | "COD"

    @Column(name = "payment_id")
    private String paymentId;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus;

    // Delivery
    @Column(name = "delivery_partner")
    private String deliveryPartner;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "expected_delivery_date")
    private LocalDateTime expectedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDateTime actualDeliveryDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null)        status        = PurchaseStatus.PENDING;
        if (paymentMethod == null) paymentMethod = "COD";
        if (paymentStatus == null) paymentStatus = PaymentStatus.COD_PENDING;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
