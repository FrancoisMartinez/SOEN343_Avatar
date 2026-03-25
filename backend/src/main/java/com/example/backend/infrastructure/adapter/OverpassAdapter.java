package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.ParkingSpot;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class OverpassAdapter {

    private static final String OVERPASS_URL = "https://overpass-api.de/api/interpreter";
    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS = 15_000;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OverpassAdapter() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Fetch public parking spots within a radius of the given coordinates.
     *
     * @return List of ParkingSpot — at most 50 results
     * @throws RuntimeException if Overpass is unreachable or returns no data
     */
    public List<ParkingSpot> getParkingNearby(double lat, double lon, int radiusMeters) {
        String query = String.format(Locale.US,
                "[out:json][timeout:20];" +
                "(node[\"amenity\"=\"parking\"](around:%d,%f,%f);" +
                "way[\"amenity\"=\"parking\"](around:%d,%f,%f););" +
                "out center 50;",
                radiusMeters, lat, lon,
                radiusMeters, lat, lon
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<String> request = new HttpEntity<>("data=" + query, headers);

        String response;
        try {
            response = restTemplate.postForObject(OVERPASS_URL, request, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Parking service unavailable: " + e.getMessage());
        }

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode elements = root.path("elements");

            List<ParkingSpot> spots = new ArrayList<>();
            for (JsonNode element : elements) {
                double spotLat;
                double spotLon;

                // Ways have a "center" object; nodes have lat/lon directly
                if (element.has("center")) {
                    spotLat = element.path("center").path("lat").asDouble();
                    spotLon = element.path("center").path("lon").asDouble();
                } else {
                    spotLat = element.path("lat").asDouble();
                    spotLon = element.path("lon").asDouble();
                }

                String name = element.path("tags").path("name").asText("Public Parking");
                spots.add(new ParkingSpot(name, spotLat, spotLon));
            }
            return spots;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse parking response");
        }
    }
}
