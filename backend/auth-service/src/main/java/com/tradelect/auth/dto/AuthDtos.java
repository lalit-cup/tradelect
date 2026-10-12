package com.tradelect.auth.dto;

import com.tradelect.auth.model.UserRole;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @Email(message = "Valid email is required")
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Valid phone number required")
        private String phone;

        private String companyName;

        private UserRole role = UserRole.CUSTOMER;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @Email(message = "Valid email is required")
        @NotBlank(message = "Email is required")
        private String email;

        private String password;

        private String otp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;
        private UserDto user;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String companyName;
        private UserRole role;
        private String profileImageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OtpRequest {
        @Email(message = "Valid email is required")
        @NotBlank(message = "Email is required")
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "New password must be at least 8 characters")
        private String newPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminRegisterRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @Email(message = "Valid email is required")
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        private String phone;
        private String companyName;

        /** ADMIN or SUPER_ADMIN */
        private UserRole role = UserRole.ADMIN;

        /** Required when an admin already exists. Set in application.yml as admin.invite-key */
        private String inviteKey;
    }
}
