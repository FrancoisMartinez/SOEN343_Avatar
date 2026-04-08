package com.example.backend.domain.service;

import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.model.Car;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarProviderRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CarServiceTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private CarProviderRepository carProviderRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private CarService carService;

    @Test
    void searchCarsFiltersByDayOfWeekOnly() {
        Car car1 = new Car();
        car1.setId(1L);
        car1.setAvailable(true);
        car1.setHourlyRate(50.0);
        
        AvailabilitySlot slot1 = new AvailabilitySlot();
        slot1.setDayOfWeek(DayOfWeek.MONDAY);
        slot1.setAvailable(true);
        car1.setAvailabilitySlots(List.of(slot1));

        Car car2 = new Car();
        car2.setId(2L);
        car2.setAvailable(true);
        car2.setHourlyRate(60.0);
        
        AvailabilitySlot slot2 = new AvailabilitySlot();
        slot2.setDayOfWeek(DayOfWeek.TUESDAY);
        slot2.setAvailable(true);
        car2.setAvailabilitySlots(List.of(slot2));

        when(carRepository.findAll()).thenReturn(List.of(car1, car2));

        var results = carService.searchCars(null, null, null, null, null, null, null, "MONDAY", null, null);

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getId());
    }

    @Test
    void searchCarsFiltersByDayAndTime() {
        Car car1 = new Car();
        car1.setId(1L);
        car1.setAvailable(true);
        car1.setHourlyRate(50.0);
        
        AvailabilitySlot slot1 = new AvailabilitySlot();
        slot1.setDayOfWeek(DayOfWeek.MONDAY);
        slot1.setAvailable(true);
        slot1.setStartMinute(480); // 08:00
        slot1.setEndMinute(1080);  // 18:00
        car1.setAvailabilitySlots(List.of(slot1));

        when(carRepository.findAll()).thenReturn(List.of(car1));

        // Within range
        var results = carService.searchCars(null, null, null, null, null, null, null, "MONDAY", 600, 720);
        assertEquals(1, results.size());

        // Outside range
        results = carService.searchCars(null, null, null, null, null, null, null, "MONDAY", 300, 400);
        assertEquals(0, results.size());
    }
}
