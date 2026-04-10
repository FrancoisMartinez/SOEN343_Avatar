package com.example.backend.application.controller;

import com.example.backend.application.dto.UserProfileResponse;
import com.example.backend.domain.service.UserService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import com.example.backend.infrastructure.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApiRequestMetricsStore apiRequestMetricsStore;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtUtil jwtUtil;

    private Claims createClaims(Long userId) {
        return Jwts.claims()
                .subject(userId.toString())
                .add("role", "LEARNER")
                .build();
    }

    @Test
    void getProfileReturnsUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getProfileReturnsOk() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L));

        UserProfileResponse profile = new UserProfileResponse(1L, "Alice", "alice@example.com",
                null, null, null, "LEARNER", 100.0, null, null, null);
        when(userService.getUserProfile(1L)).thenReturn(profile);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Alice"))
                .andExpect(jsonPath("$.balance").value(100.0));
    }

    @Test
    void updateProfileReturnsOk() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L));

        UserProfileResponse profile = new UserProfileResponse(1L, "New Name", "alice@example.com",
                null, null, null, "LEARNER", 100.0, null, null, null);
        when(userService.updateUserProfile(eq(1L), any())).thenReturn(profile);

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer valid-token")
                        .contentType("application/json")
                        .content("{\"fullName\":\"New Name\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("New Name"));
    }

    @Test
    void updateProfileReturnsUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .contentType("application/json")
                        .content("{\"fullName\":\"Test\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addBalanceReturnsOk() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L));

        UserProfileResponse profile = new UserProfileResponse(1L, "Alice", "alice@example.com",
                null, null, null, "LEARNER", 150.0, null, null, null);
        when(userService.addBalance(1L, 50.0)).thenReturn(profile);

        mockMvc.perform(post("/api/users/me/balance")
                        .header("Authorization", "Bearer valid-token")
                        .contentType("application/json")
                        .content("{\"amount\":50.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(150.0));
    }

    @Test
    void addBalanceReturnsBadRequestWhenAmountMissing() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L));

        mockMvc.perform(post("/api/users/me/balance")
                        .header("Authorization", "Bearer valid-token")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Amount is required"));
    }

    @Test
    void addBalanceReturnsBadRequestOnNegativeAmount() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L));
        when(userService.addBalance(1L, -10.0))
                .thenThrow(new IllegalArgumentException("Amount must be positive"));

        mockMvc.perform(post("/api/users/me/balance")
                        .header("Authorization", "Bearer valid-token")
                        .contentType("application/json")
                        .content("{\"amount\":-10.0}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addBalanceReturnsUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(post("/api/users/me/balance")
                        .contentType("application/json")
                        .content("{\"amount\":50.0}"))
                .andExpect(status().isUnauthorized());
    }
}
