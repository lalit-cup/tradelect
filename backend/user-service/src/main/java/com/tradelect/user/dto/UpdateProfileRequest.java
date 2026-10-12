package com.tradelect.user.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String companyName;
    private String profileImageUrl;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String gstNumber;
    private String panNumber;
}
