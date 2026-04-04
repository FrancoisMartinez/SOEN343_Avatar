package com.example.backend.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "app_user")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String licenseNumber;
    private java.time.LocalDate licenseIssueDate;
    private String licenseRegion;

    // --- Getters & Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public java.time.LocalDate getLicenseIssueDate() {
        return licenseIssueDate;
    }

    public void setLicenseIssueDate(java.time.LocalDate licenseIssueDate) {
        this.licenseIssueDate = licenseIssueDate;
    }

    public String getLicenseRegion() {
        return licenseRegion;
    }

    public void setLicenseRegion(String licenseRegion) {
        this.licenseRegion = licenseRegion;
    }

    /**
     * Returns the role string derived from the concrete subclass type.
     */
    public String getRole() {
        if (this instanceof Learner) return "LEARNER";
        if (this instanceof Instructor) return "INSTRUCTOR";
        if (this instanceof CarProvider) return "CAR_PROVIDER";
        if (this instanceof Admin) return "ADMIN";
        return "UNKNOWN";
    }
}
