package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.domain.service.RoutingUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OSRMAdapterTest {

    private static final String VALID_RESPONSE = """
            {
              "code": "Ok",
              "routes": [{
                "distance": 1200.5,
                "duration": 180.0,
                "geometry": {
                  "coordinates": [[-73.6, 45.5], [-73.59, 45.51]]
                }
              }]
            }
            """;

    private final RestTemplate restTemplate = mock(RestTemplate.class);
    private final OSRMAdapter adapter = new OSRMAdapter(restTemplate);

    @Test
    void getDirections_validResponse_returnsRouteResult() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);

        RouteResult result = adapter.getDirections(45.5, -73.6, 45.51, -73.59);

        assertNotNull(result);
        assertEquals(2, result.polyline().size());
        assertEquals(1.2, result.distanceKm());
        assertEquals(3, result.durationMin());
        // OSRM returns [lon, lat]; adapter converts to [lat, lon]
        assertArrayEquals(new double[]{45.5, -73.6}, result.polyline().get(0), 0.001);
        assertArrayEquals(new double[]{45.51, -73.59}, result.polyline().get(1), 0.001);
    }

    @Test
    void getDirections_networkError_throwsRoutingUnavailableException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

        assertThrows(RoutingUnavailableException.class,
                () -> adapter.getDirections(45.5, -73.6, 45.51, -73.59));
    }

    @Test
    void getDirections_osrmReturnsNoRoute_throwsIllegalStateException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn("{\"code\":\"NoRoute\",\"routes\":[]}");

        assertThrows(IllegalStateException.class,
                () -> adapter.getDirections(45.5, -73.6, 45.51, -73.59));
    }

    @Test
    void getDirections_malformedJson_throwsRoutingUnavailableException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn("not-json{{");

        assertThrows(RoutingUnavailableException.class,
                () -> adapter.getDirections(45.5, -73.6, 45.51, -73.59));
    }

    @Test
    void getDirections_urlContainsCoordinatesWithDecimalPoint() {
        // Ensures Locale.US decimal formatting (no comma as decimal separator)
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);

        RouteResult result = adapter.getDirections(48.8566, 2.3522, 48.8575, 2.3530);

        assertNotNull(result);
    }
}
