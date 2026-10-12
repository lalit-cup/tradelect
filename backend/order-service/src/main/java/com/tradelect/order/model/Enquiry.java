package com.tradelect.order.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "enquiries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long productId;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    private String attachmentUrl;

    private String contactName;

    private String contactEmail;

    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EnquiryStatus status = EnquiryStatus.OPEN;

    @Column(length = 2000)
    private String adminReply;

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
