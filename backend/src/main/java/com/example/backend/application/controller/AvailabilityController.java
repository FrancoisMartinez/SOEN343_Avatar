package com.example.backend.application.controller;

import com.example.backend.application.dto.WeeklyAvailabilityRequest;
import com.example.backend.application.dto.WeeklyAvailabilityResponse;
import com.example.backend.domain.service.AvailabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/providers/{providerId}/cars/{carId}/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public ResponseEntity<?> getAvailability(@PathVariable Long providerId, @PathVariable Long carId) {
        try {
            WeeklyAvailabilityResponse response = availabilityService.getWeeklyAvailability(providerId, carId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<?> updateAvailability(@PathVariable Long providerId,
            @PathVariable Long carId,
            @RequestBody WeeklyAvailabilityRequest request) {
        try {
            WeeklyAvailabilityResponse response = availabilityService.replaceWeeklyAvailability(providerId, carId,
                    request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
