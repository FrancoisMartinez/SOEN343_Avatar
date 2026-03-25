package com.example.backend.application.controller;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.domain.service.RouteService;
import com.example.backend.domain.service.RoutingUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RouteControllerTest {

    private final RouteService routeService = mock(RouteService.class);
    private final RouteController controller = new RouteController(routeService);

    @Test
    void getDirections_validCoordinates_returns200WithRouteResult() {
        RouteResult result = new RouteResult(
                List.of(new double[]{45.5, -73.6}, new double[]{45.51, -73.59}),
                1.5, 5, List.of()
        );
        when(routeService.getDirections(45.5, -73.6, 45.51, -73.59)).thenReturn(result);

        ResponseEntity<?> response = controller.getDirections(45.5, -73.6, 45.51, -73.59);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(result, response.getBody());
    }

    @Test
    void getDirections_invalidCoordinates_returns400WithSafeMessage() {
        when(routeService.getDirections(999.0, 0.0, 45.0, -73.0))
                .thenThrow(new IllegalArgumentException("Invalid latitude for origin: 999.0"));

        ResponseEntity<?> response = controller.getDirections(999.0, 0.0, 45.0, -73.0);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertTrue(body.get("error").contains("Invalid coordinates"));
    }

    @Test
    void getDirections_routingServiceUnavailable_returns502WithSafeMessage() {
        when(routeService.getDirections(45.5, -73.6, 45.51, -73.59))
                .thenThrow(new RoutingUnavailableException("Routing service unavailable"));

        ResponseEntity<?> response = controller.getDirections(45.5, -73.6, 45.51, -73.59);

        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertEquals("Routing service is temporarily unavailable", body.get("error"));
    }

    @Test
    void getDirections_noRouteFound_returns400WithSafeMessage() {
        when(routeService.getDirections(45.5, -73.6, 45.51, -73.59))
                .thenThrow(new RuntimeException("No route found between the specified locations"));

        ResponseEntity<?> response = controller.getDirections(45.5, -73.6, 45.51, -73.59);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertEquals("No route found between the specified locations", body.get("error"));
    }
}
