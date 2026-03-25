package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.domain.service.RoutingUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class OTPAdapter {

    private final RestTemplate restTemplate;

    @Value("${otp.url:http://localhost:8081/otp/routers/default}")
    private String otpUrl;

    public OTPAdapter() {
        this.restTemplate = new RestTemplate();
    }

    public RouteResult getTransitDirections(double fromLat, double fromLon, double toLat, double toLon) {
        String url = String.format("%s/plan?fromPlace=%f,%f&toPlace=%f,%f&mode=TRANSIT,WALK",
                otpUrl, fromLat, fromLon, toLat, toLon);

        try {
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            return parseOtpResponse(response);
        } catch (RestClientException e) {
            throw new RoutingUnavailableException("Failed to connect to OTP service", e);
        }
    }

    private RouteResult parseOtpResponse(Map<?, ?> response) {
        if (response == null || !response.containsKey("plan")) {
            throw new RuntimeException("No plan found in OTP response");
        }

        Map<?, ?> plan = (Map<?, ?>) response.get("plan");
        List<?> itineraries = (List<?>) plan.get("itineraries");

        if (itineraries == null || itineraries.isEmpty()) {
            throw new RuntimeException("No route found between locations");
        }

        // Take the first itinerary (usually the best/fastest)
        Map<?, ?> bestItinerary = (Map<?, ?>) itineraries.get(0);
        
        int durationMin = ((Number) bestItinerary.get("duration")).intValue() / 60;
        
        List<?> legs = (List<?>) bestItinerary.get("legs");
        List<double[]> fullPolyline = new ArrayList<>();
        List<com.example.backend.application.dto.RouteStep> steps = new ArrayList<>();
        double totalDistanceKm = 0.0;

        for (Object legObj : legs) {
            Map<?, ?> leg = (Map<?, ?>) legObj;
            double stepDistanceKm = ((Number) leg.get("distance")).doubleValue() / 1000.0;
            int stepDurationMin = (int) Math.ceil(((Number) leg.get("duration")).doubleValue() / 60.0);
            totalDistanceKm += stepDistanceKm;
            
            Map<?, ?> legGeometry = (Map<?, ?>) leg.get("legGeometry");
            if (legGeometry != null) {
                String points = (String) legGeometry.get("points");
                fullPolyline.addAll(decodePolyline(points));
            }

            String mode = (String) leg.get("mode");
            Map<?, ?> from = (Map<?, ?>) leg.get("from");
            Map<?, ?> to = (Map<?, ?>) leg.get("to");
            String toName = to != null ? (String) to.get("name") : "destination";
            
            String instruction;
            if ("WALK".equalsIgnoreCase(mode)) {
                instruction = "Walk to " + toName;
            } else {
                String route = (String) leg.get("route");
                if (route == null) route = "";
                instruction = "Take " + mode + " " + route + " to " + toName;
            }
            steps.add(new com.example.backend.application.dto.RouteStep(instruction, Math.round(stepDistanceKm * 10.0) / 10.0, stepDurationMin, mode));
        }

        return new RouteResult(fullPolyline, Math.round(totalDistanceKm * 10.0) / 10.0, durationMin, steps);
    }

    // Standard Google polyline decoding algorithm
    private List<double[]> decodePolyline(String encoded) {
        List<double[]> poly = new ArrayList<>();
        int index = 0, len = encoded.length();
        int lat = 0, lng = 0;

        while (index < len) {
            int b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            poly.add(new double[]{(lat / 1E5), (lng / 1E5)});
        }
        return poly;
    }
}
