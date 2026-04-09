package com.example.backend.application.controller;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.application.dto.DashboardAnalyticsDTO;
import com.example.backend.domain.service.AnalyticsService;
import com.example.backend.foundation.analytics.ServiceMetricsAggregator;
import com.example.backend.infrastructure.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ServiceMetricsAggregator serviceMetricsAggregator;
    private final JwtUtil jwtUtil;

    public AnalyticsController(AnalyticsService analyticsService, ServiceMetricsAggregator serviceMetricsAggregator, JwtUtil jwtUtil) {
        this.analyticsService = analyticsService;
        this.serviceMetricsAggregator = serviceMetricsAggregator;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Get the dynamic dashboard analytics for the current user
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid Authorization header"));
            }
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.validateToken(token);
            Long userId = Long.parseLong(claims.getSubject());
            String role = claims.get("role", String.class);

            DashboardAnalyticsDTO dashboard;
            switch (role) {
                case "ADMIN":
                    dashboard = analyticsService.getAdminDashboard();
                    break;
                case "LEARNER":
                    dashboard = analyticsService.getLearnerDashboard(userId);
                    break;
                case "CAR_PROVIDER":
                case "PROVIDER":
                    dashboard = analyticsService.getProviderDashboard(userId);
                    break;
                case "INSTRUCTOR":
                    dashboard = analyticsService.getInstructorDashboard(userId);
                    break;
                default:
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unsupported role for analytics"));
            }
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch dashboard: " + e.getMessage()));
        }
    }

    /**
     * Get car utilization analytics. Admins see all cars; Providers see only their own.
     */
    @GetMapping("/car-utilization")
    public ResponseEntity<?> getCarUtilizationAnalytics(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid Authorization header"));
            }
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.validateToken(token);
            Long userId = Long.parseLong(claims.getSubject());
            String role = claims.get("role", String.class);

            AnalyticsResponseDTO response;
            if ("ADMIN".equals(role)) {
                response = analyticsService.getCarUtilizationAnalytics(startDate, endDate);
            } else if ("CAR_PROVIDER".equals(role) || "PROVIDER".equals(role)) {
                response = analyticsService.getCarUtilizationAnalyticsByProvider(userId, startDate, endDate);
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You do not have permission to access car utilization metrics"));
            }
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch analytics: " + e.getMessage()));
        }
    }

    /**
     * Get car utilization analytics for a specific provider.
     */
    @GetMapping("/providers/{providerId}/car-utilization")
    public ResponseEntity<?> getProviderCarUtilizationAnalytics(
            @PathVariable Long providerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            AnalyticsResponseDTO response = analyticsService.getCarUtilizationAnalyticsByProvider(
                    providerId,
                    startDate,
                    endDate);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch provider analytics"));
        }
    }

    /**
     * Get aggregated service-level health metrics by endpoint.
     */
    @GetMapping("/service-health")
    public ResponseEntity<?> getServiceHealthAnalytics() {
        try {
            return ResponseEntity.ok(serviceMetricsAggregator.aggregateByEndpoint());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch service health analytics"));
        }
    }
}
