package com.example.backend.application.controller;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.domain.service.NoRouteFoundException;
import com.example.backend.domain.service.RouteService;
import com.example.backend.domain.service.RoutingUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private static final Logger log = LoggerFactory.getLogger(RouteController.class);
    private static final String ERROR_KEY = "error";

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    /**
     * Get directions between two coordinates for the given transport mode.
     *
     * GET /api/routes/directions?fromLat=&fromLon=&toLat=&toLon=&mode=DRIVING
     */
    @GetMapping("/directions")
    public ResponseEntity<?> getDirections(
            @RequestParam double fromLat,
            @RequestParam double fromLon,
            @RequestParam double toLat,
            @RequestParam double toLon,
            @RequestParam(defaultValue = "DRIVING") TransportMode mode) {
        try {
            RouteResult result = routeService.getDirections(fromLat, fromLon, toLat, toLon, mode);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid coordinates in directions request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(ERROR_KEY, "Invalid coordinates: " + e.getMessage()));
        } catch (RoutingUnavailableException e) {
            log.error("Routing service unavailable", e);
            String message = "Routing service is temporarily unavailable";
            Throwable cause = e.getCause();
            if (cause instanceof HttpStatusCodeException httpEx) {
                if (httpEx.getStatusCode().value() == 401) {
                    message = "HERE API key is invalid or missing";
                } else if (httpEx.getStatusCode().value() == 403) {
                    message = "HERE API key is not authorized";
                }
            } else if (cause != null) {
                // Helps debugging local issues (e.g., polyline decoding/parsing).
                message = cause.getClass().getSimpleName() + ": " + cause.getMessage();
            }
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(ERROR_KEY, message));
        } catch (NoRouteFoundException e) {
            log.warn("No route found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(ERROR_KEY, "No route found between the specified locations"));
        } catch (RuntimeException e) {
            log.warn("Unexpected routing error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(ERROR_KEY, "No route found between the specified locations"));
        }
    }
}
