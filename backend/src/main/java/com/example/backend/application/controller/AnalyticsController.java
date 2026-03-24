package com.example.backend.application.controller;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.domain.service.AnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Get car utilization analytics for all cars.
     */
    @GetMapping("/car-utilization")
    public ResponseEntity<?> getCarUtilizationAnalytics() {
        try {
            AnalyticsResponseDTO response = analyticsService.getCarUtilizationAnalytics();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch analytics"));
        }
    }

    /**
     * Get car utilization analytics for a specific provider.
     */
    @GetMapping("/providers/{providerId}/car-utilization")
    public ResponseEntity<?> getProviderCarUtilizationAnalytics(@PathVariable Long providerId) {
        try {
            AnalyticsResponseDTO response = analyticsService.getCarUtilizationAnalyticsByProvider(providerId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch provider analytics"));
        }
    }
}
