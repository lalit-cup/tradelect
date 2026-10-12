package com.tradelect.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class EnquiryRequest {
    private Long productId;
    @NotBlank private String subject;
    @NotBlank private String message;
    private String attachmentUrl;
    private String contactName;
    private String contactEmail;
    private String contactPhone;
}
