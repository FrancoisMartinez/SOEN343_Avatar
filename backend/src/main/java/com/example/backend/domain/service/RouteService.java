package com.example.backend.domain.service;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.infrastructure.adapter.HereTransitAdapter;
import com.example.backend.infrastructure.adapter.OSRMAdapter;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RouteService {

    private static final Logger log = LoggerFactory.getLogger(RouteService.class);

    private final OSRMAdapter osrmAdapter;
    private final HereTransitAdapter hereTransitAdapter;

    public RouteService(OSRMAdapter osrmAdapter, HereTransitAdapter hereTransitAdapter) {
        this.osrmAdapter = osrmAdapter;
        this.hereTransitAdapter = hereTransitAdapter;
    }

    /**
     * Get directions between two geographic coordinates for the given transport mode.
     * BUS mode uses the HERE Transit API.
     * If HERE fails, the request fails (no OSRM fallback).
     *
     * @throws IllegalArgumentException if any coordinate is out of valid geographic range
     */
    public RouteResult getDirections(double fromLat, double fromLon, double toLat, double toLon, TransportMode mode) {
        validateCoordinates(fromLat, fromLon, "origin");
        validateCoordinates(toLat, toLon, "destination");
        if (mode == TransportMode.BUS) {
            return hereTransitAdapter.getTransitDirections(fromLat, fromLon, toLat, toLon);
        }
        return osrmAdapter.getDirections(fromLat, fromLon, toLat, toLon, mode);
    }

    private void validateCoordinates(double lat, double lon, String label) {
        if (Double.isNaN(lat) || Double.isInfinite(lat) || lat < -90 || lat > 90) {
            throw new IllegalArgumentException("Invalid latitude for " + label + ": " + lat);
        }
        if (Double.isNaN(lon) || Double.isInfinite(lon) || lon < -180 || lon > 180) {
            throw new IllegalArgumentException("Invalid longitude for " + label + ": " + lon);
        }
    }
}
