package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.domain.service.RoutingUnavailableException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class OSRMAdapter {

    private static final String OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS = 10_000;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OSRMAdapter() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
    }

    /** Package-private constructor for unit testing. */
    OSRMAdapter(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Fetch driving directions between two coordinates using the public OSRM API.
     *
     * @return RouteResult with polyline [[lat, lon], ...], distanceKm, durationMin
     * @throws RuntimeException if OSRM is unreachable or returns no route
     */
    public RouteResult getDirections(double fromLat, double fromLon, double toLat, double toLon) {
        // Use Locale.US to ensure decimal points in the URL regardless of JVM locale
        String url = String.format(Locale.US,
                "%s/%f,%f;%f,%f?overview=full&geometries=geojson&steps=true",
                OSRM_BASE, fromLon, fromLat, toLon, toLat
        );

        String response;
        try {
            response = restTemplate.getForObject(url, String.class);
        } catch (Exception e) {
            throw new RoutingUnavailableException("Routing service unavailable", e);
        }

        try {
            JsonNode root = objectMapper.readTree(response);
            String code = root.path("code").asText();
            if (!"Ok".equals(code)) {
                throw new IllegalStateException("No route found between the specified locations");
            }

            JsonNode route = root.path("routes").get(0);
            double distanceMeters = route.path("distance").asDouble();
            double durationSeconds = route.path("duration").asDouble();

            // OSRM returns coordinates as [lon, lat] — convert to [lat, lon] for Leaflet
            JsonNode coordinates = route.path("geometry").path("coordinates");
            List<double[]> polyline = new ArrayList<>();
            for (JsonNode coord : coordinates) {
                double lon = coord.get(0).asDouble();
                double lat = coord.get(1).asDouble();
                polyline.add(new double[]{lat, lon});
            }

            List<com.example.backend.application.dto.RouteStep> steps = new ArrayList<>();
            JsonNode legs = route.path("legs");
            if (legs.isArray() && !legs.isEmpty()) {
                JsonNode osrmSteps = legs.get(0).path("steps");
                if (osrmSteps.isArray()) {
                    for (JsonNode step : osrmSteps) {
                        JsonNode maneuver = step.path("maneuver");
                        String type = maneuver.path("type").asText("");
                        String modifier = maneuver.path("modifier").asText("");
                        String name = step.path("name").asText("");
                        double stepDistKm = Math.round((step.path("distance").asDouble(0) / 1000.0) * 10.0) / 10.0;
                        int stepDurMin = (int) Math.ceil(step.path("duration").asDouble(0) / 60.0);
                        
                        String instruction = type;
                        if (!modifier.isEmpty()) {
                            instruction += " " + modifier;
                        }
                        if (!name.isEmpty()) {
                            instruction += " onto " + name;
                        }

                        // Capitalize first letter
                        if (!instruction.isEmpty()) {
                            instruction = instruction.substring(0, 1).toUpperCase() + instruction.substring(1);
                        }

                        steps.add(new com.example.backend.application.dto.RouteStep(instruction, stepDistKm, stepDurMin, "DRIVING"));
                    }
                }
            }

            double distanceKm = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
            int durationMin = (int) Math.ceil(durationSeconds / 60.0);

            return new RouteResult(polyline, distanceKm, durationMin, steps);

        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RoutingUnavailableException("Failed to parse routing response", e);
        }
    }
}
