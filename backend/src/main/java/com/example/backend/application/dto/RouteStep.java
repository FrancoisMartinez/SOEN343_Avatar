package com.example.backend.application.dto;

public record RouteStep(
        String instruction,
        double distanceKm,
        int durationMin,
        String mode
) {
}
