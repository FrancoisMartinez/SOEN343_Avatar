package com.example.backend.application.dto;

import java.util.List;

public record RouteResult(
        List<double[]> polyline,
        double distanceKm,
        int durationMin,
        List<RouteStep> steps
) {
    public RouteResult {
        polyline = List.copyOf(polyline);
        steps = steps == null ? List.of() : List.copyOf(steps);
    }
}
