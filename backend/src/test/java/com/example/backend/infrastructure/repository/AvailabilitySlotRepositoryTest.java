package com.example.backend.infrastructure.repository;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AvailabilitySlotRepositoryTest {

    @Test
    void repositoryDeclaresCustomMethods() throws NoSuchMethodException {
        Method findByCarId = AvailabilitySlotRepository.class
                .getMethod("findByCarIdOrderByDayOfWeekAscStartMinuteAsc", Long.class);
        Method deleteByCarId = AvailabilitySlotRepository.class
                .getMethod("deleteByCarId", Long.class);

        assertEquals(List.class, findByCarId.getReturnType());
        assertEquals(void.class, deleteByCarId.getReturnType());
    }
}