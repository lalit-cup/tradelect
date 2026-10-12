package com.tradelect.order.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bids")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long productId;

    private String productName;

    private String partNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal offerPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 1000)
    private String message;

    private String deliveryAddress;

    private String contactPerson;

    private String contactPhone;

    @Enumerated(EnumType.STRING)
    private BidderType bidderType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BidStatus status = BidStatus.PENDING;

    private String adminResponse;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
