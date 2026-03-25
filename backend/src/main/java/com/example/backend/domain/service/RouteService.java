package com.example.backend.domain.service;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.infrastructure.adapter.OSRMAdapter;
import com.example.backend.infrastructure.adapter.OTPAdapter;
import org.springframework.stereotype.Service;

@Service
public class RouteService {

    private final OSRMAdapter osrmAdapter;
    private final OTPAdapter otpAdapter;

    public RouteService(OSRMAdapter osrmAdapter, OTPAdapter otpAdapter) {
        this.osrmAdapter = osrmAdapter;
        this.otpAdapter = otpAdapter;
    }

    /**
     * Get driving directions between two geographic coordinates.
     *
     * @throws IllegalArgumentException if any coordinate is out of valid geographic range
     */
    public RouteResult getDirections(double fromLat, double fromLon, double toLat, double toLon) {
        validateCoordinates(fromLat, fromLon, "origin");
        validateCoordinates(toLat, toLon, "destination");
        return osrmAdapter.getDirections(fromLat, fromLon, toLat, toLon);
    }

    /**
     * Get transit directions between two geographic coordinates.
     *
     * @throws IllegalArgumentException if any coordinate is out of valid geographic range
     */
    public RouteResult getTransitDirections(double fromLat, double fromLon, double toLat, double toLon) {
        validateCoordinates(fromLat, fromLon, "origin");
        validateCoordinates(toLat, toLon, "destination");
        return otpAdapter.getTransitDirections(fromLat, fromLon, toLat, toLon);
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
