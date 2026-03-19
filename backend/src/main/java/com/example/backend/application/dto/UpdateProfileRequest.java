package com.example.backend.application.dto;

import java.time.LocalDate;

public class UpdateProfileRequest {
    private String fullName;
    private String email;
    private String licenseNumber;
    private LocalDate licenseIssueDate;
    private String licenseRegion;

    public UpdateProfileRequest() {}

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
}
