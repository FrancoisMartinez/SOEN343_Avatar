package com.example.backend.domain.service;

import com.example.backend.application.dto.ParkingSpot;
import com.example.backend.application.dto.RouteResult;
import com.example.backend.infrastructure.adapter.OSRMAdapter;
import com.example.backend.infrastructure.adapter.OverpassAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock
    private OSRMAdapter osrmAdapter;

    @Mock
    private OverpassAdapter overpassAdapter;

    private RouteService routeService;

    @BeforeEach
    void setUp() {
        routeService = new RouteService(osrmAdapter, overpassAdapter);
    }

    @Test
    void getDirections_validCoordinates_delegatesToAdapter() {
        RouteResult expected = new RouteResult(
                List.of(new double[]{45.5, -73.6}, new double[]{45.51, -73.59}),
                1.2, 3
        );
        when(osrmAdapter.getDirections(45.5, -73.6, 45.51, -73.59)).thenReturn(expected);

        RouteResult result = routeService.getDirections(45.5, -73.6, 45.51, -73.59);

        assertEquals(expected, result);
        verify(osrmAdapter).getDirections(45.5, -73.6, 45.51, -73.59);
    }

    @Test
    void getDirections_latitudeTooHigh_throwsIllegalArgumentException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(91.0, 0.0, 45.0, -73.0));

        assertTrue(ex.getMessage().contains("latitude"));
    }

    @Test
    void getDirections_latitudeTooLow_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(-91.0, 0.0, 45.0, -73.0));
    }

    @Test
    void getDirections_longitudeTooHigh_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, 181.0, 45.0, -73.0));
    }

    @Test
    void getDirections_longitudeTooLow_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, -181.0, 45.0, -73.0));
    }

    @Test
    void getDirections_destinationLatitudeInvalid_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, -73.0, 95.0, -73.0));
    }

    @Test
    void getDirections_nanLatitude_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(Double.NaN, -73.0, 45.0, -73.0));
    }

    @Test
    void getDirections_infiniteLongitude_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, Double.POSITIVE_INFINITY, 45.0, -73.0));
    }

    @Test
    void getDirections_boundaryCoordinates_valid() {
        RouteResult expected = new RouteResult(List.of(new double[]{90.0, 180.0}), 0.0, 0);
        when(osrmAdapter.getDirections(90.0, 180.0, -90.0, -180.0)).thenReturn(expected);

        RouteResult result = routeService.getDirections(90.0, 180.0, -90.0, -180.0);

        assertEquals(expected, result);
    }

    // ── Parking tests ─────────────────────────────────────────────────────────

    @Test
    void getParkingNearby_validCoordinates_delegatesToAdapter() {
        List<ParkingSpot> expected = List.of(new ParkingSpot("P1", 45.5, -73.6));
        when(overpassAdapter.getParkingNearby(eq(45.5), eq(-73.6), eq(800))).thenReturn(expected);

        List<ParkingSpot> result = routeService.getParkingNearby(45.5, -73.6, 800);

        assertEquals(expected, result);
        verify(overpassAdapter).getParkingNearby(45.5, -73.6, 800);
    }

    @Test
    void getParkingNearby_radiusExceedsMax_clampsTo1000() {
        when(overpassAdapter.getParkingNearby(eq(45.5), eq(-73.6), eq(1000))).thenReturn(List.of());

        routeService.getParkingNearby(45.5, -73.6, 99999);

        verify(overpassAdapter).getParkingNearby(45.5, -73.6, 1000);
    }

    @Test
    void getParkingNearby_radiusBelowOne_clampsToOne() {
        when(overpassAdapter.getParkingNearby(eq(45.5), eq(-73.6), eq(1))).thenReturn(List.of());

        routeService.getParkingNearby(45.5, -73.6, 0);

        verify(overpassAdapter).getParkingNearby(45.5, -73.6, 1);
    }

    @Test
    void getParkingNearby_invalidLatitude_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getParkingNearby(91.0, -73.6, 500));
    }

    @Test
    void getParkingNearby_invalidLongitude_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getParkingNearby(45.5, 181.0, 500));
    }

    @Test
    void getParkingNearby_nanCoordinates_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getParkingNearby(Double.NaN, -73.6, 500));
    }

    @Test
    void getParkingNearby_noSpotsFound_returnsEmptyList() {
        when(overpassAdapter.getParkingNearby(eq(45.5), eq(-73.6), eq(500))).thenReturn(List.of());

        List<ParkingSpot> result = routeService.getParkingNearby(45.5, -73.6, 500);

        assertTrue(result.isEmpty());
    }
}
