package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.JourneyLeg;
import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.domain.service.NoRouteFoundException;
import com.example.backend.domain.service.RoutingUnavailableException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.time.OffsetDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class HereTransitAdapter {

    private static final Logger log = LoggerFactory.getLogger(HereTransitAdapter.class);

    private static final String HERE_TRANSIT_BASE = "https://transit.router.hereapi.com/v8/routes";
    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS = 15_000;
    private static final int HERE_MAX_ATTEMPTS = 3;
    private static final long HERE_RETRY_BACKOFF_MS = 200L;

    // HERE flexible polyline encoding table
    private static final String ENCODING_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public HereTransitAdapter(@Value("${here.api.key}") String apiKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
        this.apiKey = apiKey;
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("HERE API key is blank; HERE requests will fail with 401.");
        } else {
            log.info("HERE API key injected (length=" + apiKey.length() + ")");
        }
    }

    /** Package-private constructor for unit testing. */
    HereTransitAdapter(RestTemplate restTemplate, String apiKey) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
    }

    /**
     * Fetch public transit directions using the HERE Transit API v8.
     * Returns a route with individual legs (walking + transit sections).
     *
     * @return RouteResult with combined polyline, total duration, and per-leg
     *         breakdown
     * @throws NoRouteFoundException       if HERE returns no transit route
     * @throws RoutingUnavailableException if the service is unreachable or response
     *                                     is unparseable
     */
    public RouteResult getTransitDirections(double fromLat, double fromLon, double toLat, double toLon) {
        String url = String.format(Locale.US,
                "%s?origin=%f,%f&destination=%f,%f&return=polyline&apikey=%s",
                HERE_TRANSIT_BASE, fromLat, fromLon, toLat, toLon, apiKey);

        RoutingUnavailableException lastError = null;

        for (int attempt = 1; attempt <= HERE_MAX_ATTEMPTS; attempt++) {
            try {
                String response;
                try {
                    response = restTemplate.getForObject(url, String.class);
                } catch (HttpStatusCodeException httpEx) {
                    // Client errors (e.g., invalid API key) will not succeed on retry.
                    if (httpEx.getStatusCode().is4xxClientError()) {
                        throw new RoutingUnavailableException(
                                "Transit service unavailable (HTTP " + httpEx.getStatusCode() + ")", httpEx);
                    }
                    throw new RoutingUnavailableException(
                            "Transit service unavailable (HTTP " + httpEx.getStatusCode() + ")", httpEx);
                }

                JsonNode root = objectMapper.readTree(response);
                JsonNode routes = root.path("routes");
                if (!routes.isArray() || routes.isEmpty()) {
                    throw new NoRouteFoundException("No transit route found between the specified locations");
                }

                JsonNode sections = routes.get(0).path("sections");
                List<JourneyLeg> legs = new ArrayList<>();
                List<double[]> combinedPolyline = new ArrayList<>();
                int totalDurationSec = 0;

                for (JsonNode section : sections) {
                    String type = section.path("type").asText();
                    int durationSec = parseSectionDurationSeconds(section);
                    totalDurationSec += durationSec;
                    int durationMin = (int) Math.ceil(durationSec / 60.0);

                    String polylineEncoded = section.path("polyline").asText(null);
                    List<double[]> sectionPolyline = polylineEncoded != null
                            ? decodeFlexiblePolyline(polylineEncoded)
                            : List.of();
                    combinedPolyline.addAll(sectionPolyline);

                    List<String> subSteps = new ArrayList<>();
                    JsonNode actions = section.path("actions");
                    if (actions.isArray()) {
                        for (JsonNode action : actions) {
                            String instruction = action.path("instruction").asText(null);
                            if (instruction != null && !instruction.isBlank()) {
                                subSteps.add(instruction);
                            }
                        }
                    }

                    if ("pedestrian".equals(type) || "interchange".equals(type)) {
                        String fromStop = section.path("departure").path("place").path("name").asText(null);
                        String toStop = section.path("arrival").path("place").path("name").asText(null);
                        legs.add(new JourneyLeg("WALK", null, null, fromStop, toStop, durationMin, sectionPolyline, null, null, subSteps));
                    } else if ("transit".equals(type)) {
                        JsonNode transport = section.path("transport");
                        String lineLabel = transport.path("name").asText(null);
                        String transportMode = transport.path("mode").asText(null);
                        String fromStop = section.path("departure").path("place").path("name").asText(null);
                        String toStop = section.path("arrival").path("place").path("name").asText(null);
                        legs.add(new JourneyLeg("TRANSIT", lineLabel, transportMode, fromStop, toStop, durationMin,
                                sectionPolyline, null, null, subSteps));
                    }
                }

                int totalDurationMin = (int) Math.ceil(totalDurationSec / 60.0);
                double distanceKm = estimateDistanceKm(combinedPolyline);

                return new RouteResult(combinedPolyline, distanceKm, totalDurationMin, TransportMode.BUS, legs);
            } catch (NoRouteFoundException e) {
                // Not a transient failure.
                throw e;
            } catch (RoutingUnavailableException e) {
                lastError = e;

                // Retry only if it's not a 4xx client error.
                boolean isClientError = e.getCause() instanceof HttpStatusCodeException httpEx
                        && httpEx.getStatusCode().is4xxClientError();
                if (isClientError || attempt == HERE_MAX_ATTEMPTS) {
                    throw e;
                }

                try {
                    Thread.sleep(HERE_RETRY_BACKOFF_MS * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw e;
                }
            } catch (Exception e) {
                lastError = new RoutingUnavailableException("Transit service unavailable", e);

                if (attempt == HERE_MAX_ATTEMPTS) {
                    throw lastError;
                }

                try {
                    Thread.sleep(HERE_RETRY_BACKOFF_MS * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw lastError;
                }
            }
        }

        // Should be unreachable because loop always throws.
        throw lastError != null ? lastError : new RoutingUnavailableException("Transit service unavailable");
    }

    /**
     * HERE responses may omit `travelSummary.duration`.
     * If missing, fall back to computing duration from `departure.time` and
     * `arrival.time`.
     */
    private static int parseSectionDurationSeconds(JsonNode section) {
        JsonNode durationNode = section.path("travelSummary").path("duration");
        if (!durationNode.isMissingNode() && !durationNode.isNull()) {
            return durationNode.asInt(0);
        }

        JsonNode departureTimeNode = section.path("departure").path("time");
        JsonNode arrivalTimeNode = section.path("arrival").path("time");
        if (departureTimeNode.isMissingNode() || departureTimeNode.isNull()
                || arrivalTimeNode.isMissingNode() || arrivalTimeNode.isNull()) {
            return 0;
        }

        try {
            OffsetDateTime departure = OffsetDateTime.parse(departureTimeNode.asText());
            OffsetDateTime arrival = OffsetDateTime.parse(arrivalTimeNode.asText());
            long seconds = Duration.between(departure, arrival).getSeconds();
            return (int) Math.max(0L, seconds);
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Decode a HERE flexible polyline string to a list of [lat, lon] pairs.
     * See: https://github.com/heremaps/flexible-polyline
     */
    static List<double[]> decodeFlexiblePolyline(String encoded) {
        List<Long> values = new ArrayList<>();
        long result = 0;
        int shift = 0;

        for (int i = 0; i < encoded.length(); i++) {
            int val = ENCODING_TABLE.indexOf(encoded.charAt(i));
            if (val < 0) {
                throw new IllegalArgumentException("Invalid polyline character: " + encoded.charAt(i));
            }
            result |= (long) (val & 0x1F) << shift;
            if (val < 0x20) {
                values.add(result);
                result = 0;
                shift = 0;
            } else {
                shift += 5;
            }
        }

        if (values.size() < 2)
            return List.of();

        // values[0] = version, values[1] = header (precision | third_dim << 4 |
        // third_dim_precision << 7)
        long header = values.get(1);
        int precision = (int) (header & 0xF);
        int thirdDim = (int) ((header >> 4) & 0x7);
        double factor = Math.pow(10, precision);
        int step = thirdDim > 0 ? 3 : 2;

        List<double[]> polyline = new ArrayList<>();
        long lastLat = 0;
        long lastLon = 0;

        for (int i = 2; i + 1 < values.size(); i += step) {
            long latDelta = values.get(i);
            long lonDelta = values.get(i + 1);
            lastLat += (latDelta & 1) != 0 ? ~(latDelta >> 1) : (latDelta >> 1);
            lastLon += (lonDelta & 1) != 0 ? ~(lonDelta >> 1) : (lonDelta >> 1);
            polyline.add(new double[] { lastLat / factor, lastLon / factor });
        }

        return polyline;
    }

    private static double estimateDistanceKm(List<double[]> polyline) {
        double total = 0;
        for (int i = 1; i < polyline.size(); i++) {
            total += haversineKm(
                    polyline.get(i - 1)[0], polyline.get(i - 1)[1],
                    polyline.get(i)[0], polyline.get(i)[1]);
        }
        return Math.round(total * 10.0) / 10.0;
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
