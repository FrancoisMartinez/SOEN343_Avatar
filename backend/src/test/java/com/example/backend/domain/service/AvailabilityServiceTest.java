package com.example.backend.domain.service;

import com.example.backend.application.dto.AvailabilitySlotRequest;
import com.example.backend.application.dto.WeeklyAvailabilityRequest;
import com.example.backend.domain.model.Car;
import com.example.backend.domain.model.CarProvider;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    @Test
    void replaceWeeklyAvailabilityStoresProvidedSlots() {
        CarProvider provider = new CarProvider();
        provider.setId(7L);

        Car car = new Car();
        car.setId(11L);
        car.setProvider(provider);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        AvailabilitySlotRequest slot = new AvailabilitySlotRequest();
        slot.setDayOfWeek("MONDAY");
        slot.setStartTime("09:00");
        slot.setEndTime("11:00");
        slot.setAvailable(true);
        request.setSlots(List.of(slot));

        var response = availabilityService.replaceWeeklyAvailability(7L, 11L, request);

        assertEquals(11L, response.getCarId());
        assertEquals(true, response.isAvailable());
        assertEquals(1, response.getSlots().size());
        verify(availabilitySlotRepository).deleteByCarId(11L);
        verify(availabilitySlotRepository, times(1)).save(any());
    }

    @Test
    void replaceWeeklyAvailabilityRejectsOverlap() {
        CarProvider provider = new CarProvider();
        provider.setId(4L);

        Car car = new Car();
        car.setId(10L);
        car.setProvider(provider);

        when(carRepository.findById(10L)).thenReturn(Optional.of(car));

        AvailabilitySlotRequest first = new AvailabilitySlotRequest();
        first.setDayOfWeek("WEDNESDAY");
        first.setStartTime("10:00");
        first.setEndTime("11:00");
        first.setAvailable(true);

        AvailabilitySlotRequest second = new AvailabilitySlotRequest();
        second.setDayOfWeek("WEDNESDAY");
        second.setStartTime("10:30");
        second.setEndTime("12:00");
        second.setAvailable(true);

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(first, second));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(4L, 10L, request));
        verify(availabilitySlotRepository, never()).save(any());
    }
}
