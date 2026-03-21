package com.example.backend.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityConfigTest {

    @Test
    void corsConfigurationSourceContainsExpectedOrigin() {
        SecurityConfig config = new SecurityConfig();

        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration corsConfiguration = source.getCorsConfiguration(new MockHttpServletRequest());

        assertNotNull(corsConfiguration);
        assertTrue(corsConfiguration.getAllowedOrigins().contains("http://localhost:5173"));
    }

    @Test
    void passwordEncoderEncodesAndMatches() {
        SecurityConfig config = new SecurityConfig();

        PasswordEncoder encoder = config.passwordEncoder();
        String encoded = encoder.encode("plain-password");

        assertTrue(encoder.matches("plain-password", encoded));
    }
}