package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AdminTest {

    @Test
    void adminHasCorrectRole() {
        Admin admin = new Admin();
        assertEquals("ADMIN", admin.getRole());
    }

    @Test
    void adminExtendsUser() {
        Admin admin = new Admin();
        admin.setFullName("Admin User");
        admin.setEmail("admin@test.com");

        assertEquals("Admin User", admin.getFullName());
        assertEquals("admin@test.com", admin.getEmail());
    }
}
