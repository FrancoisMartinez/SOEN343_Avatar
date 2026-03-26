package com.example.backend.application.dto;

import java.util.List;

public record JourneyLeg(
        String type,           // "WALK" or "TRANSIT"
        String lineLabel,      // line name/number, null for WALK
        String transportMode,  // "bus", "subway", etc., null for WALK
        String fromStop,       // departure stop name, null for WALK
        String toStop,         // arrival stop name, null for WALK
        int durationMin,
        List<double[]> polyline
) {
    public JourneyLeg {
        polyline = List.copyOf(polyline);
    }
}
