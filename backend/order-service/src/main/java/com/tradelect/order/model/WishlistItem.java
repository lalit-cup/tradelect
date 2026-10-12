package com.tradelect.order.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wishlist_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
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

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WishlistStatus status = WishlistStatus.PENDING;

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
