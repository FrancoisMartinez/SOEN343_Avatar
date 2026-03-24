package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AvailabilitySlotRequestTest {

    @Test
    void settersAndGettersWork() {
        AvailabilitySlotRequest request = new AvailabilitySlotRequest();
        request.setDayOfWeek("TUESDAY");
        request.setStartTime("10:00");
        request.setEndTime("11:00");
        request.setAvailable(false);

        assertEquals("TUESDAY", request.getDayOfWeek());
        assertEquals("10:00", request.getStartTime());
        assertEquals("11:00", request.getEndTime());
        assertEquals(false, request.isAvailable());
    }
}