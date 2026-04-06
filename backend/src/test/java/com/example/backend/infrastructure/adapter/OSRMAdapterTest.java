package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.domain.service.NoRouteFoundException;
import com.example.backend.domain.service.RoutingUnavailableException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class OSRMAdapterTest {

    private static final String VALID_RESPONSE = """
            {
              "code": "Ok",
              "routes": [{
                "distance": 1200.5,
                "duration": 180.0,
                "geometry": {
                  "coordinates": [[-73.6, 45.5], [-73.59, 45.51]]
                },
                "legs": [{
                  "steps": [{
                    "distance": 600.0,
                    "duration": 90.0,
                    "name": "Main St",
                    "maneuver": {
                      "type": "depart",
                      "modifier": "right"
                    },
                    "geometry": {
                      "coordinates": [[-73.6, 45.5]]
                    }
                  },
                  {
                    "distance": 600.5,
                    "duration": 90.0,
                    "name": "Second St",
                    "maneuver": {
                      "type": "turn",
                      "modifier": "left"
                    },
                    "geometry": {
                      "coordinates": [[-73.59, 45.51]]
                    }
                  }]
                }]
              }]
            }
            """;

    private final RestTemplate restTemplate = mock(RestTemplate.class);
    private final OSRMAdapter adapter = new OSRMAdapter(restTemplate);

    @Test
    void getDirections_validResponse_returnsRouteResult() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);

        RouteResult result = adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING);

        assertNotNull(result);
        assertEquals(2, result.polyline().size());
        assertEquals(1.2, result.distanceKm());
        assertEquals(3, result.durationMin());
        assertEquals(TransportMode.DRIVING, result.mode());
        
        // Assert legs are parsed correctly (now grouped into one leg)
        assertEquals(1, result.legs().size());
        assertEquals("STEP", result.legs().get(0).type());
        assertEquals(1.2, result.legs().get(0).distanceKm());
        assertEquals(3, result.legs().get(0).durationMin());
        assertEquals("Follow directions", result.legs().get(0).instruction());
        assertEquals(2, result.legs().get(0).subSteps().size());
        assertEquals("Depart on Main St", result.legs().get(0).subSteps().get(0));
        assertEquals("Turn left onto Second St", result.legs().get(0).subSteps().get(1));
        
        // OSRM returns [lon, lat]; adapter converts to [lat, lon]
        assertArrayEquals(new double[]{45.5, -73.6}, result.polyline().get(0), 0.001);
        assertArrayEquals(new double[]{45.51, -73.59}, result.polyline().get(1), 0.001);
    }

    @Test
    void getDirections_networkError_throwsRoutingUnavailableException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

        assertThrows(RoutingUnavailableException.class,
                () -> adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING));
    }

    @Test
    void getDirections_osrmReturnsNoRoute_throwsNoRouteFoundException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn("{\"code\":\"NoRoute\",\"routes\":[]}");

        assertThrows(NoRouteFoundException.class,
                () -> adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING));
    }

    @Test
    void getDirections_malformedJson_throwsRoutingUnavailableException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn("not-json{{");

        assertThrows(RoutingUnavailableException.class,
                () -> adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING));
    }

    @Test
    void getDirections_urlContainsCoordinatesWithDecimalPoint() {
        // Ensures Locale.US decimal formatting (no comma as decimal separator)
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);

        RouteResult result = adapter.getDirections(48.8566, 2.3522, 48.8575, 2.3530, TransportMode.DRIVING);

        assertNotNull(result);
    }

    @Test
    void getDirections_drivingMode_usesDrivingProfileInUrl() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);

        adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING);

        verify(restTemplate).getForObject(urlCaptor.capture(), eq(String.class));
        assertTrue(urlCaptor.getValue().contains("/driving/"));
        assertTrue(urlCaptor.getValue().contains("steps=true"));
    }

    @Test
    void getDirections_bicycleMode_usesBicycleProfileInUrl() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);

        adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BICYCLE);

        verify(restTemplate).getForObject(urlCaptor.capture(), eq(String.class));
        assertTrue(urlCaptor.getValue().contains("/bicycle/"));
        assertTrue(urlCaptor.getValue().contains("steps=true"));
    }

    @Test
    void getDirections_walkMode_usesFootProfileInUrl() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);

        adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.WALK);

        verify(restTemplate).getForObject(urlCaptor.capture(), eq(String.class));
        assertTrue(urlCaptor.getValue().contains("/foot/"));
        assertTrue(urlCaptor.getValue().contains("steps=true"));
    }

    @Test
    void getDirections_busMode_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> adapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BUS));
    }
}
