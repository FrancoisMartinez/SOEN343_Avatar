package com.example.backend.domain.service;

import com.example.backend.application.dto.RouteResult;
import com.example.backend.application.dto.TransportMode;
import com.example.backend.infrastructure.adapter.HereTransitAdapter;
import com.example.backend.infrastructure.adapter.OSRMAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock
    private OSRMAdapter osrmAdapter;

    @Mock
    private HereTransitAdapter hereTransitAdapter;

    private RouteService routeService;

    @BeforeEach
    void setUp() {
        routeService = new RouteService(osrmAdapter, hereTransitAdapter);
    }

    @Test
    void getDirections_drivingMode_delegatesToOsrmAdapter() {
        RouteResult expected = new RouteResult(
                List.of(new double[]{45.5, -73.6}, new double[]{45.51, -73.59}),
                1.2, 3, TransportMode.DRIVING, List.of()
        );
        when(osrmAdapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING)).thenReturn(expected);

        RouteResult result = routeService.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING);

        assertEquals(expected, result);
        verify(osrmAdapter).getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.DRIVING);
    }

    @Test
    void getDirections_busMode_delegatesToHereTransitAdapter() {
        RouteResult expected = new RouteResult(
                List.of(new double[]{45.5, -73.6}),
                1.0, 17, TransportMode.BUS, List.of()
        );
        when(hereTransitAdapter.getTransitDirections(45.5, -73.6, 45.51, -73.59)).thenReturn(expected);

        RouteResult result = routeService.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BUS);

        assertEquals(expected, result);
        verify(hereTransitAdapter).getTransitDirections(45.5, -73.6, 45.51, -73.59);
    }

    @Test
    void getDirections_busMode_whenHereTransitUnavailable_propagatesError() {
        when(hereTransitAdapter.getTransitDirections(45.5, -73.6, 45.51, -73.59))
                .thenThrow(new RoutingUnavailableException("Transit service unavailable"));
        assertThrows(RoutingUnavailableException.class,
                () -> routeService.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BUS));

        verify(hereTransitAdapter).getTransitDirections(45.5, -73.6, 45.51, -73.59);
        verify(osrmAdapter, never()).getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BUS);
    }

    @Test
    void getDirections_bicycleMode_delegatesToOsrmAdapter() {
        RouteResult expected = new RouteResult(
                List.of(new double[]{45.5, -73.6}),
                1.2, 5, TransportMode.BICYCLE, List.of()
        );
        when(osrmAdapter.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BICYCLE)).thenReturn(expected);

        RouteResult result = routeService.getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BICYCLE);

        assertEquals(expected, result);
        verify(osrmAdapter).getDirections(45.5, -73.6, 45.51, -73.59, TransportMode.BICYCLE);
    }

    @Test
    void getDirections_latitudeTooHigh_throwsIllegalArgumentException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(91.0, 0.0, 45.0, -73.0, TransportMode.DRIVING));

        assertTrue(ex.getMessage().contains("latitude"));
    }

    @Test
    void getDirections_latitudeTooLow_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(-91.0, 0.0, 45.0, -73.0, TransportMode.DRIVING));
    }

    @Test
    void getDirections_longitudeTooHigh_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, 181.0, 45.0, -73.0, TransportMode.DRIVING));
    }

    @Test
    void getDirections_longitudeTooLow_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, -181.0, 45.0, -73.0, TransportMode.DRIVING));
    }

    @Test
    void getDirections_destinationLatitudeInvalid_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, -73.0, 95.0, -73.0, TransportMode.DRIVING));
    }

    @Test
    void getDirections_nanLatitude_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(Double.NaN, -73.0, 45.0, -73.0, TransportMode.DRIVING));
    }

    @Test
    void getDirections_infiniteLongitude_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> routeService.getDirections(45.0, Double.POSITIVE_INFINITY, 45.0, -73.0, TransportMode.DRIVING));
    }

    @Test
    void getDirections_boundaryCoordinates_valid() {
        RouteResult expected = new RouteResult(
                List.of(new double[]{90.0, 180.0}), 0.0, 0, TransportMode.DRIVING, List.of()
        );
        when(osrmAdapter.getDirections(90.0, 180.0, -90.0, -180.0, TransportMode.DRIVING)).thenReturn(expected);

        RouteResult result = routeService.getDirections(90.0, 180.0, -90.0, -180.0, TransportMode.DRIVING);

        assertEquals(expected, result);
    }
}
