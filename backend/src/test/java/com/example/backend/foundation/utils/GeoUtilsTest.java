package com.example.backend.foundation.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GeoUtilsTest {

    @Test
    void samePointReturnsZero() {
        double distance = GeoUtils.calculateDistance(45.5, -73.6, 45.5, -73.6);
        assertEquals(0.0, distance, 0.001);
    }

    @Test
    void knownDistanceMontrelToToronto() {
        // Montreal (45.5017, -73.5673) to Toronto (43.6532, -79.3832)
        double distance = GeoUtils.calculateDistance(45.5017, -73.5673, 43.6532, -79.3832);
        // Approximately 504 km
        assertTrue(distance > 490 && distance < 520);
    }

    @Test
    void symmetricDistance() {
        double d1 = GeoUtils.calculateDistance(45.5, -73.6, 43.6, -79.4);
        double d2 = GeoUtils.calculateDistance(43.6, -79.4, 45.5, -73.6);
        assertEquals(d1, d2, 0.001);
    }

    @Test
    void shortDistanceIsAccurate() {
        // ~1 km apart
        double distance = GeoUtils.calculateDistance(45.5, -73.6, 45.509, -73.6);
        assertTrue(distance > 0.9 && distance < 1.1);
    }
}
