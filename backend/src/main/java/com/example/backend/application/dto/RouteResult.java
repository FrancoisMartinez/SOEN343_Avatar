package com.example.backend.application.dto;

import java.util.List;

public record RouteResult(
        List<double[]> polyline,
        double distanceKm,
        int durationMin,
        TransportMode mode,
        List<JourneyLeg> legs
) {
    public RouteResult {
        polyline = List.copyOf(polyline);
        legs = List.copyOf(legs);
    }
}
