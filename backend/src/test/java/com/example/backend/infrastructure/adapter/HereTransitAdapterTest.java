package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.domain.service.NoRouteFoundException;
import com.example.backend.domain.service.RoutingUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HereTransitAdapterTest {

    // Verified HERE flexible polyline encoding for [(45.5, -73.6), (45.51, -73.59)]
    // Header: "BF" (version=1, precision=5), then two delta-encoded coordinate pairs
    private static final String POLYLINE_2PT = "BFg321I__mhOw-Bw-B";

    private static final String VALID_RESPONSE = """
            {
              "routes": [{
                "sections": [
                  {
                    "type": "pedestrian",
                    "departure": { "place": { "name": "Origin" } },
                    "arrival":   { "place": { "name": "Bus Stop Guy" } },
                    "travelSummary": { "duration": 300 },
                    "polyline": "%s"
                  },
                  {
                    "type": "transit",
                    "departure": { "place": { "name": "Bus Stop Guy" } },
                    "arrival":   { "place": { "name": "Berri-UQAM" } },
                    "travelSummary": { "duration": 720 },
                    "transport": { "mode": "bus", "name": "24" },
                    "polyline": "%s"
                  }
                ]
              }]
            }
            """.formatted(POLYLINE_2PT, POLYLINE_2PT);

    private static final String VALID_RESPONSE_NO_TRAVEL_SUMMARY = """
            {
              "routes": [{
                "sections": [
                  {
                    "type": "pedestrian",
                    "departure": {
                      "time": "2020-01-01T00:00:00-04:00",
                      "place": { "name": "Origin" }
                    },
                    "arrival": {
                      "time": "2020-01-01T00:05:00-04:00",
                      "place": { "name": "Bus Stop Guy" }
                    },
                    "polyline": "%s"
                  },
                  {
                    "type": "transit",
                    "departure": {
                      "time": "2020-01-01T00:05:00-04:00",
                      "place": { "name": "Bus Stop Guy" }
                    },
                    "arrival": {
                      "time": "2020-01-01T00:17:00-04:00",
                      "place": { "name": "Berri-UQAM" }
                    },
                    "transport": { "mode": "bus", "name": "24" },
                    "polyline": "%s"
                  }
                ]
              }]
            }
            """.formatted(POLYLINE_2PT, POLYLINE_2PT);

    private final RestTemplate restTemplate = mock(RestTemplate.class);
    private final HereTransitAdapter adapter = new HereTransitAdapter(restTemplate, "test-key");

    @Test
    void getTransitDirections_validResponse_returnsRouteWithLegs() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE);

        RouteResult result = adapter.getTransitDirections(45.5, -73.6, 45.51, -73.59);

        assertNotNull(result);
        assertEquals(TransportMode.BUS, result.mode());
        assertEquals(2, result.legs().size());

        // First leg: walking
        assertEquals("WALK", result.legs().get(0).type());
        assertNull(result.legs().get(0).lineLabel());
        assertEquals(5, result.legs().get(0).durationMin()); // 300s / 60 = 5

        // Second leg: transit
        assertEquals("TRANSIT", result.legs().get(1).type());
        assertEquals("24", result.legs().get(1).lineLabel());
        assertEquals("bus", result.legs().get(1).transportMode());
        assertEquals("Bus Stop Guy", result.legs().get(1).fromStop());
        assertEquals("Berri-UQAM", result.legs().get(1).toStop());
        assertEquals(12, result.legs().get(1).durationMin()); // 720s / 60 = 12

        // Combined polyline: 2 points per section × 2 sections = 4 total
        assertEquals(4, result.polyline().size());

        // Total duration: (300 + 720) / 60 = 17 min
        assertEquals(17, result.durationMin());
    }

    @Test
    void getTransitDirections_networkError_throwsRoutingUnavailableException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

        assertThrows(RoutingUnavailableException.class,
                () -> adapter.getTransitDirections(45.5, -73.6, 45.51, -73.59));
    }

    @Test
    void getTransitDirections_noRoutesInResponse_throwsNoRouteFoundException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn("{\"routes\":[]}");

        assertThrows(NoRouteFoundException.class,
                () -> adapter.getTransitDirections(45.5, -73.6, 45.51, -73.59));
    }

    @Test
    void getTransitDirections_malformedJson_throwsRoutingUnavailableException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn("not-json{{");

        assertThrows(RoutingUnavailableException.class,
                () -> adapter.getTransitDirections(45.5, -73.6, 45.51, -73.59));
    }

    @Test
    void getTransitDirections_whenTravelSummaryMissing_usesDepartureArrivalTimes() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(VALID_RESPONSE_NO_TRAVEL_SUMMARY);

        RouteResult result = adapter.getTransitDirections(45.5, -73.6, 45.51, -73.59);

        assertNotNull(result);
        assertEquals(TransportMode.BUS, result.mode());
        assertEquals(2, result.legs().size());

        // 5 minutes and 12 minutes computed from timestamps.
        assertEquals(5, result.legs().get(0).durationMin());
        assertEquals(12, result.legs().get(1).durationMin());
        assertEquals(17, result.durationMin());
    }

    @Test
    void decodeFlexiblePolyline_twoPoints_decodesCorrectly() {
        List<double[]> points = HereTransitAdapter.decodeFlexiblePolyline(POLYLINE_2PT);

        assertEquals(2, points.size());
        assertArrayEquals(new double[]{45.5, -73.6}, points.get(0), 0.00001);
        assertArrayEquals(new double[]{45.51, -73.59}, points.get(1), 0.00001);
    }

    @Test
    void decodeFlexiblePolyline_invalidCharacter_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> HereTransitAdapter.decodeFlexiblePolyline("BF!invalid"));
    }
}
