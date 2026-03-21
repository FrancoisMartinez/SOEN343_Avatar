package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WeeklyAvailabilityResponseTest {

    @Test
    void constructorSetsFields() {
        AvailabilitySlotDto slot = new AvailabilitySlotDto(1L, "MONDAY", "08:00", "09:00", true);
        WeeklyAvailabilityResponse response = new WeeklyAvailabilityResponse(9L, true, List.of(slot));

        assertEquals(9L, response.getCarId());
        assertTrue(response.isAvailable());
        assertEquals(1, response.getSlots().size());
        assertEquals("MONDAY", response.getSlots().get(0).getDayOfWeek());
    }
}