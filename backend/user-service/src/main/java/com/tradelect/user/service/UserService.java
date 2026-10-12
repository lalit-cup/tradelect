package com.tradelect.user.service;

import com.tradelect.user.dto.*;
import com.tradelect.user.model.UserProfile;
import com.tradelect.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserProfileRepository repo;

    /** Get profile, seeding email/role from JWT headers if this is the first access. */
    public UserProfileDto getOrCreateProfile(Long userId, String email, String fullName, String role) {
        UserProfile p = repo.findByUserId(userId).orElseGet(() -> {
            UserProfile newProfile = UserProfile.builder()
                .userId(userId)
                .email(email)
                .fullName(fullName)
                .role(role)
                .build();
            return repo.save(newProfile);
        });
        // Update email/role if they're empty (backfill)
        boolean changed = false;
        if (fullName != null && (p.getFullName() == null || p.getFullName().isEmpty())) {
            p.setFullName(fullName); changed = true;
        }
        if (email != null && (p.getEmail() == null || p.getEmail().isEmpty())) {
            p.setEmail(email); changed = true;
        }
        if (role != null && (p.getRole() == null || p.getRole().isEmpty())) {
            p.setRole(role); changed = true;
        }
        if (changed) repo.save(p);
        return toDto(p);
    }

    public UserProfileDto getProfile(Long userId) {
        UserProfile p = repo.findByUserId(userId)
            .orElseGet(() -> repo.save(UserProfile.builder().userId(userId).build()));
        return toDto(p);
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest req) {
        UserProfile p = repo.findByUserId(userId)
            .orElseGet(() -> UserProfile.builder().userId(userId).build());
        if (req.getFullName() != null) p.setFullName(req.getFullName());
        if (req.getPhone() != null) p.setPhone(req.getPhone());
        if (req.getCompanyName() != null) p.setCompanyName(req.getCompanyName());
        if (req.getProfileImageUrl() != null) p.setProfileImageUrl(req.getProfileImageUrl());
        if (req.getAddress() != null) p.setAddress(req.getAddress());
        if (req.getCity() != null) p.setCity(req.getCity());
        if (req.getState() != null) p.setState(req.getState());
        if (req.getPincode() != null) p.setPincode(req.getPincode());
        if (req.getGstNumber() != null) p.setGstNumber(req.getGstNumber());
        if (req.getPanNumber() != null) p.setPanNumber(req.getPanNumber());
        return toDto(repo.save(p));
    }

    public Page<UserProfileDto> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return repo.findAll(pageable).map(this::toDto);
    }

    @Transactional
    public void deactivateUser(Long userId) {
        repo.findByUserId(userId).ifPresent(p -> { p.setActive(false); repo.save(p); });
    }

    private UserProfileDto toDto(UserProfile p) {
        return UserProfileDto.builder()
            .id(p.getId()).userId(p.getUserId()).fullName(p.getFullName())
            .email(p.getEmail()).phone(p.getPhone()).companyName(p.getCompanyName())
            .role(p.getRole()).profileImageUrl(p.getProfileImageUrl())
            .address(p.getAddress()).city(p.getCity()).state(p.getState())
            .pincode(p.getPincode()).gstNumber(p.getGstNumber()).panNumber(p.getPanNumber())
            .createdAt(p.getCreatedAt())
            .build();
    }
}
