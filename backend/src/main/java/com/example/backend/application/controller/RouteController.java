package com.example.backend.application.controller;

import com.example.backend.application.dto.ParkingSpot;
import com.example.backend.application.dto.RouteResult;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private static final Logger log = LoggerFactory.getLogger(RouteController.class);

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    /**
     * Get driving directions between two coordinates.
     *
     * GET /api/routes/directions?fromLat=&fromLon=&toLat=&toLon=
     */
    @GetMapping("/directions")
    public ResponseEntity<?> getDirections(
            @RequestParam double fromLat,
            @RequestParam double fromLon,
            @RequestParam double toLat,
            @RequestParam double toLon) {
        try {
            RouteResult result = routeService.getDirections(fromLat, fromLon, toLat, toLon);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid coordinates in directions request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid coordinates: " + e.getMessage()));
        } catch (RoutingUnavailableException e) {
            log.error("Routing service unavailable", e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Routing service is temporarily unavailable"));
        } catch (RuntimeException e) {
            log.warn("No route found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "No route found between the specified locations"));
        }
    }

    /**
     * Get public parking spots near a location.
     *
     * GET /api/routes/parking?lat=&lon=&radius=
     */
    @GetMapping("/parking")
    public ResponseEntity<?> getParkingNearby(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "800") int radius) {
        try {
            List<ParkingSpot> spots = routeService.getParkingNearby(lat, lon, radius);
            return ResponseEntity.ok(spots);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid coordinates in parking request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid coordinates: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Parking service unavailable: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Parking service is temporarily unavailable"));
        }
    }
}
