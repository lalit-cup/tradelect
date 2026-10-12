package com.tradelect.user.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String companyName;
    private String role;
    private String profileImageUrl;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String gstNumber;
    private String panNumber;
    private LocalDateTime createdAt;
}

