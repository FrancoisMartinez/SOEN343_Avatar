package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class AvailabilitySlotTest {

    @Test
    void settersAndGettersWork() {
        AvailabilitySlot slot = new AvailabilitySlot();
        Car car = mock(Car.class);

        slot.setId(3L);
        slot.setCar(car);
        slot.setDayOfWeek(DayOfWeek.MONDAY);
        slot.setStartMinute(480);
        slot.setEndMinute(540);
        slot.setAvailable(true);

        assertEquals(3L, slot.getId());
        assertEquals(car, slot.getCar());
        assertEquals(DayOfWeek.MONDAY, slot.getDayOfWeek());
        assertEquals(480, slot.getStartMinute());
        assertEquals(540, slot.getEndMinute());
        assertTrue(slot.isAvailable());
    }
}