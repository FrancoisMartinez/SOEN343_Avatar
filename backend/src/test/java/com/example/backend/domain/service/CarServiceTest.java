package com.example.backend.domain.service;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.CarRequest;
import com.example.backend.domain.model.*;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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

    private Car createCar(Long id, String makeModel, double rate, boolean available) {
        Car car = new Car();
        car.setId(id);
        car.setMakeModel(makeModel);
        car.setHourlyRate(rate);
        car.setAvailable(available);
        car.setTransmissionType("AUTOMATIC");
        car.setLatitude(45.5);
        car.setLongitude(-73.6);
        car.setLocation("Downtown");
        return car;
    }

    private CarRequest createCarRequest() {
        CarRequest req = new CarRequest();
        req.setMakeModel("Toyota Corolla");
        req.setTransmissionType("AUTOMATIC");
        req.setLocation("Downtown");
        req.setLatitude(45.5);
        req.setLongitude(-73.6);
        req.setAvailable(true);
        req.setHourlyRate(50.0);
        return req;
    }

    // --- getCarsByProvider ---

    @Test
    void getCarsByProviderReturnsDtos() {
        Car car = createCar(1L, "Toyota", 50.0, true);
        when(carRepository.findByProviderId(10L)).thenReturn(List.of(car));

        List<CarDto> result = carService.getCarsByProvider(10L);
        assertEquals(1, result.size());
        assertEquals("Toyota", result.get(0).getMakeModel());
        assertEquals(50.0, result.get(0).getHourlyRate());
    }

    @Test
    void getCarsByProviderReturnsEmptyForUnknownProvider() {
        when(carRepository.findByProviderId(999L)).thenReturn(List.of());
        List<CarDto> result = carService.getCarsByProvider(999L);
        assertTrue(result.isEmpty());
    }

    // --- createCar ---

    @Test
    void createCarSuccessfully() {
        CarProvider provider = new CarProvider();
        provider.setId(10L);

        when(carProviderRepository.findById(10L)).thenReturn(Optional.of(provider));
        when(carRepository.save(any(Car.class))).thenAnswer(i -> {
            Car c = i.getArgument(0);
            c.setId(1L);
            return c;
        });

        CarDto result = carService.createCar(10L, createCarRequest());

        assertEquals(1L, result.getId());
        assertEquals("Toyota Corolla", result.getMakeModel());
        assertEquals("AUTOMATIC", result.getTransmissionType());
        assertEquals(50.0, result.getHourlyRate());
        assertTrue(result.isAvailable());
    }

    @Test
    void createCarThrowsWhenProviderNotFound() {
        when(carProviderRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> carService.createCar(999L, createCarRequest()));
    }

    // --- updateCar ---

    @Test
    void updateCarSuccessfully() {
        Car existing = createCar(1L, "Old Model", 40.0, false);
        when(carRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(carRepository.save(any(Car.class))).thenAnswer(i -> i.getArgument(0));

        CarRequest req = createCarRequest();
        CarDto result = carService.updateCar(1L, req);

        assertEquals("Toyota Corolla", result.getMakeModel());
        assertEquals(50.0, result.getHourlyRate());
    }

    @Test
    void updateCarThrowsWhenNotFound() {
        when(carRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> carService.updateCar(999L, createCarRequest()));
    }

    // --- deleteCar ---

    @Test
    void deleteCarSuccessfully() {
        CarProvider provider = new CarProvider();
        provider.setId(10L);
        Car car = createCar(1L, "Toyota", 50.0, true);
        car.setProvider(provider);

        when(carRepository.findById(1L)).thenReturn(Optional.of(car));
        when(bookingRepository.findByCarId(1L)).thenReturn(List.of());

        carService.deleteCar(10L, 1L);

        verify(carRepository).delete(car);
    }

    @Test
    void deleteCarDeletesAssociatedBookingsFirst() {
        CarProvider provider = new CarProvider();
        provider.setId(10L);
        Car car = createCar(1L, "Toyota", 50.0, true);
        car.setProvider(provider);

        Booking booking = new Booking();
        booking.setId(1L);

        when(carRepository.findById(1L)).thenReturn(Optional.of(car));
        when(bookingRepository.findByCarId(1L)).thenReturn(List.of(booking));

        carService.deleteCar(10L, 1L);

        verify(bookingRepository).deleteAll(List.of(booking));
        verify(carRepository).delete(car);
    }

    @Test
    void deleteCarThrowsWhenNotFound() {
        when(carRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> carService.deleteCar(10L, 999L));
    }

    @Test
    void deleteCarThrowsWhenProviderDoesNotOwnCar() {
        CarProvider provider = new CarProvider();
        provider.setId(10L);
        Car car = createCar(1L, "Toyota", 50.0, true);
        car.setProvider(provider);

        when(carRepository.findById(1L)).thenReturn(Optional.of(car));

        assertThrows(RuntimeException.class, () -> carService.deleteCar(999L, 1L));
    }

    @Test
    void deleteCarThrowsWhenCarHasNoProvider() {
        Car car = createCar(1L, "Toyota", 50.0, true);
        car.setProvider(null);

        when(carRepository.findById(1L)).thenReturn(Optional.of(car));

        assertThrows(RuntimeException.class, () -> carService.deleteCar(10L, 1L));
    }

    // --- searchCars ---

    @Test
    void searchCarsFiltersByTransmissionType() {
        Car auto = createCar(1L, "Toyota", 50.0, true);
        auto.setTransmissionType("AUTOMATIC");
        auto.setAvailabilitySlots(null);

        Car manual = createCar(2L, "Honda", 45.0, true);
        manual.setTransmissionType("MANUAL");
        manual.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(auto, manual));

        var results = carService.searchCars("AUTOMATIC", null, null, null, null, null, null, null, null, null);
        assertEquals(1, results.size());
        assertEquals("Toyota", results.get(0).getMakeModel());
    }

    @Test
    void searchCarsFiltersByMinPrice() {
        Car cheap = createCar(1L, "Cheap", 30.0, true);
        cheap.setAvailabilitySlots(null);
        Car expensive = createCar(2L, "Expensive", 80.0, true);
        expensive.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(cheap, expensive));

        var results = carService.searchCars(null, 50.0, null, null, null, null, null, null, null, null);
        assertEquals(1, results.size());
        assertEquals("Expensive", results.get(0).getMakeModel());
    }

    @Test
    void searchCarsFiltersByMaxPrice() {
        Car cheap = createCar(1L, "Cheap", 30.0, true);
        cheap.setAvailabilitySlots(null);
        Car expensive = createCar(2L, "Expensive", 80.0, true);
        expensive.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(cheap, expensive));

        var results = carService.searchCars(null, null, 50.0, null, null, null, null, null, null, null);
        assertEquals(1, results.size());
        assertEquals("Cheap", results.get(0).getMakeModel());
    }

    @Test
    void searchCarsFiltersByLocation() {
        Car nearby = createCar(1L, "Nearby", 50.0, true);
        nearby.setLatitude(45.5);
        nearby.setLongitude(-73.6);
        nearby.setAvailabilitySlots(null);

        Car farAway = createCar(2L, "Far", 50.0, true);
        farAway.setLatitude(40.0);
        farAway.setLongitude(-74.0);
        farAway.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(nearby, farAway));

        var results = carService.searchCars(null, null, null, null, 45.501, -73.601, 10.0, null, null, null);
        assertEquals(1, results.size());
        assertEquals("Nearby", results.get(0).getMakeModel());
    }

    @Test
    void searchCarsExcludesNullCoordinatesWhenLocationFiltered() {
        Car noCoords = createCar(1L, "NoCoords", 50.0, true);
        noCoords.setLatitude(null);
        noCoords.setLongitude(null);
        noCoords.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(noCoords));

        var results = carService.searchCars(null, null, null, null, 45.5, -73.6, 10.0, null, null, null);
        assertTrue(results.isEmpty());
    }

    @Test
    void searchCarsDefaultsToAvailableOnly() {
        Car available = createCar(1L, "Available", 50.0, true);
        available.setAvailabilitySlots(null);
        Car unavailable = createCar(2L, "Unavailable", 50.0, false);
        unavailable.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(available, unavailable));

        var results = carService.searchCars(null, null, null, null, null, null, null, null, null, null);
        assertEquals(1, results.size());
        assertEquals("Available", results.get(0).getMakeModel());
    }

    @Test
    void searchCarsShowsUnavailableWhenRequested() {
        Car unavailable = createCar(1L, "Unavailable", 50.0, false);
        unavailable.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(unavailable));

        var results = carService.searchCars(null, null, null, false, null, null, null, null, null, null);
        assertEquals(1, results.size());
    }

    @Test
    void searchCarsIgnoresInvalidDayOfWeek() {
        Car car = createCar(1L, "Toyota", 50.0, true);
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setDayOfWeek(DayOfWeek.MONDAY);
        slot.setAvailable(true);
        car.setAvailabilitySlots(List.of(slot));

        when(carRepository.findAll()).thenReturn(List.of(car));

        var results = carService.searchCars(null, null, null, null, null, null, null, "INVALID_DAY", null, null);
        assertEquals(1, results.size());
    }

    @Test
    void searchCarsExcludesCarWithNullSlotsWhenDayFiltered() {
        Car car = createCar(1L, "Toyota", 50.0, true);
        car.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(car));

        var results = carService.searchCars(null, null, null, null, null, null, null, "MONDAY", null, null);
        assertTrue(results.isEmpty());
    }

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

    @Test
    void searchCarsReturnsDtoWithAllFields() {
        Car car = createCar(1L, "Toyota Corolla", 55.0, true);
        car.setAvailabilitySlots(null);

        when(carRepository.findAll()).thenReturn(List.of(car));

        var results = carService.searchCars(null, null, null, null, null, null, null, null, null, null);
        assertEquals(1, results.size());
        CarDto dto = results.get(0);
        assertEquals(1L, dto.getId());
        assertEquals("Toyota Corolla", dto.getMakeModel());
        assertEquals("AUTOMATIC", dto.getTransmissionType());
        assertEquals("Downtown", dto.getLocation());
        assertEquals(45.5, dto.getLatitude());
        assertEquals(-73.6, dto.getLongitude());
        assertTrue(dto.isAvailable());
        assertEquals(55.0, dto.getHourlyRate());
    }
}
