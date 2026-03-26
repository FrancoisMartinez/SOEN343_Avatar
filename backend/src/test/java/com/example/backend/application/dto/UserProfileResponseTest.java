package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UserProfileResponseTest {

    @Test
    void constructorSetsFields() {
        LocalDate issueDate = LocalDate.of(2021, 6, 1);
        UserProfileResponse response = new UserProfileResponse(
                4L,
                "Jane Smith",
                "jane@test.com",
                "ON999",
                issueDate,
                "ON",
                "LEARNER",
                150.0);

        assertEquals(4L, response.getId());
        assertEquals("Jane Smith", response.getFullName());
        assertEquals("jane@test.com", response.getEmail());
        assertEquals("ON999", response.getLicenseNumber());
        assertEquals(issueDate, response.getLicenseIssueDate());
        assertEquals("ON", response.getLicenseRegion());
        assertEquals("LEARNER", response.getRole());
        assertEquals(150.0, response.getBalance());
    }
}