package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UpdateProfileRequestTest {

    @Test
    void settersAndGettersWork() {
        LocalDate issueDate = LocalDate.of(2020, 1, 2);
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("John Smith");
        request.setEmail("john@test.com");
        request.setLicenseNumber("QC123456");
        request.setLicenseIssueDate(issueDate);
        request.setLicenseRegion("QC");

        assertEquals("John Smith", request.getFullName());
        assertEquals("john@test.com", request.getEmail());
        assertEquals("QC123456", request.getLicenseNumber());
        assertEquals(issueDate, request.getLicenseIssueDate());
        assertEquals("QC", request.getLicenseRegion());
    }
}