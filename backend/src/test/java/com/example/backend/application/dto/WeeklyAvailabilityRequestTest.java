package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WeeklyAvailabilityRequestTest {

    @Test
    void settersAndGettersWork() {
        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        AvailabilitySlotRequest slotRequest = new AvailabilitySlotRequest();
        slotRequest.setDayOfWeek("MONDAY");
        request.setSlots(List.of(slotRequest));

        assertEquals(1, request.getSlots().size());
        assertEquals("MONDAY", request.getSlots().get(0).getDayOfWeek());
    }
}