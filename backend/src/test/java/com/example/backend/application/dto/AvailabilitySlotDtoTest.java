package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AvailabilitySlotDtoTest {

    @Test
    void constructorSetsFields() {
        AvailabilitySlotDto dto = new AvailabilitySlotDto(1L, "MONDAY", "08:00", "09:00", true);

        assertEquals(1L, dto.getId());
        assertEquals("MONDAY", dto.getDayOfWeek());
        assertEquals("08:00", dto.getStartTime());
        assertEquals("09:00", dto.getEndTime());
        assertTrue(dto.isAvailable());
    }
}