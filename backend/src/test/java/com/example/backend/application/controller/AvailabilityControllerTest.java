package com.example.backend.application.controller;

import com.example.backend.application.dto.WeeklyAvailabilityRequest;
import com.example.backend.application.dto.WeeklyAvailabilityResponse;
import com.example.backend.domain.service.AvailabilityService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AvailabilityControllerTest {

    @Test
    void getAvailabilityReturnsOkWhenServiceSucceeds() {
        AvailabilityService service = mock(AvailabilityService.class);
        AvailabilityController controller = new AvailabilityController(service);
        WeeklyAvailabilityResponse expected = new WeeklyAvailabilityResponse(5L, true, List.of());

        when(service.getWeeklyAvailability(1L, 5L)).thenReturn(expected);

        ResponseEntity<?> response = controller.getAvailability(1L, 5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expected, response.getBody());
    }

    @Test
    void updateAvailabilityReturnsBadRequestWhenServiceThrows() {
        AvailabilityService service = mock(AvailabilityService.class);
        AvailabilityController controller = new AvailabilityController(service);
        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();

        when(service.replaceWeeklyAvailability(1L, 5L, request)).thenThrow(new RuntimeException("invalid update"));

        ResponseEntity<?> response = controller.updateAvailability(1L, 5L, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}