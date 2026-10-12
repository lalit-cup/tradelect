package com.tradelect.order.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EnquiryDto {
    private Long id;
    private Long userId;
    private Long productId;
    private String subject;
    private String message;
    private String attachmentUrl;
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String status;
    private String adminReply;
    private LocalDateTime createdAt;
}
