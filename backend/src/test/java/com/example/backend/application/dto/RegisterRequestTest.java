package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RegisterRequestTest {

    @Test
    void settersAndGettersWork() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane@test.com");
        request.setPassword("secure");
        request.setRoles(List.of("LEARNER"));

        assertEquals("Jane", request.getFirstName());
        assertEquals("Doe", request.getLastName());
        assertEquals("jane@test.com", request.getEmail());
        assertEquals("secure", request.getPassword());
        assertEquals(1, request.getRoles().size());
    }
}