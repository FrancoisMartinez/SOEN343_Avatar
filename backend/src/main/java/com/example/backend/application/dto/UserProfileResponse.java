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
    private Double balance;

    private Double travelRadius;
    private Double hourlyRate;
    private Double latitude;
    private Double longitude;

    public UserProfileResponse() {}

    public UserProfileResponse(Long id, String fullName, String email,
                               String licenseNumber, LocalDate licenseIssueDate,
                               String licenseRegion, String role, Double balance,
                               Double travelRadius, Double hourlyRate,
                               Double latitude, Double longitude) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.licenseNumber = licenseNumber;
        this.licenseIssueDate = licenseIssueDate;
        this.licenseRegion = licenseRegion;
        this.role = role;
        this.balance = balance;
        this.travelRadius = travelRadius;
        this.hourlyRate = hourlyRate;
        this.latitude = latitude;
        this.longitude = longitude;
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

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public Double getTravelRadius() { return travelRadius; }
    public void setTravelRadius(Double travelRadius) { this.travelRadius = travelRadius; }

    public Double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}

