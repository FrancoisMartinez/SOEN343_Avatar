package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthResponseTest {

    @Test
    void constructorSetsFields() {
        AuthResponse response = new AuthResponse("token", 10L, "LEARNER");

        assertEquals("token", response.getToken());
        assertEquals(10L, response.getUserId());
        assertEquals("LEARNER", response.getRole());
    }
}