package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.JourneyLeg;
import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.domain.service.NoRouteFoundException;
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

    private static final String OSRM_DRIVING_BASE = "https://router.project-osrm.org/route/v1/driving";
    private static final String OSRM_BICYCLE_BASE = "https://routing.openstreetmap.de/routed-bike/route/v1/bicycle";
    private static final String OSRM_FOOT_BASE = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS = 50_000;

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
     * Fetch directions between two coordinates using the public OSRM API.
     * Supports DRIVING, BICYCLE, and WALK modes.
     *
     * @return RouteResult with polyline [[lat, lon], ...], distanceKm, durationMin
     * @throws NoRouteFoundException       if OSRM returns no route
     * @throws RoutingUnavailableException if the service is unreachable or response
     *                                     is unparseable
     */
    public RouteResult getDirections(double fromLat, double fromLon, double toLat, double toLon, TransportMode mode) {
        // Use Locale.US to ensure decimal points in the URL regardless of JVM locale
        String url = String.format(Locale.US,
                "%s/%f,%f;%f,%f?overview=full&geometries=geojson&steps=true",
                osrmBase(mode), fromLon, fromLat, toLon, toLat);

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
                throw new NoRouteFoundException("No route found between the specified locations");
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
                polyline.add(new double[] { lat, lon });
            }

            double distanceKm = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
            int durationMin = (int) Math.ceil(durationSeconds / 60.0);

            List<JourneyLeg> legs = new ArrayList<>();
            List<String> subSteps = new ArrayList<>();
            JsonNode osrmLegs = route.path("legs");
            if (osrmLegs.isArray() && osrmLegs.size() > 0) {
                JsonNode steps = osrmLegs.get(0).path("steps");
                if (steps.isArray()) {
                    for (JsonNode step : steps) {
                        subSteps.add(generateInstruction(step));
                    }
                }
            }
            
            // Create a single leg representing the entire route's steps
            if (!subSteps.isEmpty()) {
                legs.add(new JourneyLeg("STEP", null, null, null, null, durationMin, polyline, "Follow directions", distanceKm, subSteps));
            }

            return new RouteResult(polyline, distanceKm, durationMin, mode, legs);

        } catch (NoRouteFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RoutingUnavailableException("Failed to parse routing response", e);
        }
    }

    private static String generateInstruction(JsonNode step) {
        JsonNode maneuver = step.path("maneuver");
        String type = maneuver.path("type").asText("");
        String modifier = maneuver.path("modifier").asText("");
        String name = step.path("name").asText("");

        if ("depart".equalsIgnoreCase(type)) {
            return "Depart" + (!name.isEmpty() ? " on " + name : "");
        }
        if ("arrive".equalsIgnoreCase(type)) {
            return "Arrive at destination";
        }

        String action = "Continue";
        if ("turn".equalsIgnoreCase(type)) {
            action = "Turn " + modifier.replace("-", " ");
        } else if ("new name".equalsIgnoreCase(type)) {
            action = "Continue";
        } else if ("merge".equalsIgnoreCase(type)) {
            action = "Merge";
        } else if ("on ramp".equalsIgnoreCase(type)) {
            action = "Take the ramp";
        } else if ("off ramp".equalsIgnoreCase(type)) {
            action = "Take the exit";
        } else if ("fork".equalsIgnoreCase(type)) {
            action = "Keep " + modifier.replace("-", " ") + " at the fork";
        } else if ("end of road".equalsIgnoreCase(type)) {
            action = "Turn " + modifier.replace("-", " ") + " at the end of the road";
        } else if ("roundabout".equalsIgnoreCase(type) || "rotary".equalsIgnoreCase(type)) {
            action = "Enter the roundabout and take the " + modifier.replace("-", " ") + " exit";
        }

        if (!name.isEmpty()) {
            action += " onto " + name;
        }

        if (action.length() > 0) {
            action = action.substring(0, 1).toUpperCase() + action.substring(1);
        }

        return action;
    }

    private static String osrmBase(TransportMode mode) {
        return switch (mode) {
            case DRIVING -> OSRM_DRIVING_BASE;
            case BICYCLE -> OSRM_BICYCLE_BASE;
            case WALK -> OSRM_FOOT_BASE;
            case BUS -> throw new IllegalArgumentException("BUS mode is not supported by OSRM");
        };
    }
}
