package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoginRequestTest {

    @Test
    void constructorSetsFields() {
        LoginRequest request = new LoginRequest("user@test.com", "pass123");

        assertEquals("user@test.com", request.getEmail());
        assertEquals("pass123", request.getPassword());
    }
}