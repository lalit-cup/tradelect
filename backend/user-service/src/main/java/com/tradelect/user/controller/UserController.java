package com.tradelect.user.controller;

import com.tradelect.user.dto.*;
import com.tradelect.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<Map<String,Object>> getMyProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String email,
            @RequestHeader(value = "X-User-FullName", required = false) String fullName,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        return ResponseEntity.ok(Map.of("success", true,
                "data", userService.getOrCreateProfile(userId, email, fullName, role)));
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String,Object>> updateMyProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(Map.of("success", true, "data", userService.updateProfile(userId, req)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserProfileDto> users = userService.getAllUsers(page, size);
        return ResponseEntity.ok(Map.of("success", true, "data", users.getContent(),
            "totalElements", users.getTotalElements(), "totalPages", users.getTotalPages()));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> deactivateUser(@PathVariable Long userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "User deactivated"));
    }
}
