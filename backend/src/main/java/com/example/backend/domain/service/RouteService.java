package com.example.backend.domain.service;

import com.example.backend.application.dto.ParkingSpot;
import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.infrastructure.adapter.HereTransitAdapter;
import com.example.backend.infrastructure.adapter.OSRMAdapter;
import com.example.backend.infrastructure.adapter.OverpassAdapter;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RouteService {

    private static final int MAX_PARKING_RADIUS_METERS = 1_000;

    private final OSRMAdapter osrmAdapter;
    private final HereTransitAdapter hereTransitAdapter;
    private final OverpassAdapter overpassAdapter;

    public RouteService(OSRMAdapter osrmAdapter, HereTransitAdapter hereTransitAdapter,
            OverpassAdapter overpassAdapter) {
        this.osrmAdapter = osrmAdapter;
        this.hereTransitAdapter = hereTransitAdapter;
        this.overpassAdapter = overpassAdapter;
    }

    /**
     * Get directions between two geographic coordinates for the given transport
     * mode.
     * BUS mode uses the HERE Transit API; all other modes use OSRM.
     *
     * @throws IllegalArgumentException if any coordinate is out of valid geographic
     *                                  range
     */
    public RouteResult getDirections(double fromLat, double fromLon, double toLat, double toLon, TransportMode mode) {
        validateCoordinates(fromLat, fromLon, "origin");
        validateCoordinates(toLat, toLon, "destination");
        if (mode == TransportMode.BUS) {
            return hereTransitAdapter.getTransitDirections(fromLat, fromLon, toLat, toLon);
        }
        return osrmAdapter.getDirections(fromLat, fromLon, toLat, toLon, mode);
    }

    /**
     * Get public parking spots within a radius of the given coordinates.
     * Radius is capped at 1 000 m to keep Overpass queries fast.
     *
     * @throws IllegalArgumentException if coordinates are out of valid geographic
     *                                  range
     */
    public List<ParkingSpot> getParkingNearby(double lat, double lon, int radiusMeters) {
        validateCoordinates(lat, lon, "search location");
        int clampedRadius = Math.min(Math.max(radiusMeters, 1), MAX_PARKING_RADIUS_METERS);
        return overpassAdapter.getParkingNearby(lat, lon, clampedRadius);
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
