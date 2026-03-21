package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CarDtoTest {

    @Test
    void constructorSetsFields() {
        CarDto dto = new CarDto(7L, "Corolla", "MANUAL", "Quebec", 46.8, -71.2, true, 55.0);

        assertEquals(7L, dto.getId());
        assertEquals("Corolla", dto.getMakeModel());
        assertEquals("MANUAL", dto.getTransmissionType());
        assertEquals("Quebec", dto.getLocation());
        assertEquals(46.8, dto.getLatitude());
        assertEquals(-71.2, dto.getLongitude());
        assertTrue(dto.isAvailable());
        assertEquals(55.0, dto.getHourlyRate());
    }
}