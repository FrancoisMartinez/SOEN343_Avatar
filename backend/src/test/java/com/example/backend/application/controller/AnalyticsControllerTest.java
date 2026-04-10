package com.example.backend.application.controller;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.application.dto.DashboardAnalyticsDTO;
import com.example.backend.domain.service.AnalyticsService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import com.example.backend.foundation.analytics.EndpointMetricsSummary;
import com.example.backend.foundation.analytics.ServiceMetricsAggregator;
import com.example.backend.infrastructure.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@AutoConfigureMockMvc(addFilters = false)
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    @MockitoBean
    private ServiceMetricsAggregator serviceMetricsAggregator;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private ApiRequestMetricsStore apiRequestMetricsStore;

    private Claims createClaims(Long userId, String role) {
        return Jwts.claims()
                .subject(userId.toString())
                .add("role", role)
                .build();
    }

    @Test
    void getDashboardReturnsUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/analytics/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getDashboardReturnsAdminDashboard() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L, "ADMIN"));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", 10L);
        DashboardAnalyticsDTO dto = new DashboardAnalyticsDTO(stats, new HashMap<>());
        when(analyticsService.getAdminDashboard()).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalBookings").value(10));
    }

    @Test
    void getDashboardReturnsLearnerDashboard() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(5L, "LEARNER"));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", 3L);
        DashboardAnalyticsDTO dto = new DashboardAnalyticsDTO(stats, new HashMap<>());
        when(analyticsService.getLearnerDashboard(5L)).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalBookings").value(3));
    }

    @Test
    void getDashboardReturnsProviderDashboard() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(10L, "CAR_PROVIDER"));

        DashboardAnalyticsDTO dto = new DashboardAnalyticsDTO(new HashMap<>(), new HashMap<>());
        when(analyticsService.getProviderDashboard(10L)).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk());
    }

    @Test
    void getDashboardReturnsProviderDashboardForProviderRole() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(10L, "PROVIDER"));

        DashboardAnalyticsDTO dto = new DashboardAnalyticsDTO(new HashMap<>(), new HashMap<>());
        when(analyticsService.getProviderDashboard(10L)).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk());
    }

    @Test
    void getDashboardReturnsInstructorDashboard() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(7L, "INSTRUCTOR"));

        DashboardAnalyticsDTO dto = new DashboardAnalyticsDTO(new HashMap<>(), new HashMap<>());
        when(analyticsService.getInstructorDashboard(7L)).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk());
    }

    @Test
    void getDashboardReturnsForbiddenForUnsupportedRole() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L, "UNKNOWN_ROLE"));

        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getCarUtilizationReturnsUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/analytics/car-utilization"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getCarUtilizationForAdmin() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L, "ADMIN"));

        AnalyticsResponseDTO dto = new AnalyticsResponseDTO(List.of(), System.currentTimeMillis());
        when(analyticsService.getCarUtilizationAnalytics(any(), any())).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/car-utilization")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk());
    }

    @Test
    void getCarUtilizationForCarProvider() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(10L, "CAR_PROVIDER"));

        AnalyticsResponseDTO dto = new AnalyticsResponseDTO(List.of(), System.currentTimeMillis());
        when(analyticsService.getCarUtilizationAnalyticsByProvider(any(), any(), any())).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/car-utilization")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk());
    }

    @Test
    void getCarUtilizationReturnsForbiddenForLearner() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L, "LEARNER"));

        mockMvc.perform(get("/api/analytics/car-utilization")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getProviderCarUtilization() throws Exception {
        AnalyticsResponseDTO dto = new AnalyticsResponseDTO(List.of(), System.currentTimeMillis());
        when(analyticsService.getCarUtilizationAnalyticsByProvider(any(), any(), any())).thenReturn(dto);

        mockMvc.perform(get("/api/analytics/providers/10/car-utilization"))
                .andExpect(status().isOk());
    }

    @Test
    void getServiceHealth() throws Exception {
        when(serviceMetricsAggregator.aggregateByEndpoint()).thenReturn(List.of(
                new EndpointMetricsSummary("GET", "/api/cars", 100, 2, 15.5)
        ));

        mockMvc.perform(get("/api/analytics/service-health"))
                .andExpect(status().isOk());
    }

    @Test
    void getDashboardReturnsErrorOnException() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L, "ADMIN"));
        when(analyticsService.getAdminDashboard()).thenThrow(new RuntimeException("DB error"));

        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getCarUtilizationReturnsBadRequestOnRuntimeException() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(createClaims(1L, "ADMIN"));
        when(analyticsService.getCarUtilizationAnalytics(any(), any()))
                .thenThrow(new RuntimeException("Invalid date range"));

        mockMvc.perform(get("/api/analytics/car-utilization")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isBadRequest());
    }
}
