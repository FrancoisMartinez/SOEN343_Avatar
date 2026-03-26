package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.ParkingSpot;
import com.example.backend.domain.service.ParkingUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OverpassAdapterTest {

    private static final String RESPONSE_WITH_NODE = """
            {
              "elements": [
                {
                  "type": "node",
                  "lat": 45.501,
                  "lon": -73.601,
                  "tags": { "name": "Lot A" }
                }
              ]
            }
            """;

    private static final String RESPONSE_WITH_WAY = """
            {
              "elements": [
                {
                  "type": "way",
                  "center": { "lat": 45.502, "lon": -73.602 },
                  "tags": {}
                }
              ]
            }
            """;

    private static final String RESPONSE_EMPTY = """
            { "elements": [] }
            """;

    private final RestTemplate restTemplate = mock(RestTemplate.class);
    private final OverpassAdapter adapter = new OverpassAdapter(restTemplate);

    @Test
    void getParkingNearby_nodeElement_returnsNamedSpot() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenReturn(RESPONSE_WITH_NODE);

        List<ParkingSpot> spots = adapter.getParkingNearby(45.5, -73.6, 800);

        assertEquals(1, spots.size());
        assertEquals("Lot A", spots.get(0).name());
        assertEquals(45.501, spots.get(0).lat(), 0.001);
        assertEquals(-73.601, spots.get(0).lon(), 0.001);
    }

    @Test
    void getParkingNearby_wayElement_usesCenterCoordinates() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenReturn(RESPONSE_WITH_WAY);

        List<ParkingSpot> spots = adapter.getParkingNearby(45.5, -73.6, 800);

        assertEquals(1, spots.size());
        assertEquals("Public Parking", spots.get(0).name());
        assertEquals(45.502, spots.get(0).lat(), 0.001);
        assertEquals(-73.602, spots.get(0).lon(), 0.001);
    }

    @Test
    void getParkingNearby_emptyResponse_returnsEmptyList() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenReturn(RESPONSE_EMPTY);

        List<ParkingSpot> spots = adapter.getParkingNearby(45.5, -73.6, 800);

        assertTrue(spots.isEmpty());
    }

    @Test
    void getParkingNearby_networkError_throwsParkingUnavailableException() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

        assertThrows(ParkingUnavailableException.class,
                () -> adapter.getParkingNearby(45.5, -73.6, 800));
    }

    @Test
    void getParkingNearby_malformedJson_throwsParkingUnavailableException() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenReturn("not-json{{");

        assertThrows(ParkingUnavailableException.class,
                () -> adapter.getParkingNearby(45.5, -73.6, 800));
    }
}
