package com.example.backend.application.dto;

import java.time.LocalDate;

public class UserProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String licenseNumber;
    private LocalDate licenseIssueDate;
    private String licenseRegion;
    private String role;

    public UserProfileResponse() {}

    public UserProfileResponse(Long id, String fullName, String email,
                               String licenseNumber, LocalDate licenseIssueDate,
                               String licenseRegion, String role) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.licenseNumber = licenseNumber;
        this.licenseIssueDate = licenseIssueDate;
        this.licenseRegion = licenseRegion;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public LocalDate getLicenseIssueDate() { return licenseIssueDate; }
    public void setLicenseIssueDate(LocalDate licenseIssueDate) { this.licenseIssueDate = licenseIssueDate; }

    public String getLicenseRegion() { return licenseRegion; }
    public void setLicenseRegion(String licenseRegion) { this.licenseRegion = licenseRegion; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
