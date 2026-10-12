package com.tradelect.auth.controller;

import com.tradelect.auth.dto.AuthDtos.*;
import com.tradelect.auth.service.AuthService;
import com.tradelect.auth.repository.UserRepository;
import com.tradelect.auth.model.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    /** Public registration for CUSTOMER and DEALER only */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "message", "Registration successful", "data", response));
    }

    /**
     * Admin/Super-Admin registration.
     * - If NO admin exists yet → first caller becomes SUPER_ADMIN automatically.
     * - Otherwise, requires an existing SUPER_ADMIN bearer token + the admin invite key.
     */
    @PostMapping("/register-admin")
    public ResponseEntity<Map<String, Object>> registerAdmin(
            @Valid @RequestBody AdminRegisterRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthResponse response = authService.registerAdmin(request, authHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "message", "Admin registered successfully", "data", response));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Login successful", "data", response));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody OtpRequest request) {
        authService.sendOtp(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "OTP sent to " + request.getEmail()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Token refreshed", "data", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = userIdHeader != null ? userIdHeader : authService.extractUserIdFromToken(authHeader);
        authService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
    }

    /** Check if any admin exists — used by frontend to show/hide "Setup Admin" button */
    @GetMapping("/admin-exists")
    public ResponseEntity<Map<String, Object>> adminExists() {
        return ResponseEntity.ok(Map.of("success", true, "adminExists", authService.adminExists()));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "auth-service"));
    }


    /** Internal: get all dealer user IDs — used by product-service to notify dealers when admin adds a product */
    @GetMapping("/users/dealers")
    public ResponseEntity<Map<String, Object>> getDealerIds() {
        var ids = userRepository.findAllByRole(UserRole.DEALER)
            .stream().map(u -> u.getId()).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", ids));
    }

    /** Internal: get all customer user IDs — used by product-service to send notifications */
    @GetMapping("/users/customers")
    public ResponseEntity<Map<String, Object>> getCustomerIds() {
        var ids = userRepository.findAllByRole(UserRole.CUSTOMER)
            .stream().map(u -> u.getId()).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", ids));
    }
}
