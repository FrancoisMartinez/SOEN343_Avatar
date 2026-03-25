package com.example.backend.application.dto;

import java.util.List;

public record RouteResult(
        List<double[]> polyline,
        double distanceKm,
        int durationMin
) {
    public RouteResult {
        polyline = List.copyOf(polyline);
    }
}
