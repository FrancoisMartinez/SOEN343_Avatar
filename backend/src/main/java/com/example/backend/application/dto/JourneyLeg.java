package com.example.backend.application.dto;

import java.util.List;

public record JourneyLeg(
        String type,           // "WALK", "TRANSIT", or "STEP"
        String lineLabel,      // line name/number, null for WALK or STEP
        String transportMode,  // "bus", "subway", etc., null for WALK or STEP
        String fromStop,       // departure stop name, null for WALK or STEP
        String toStop,         // arrival stop name, null for WALK or STEP
        int durationMin,
        List<double[]> polyline,
        String instruction,    // turn-by-turn instruction, e.g. "Turn right on Main St"
        Double distanceKm,     // step distance
        List<String> subSteps  // detailed turn-by-turn steps
) {
    public JourneyLeg(String type, String lineLabel, String transportMode, String fromStop, String toStop, int durationMin, List<double[]> polyline) {
        this(type, lineLabel, transportMode, fromStop, toStop, durationMin, polyline, null, null, List.of());
    }

    public JourneyLeg(String type, String lineLabel, String transportMode, String fromStop, String toStop, int durationMin, List<double[]> polyline, String instruction, Double distanceKm) {
        this(type, lineLabel, transportMode, fromStop, toStop, durationMin, polyline, instruction, distanceKm, List.of());
    }

    public JourneyLeg {
        polyline = List.copyOf(polyline);
        subSteps = subSteps != null ? List.copyOf(subSteps) : List.of();
    }
}
