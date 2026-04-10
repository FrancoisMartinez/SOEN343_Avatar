package com.example.backend.domain.service;

import com.example.backend.application.dto.AvailabilitySlotRequest;
import com.example.backend.application.dto.WeeklyAvailabilityRequest;
import com.example.backend.application.dto.WeeklyAvailabilityResponse;
import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.model.Car;
import com.example.backend.domain.model.CarProvider;
import com.example.backend.domain.model.Instructor;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import com.example.backend.infrastructure.repository.InstructorRepository;
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
class AvailabilityServiceTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private InstructorRepository instructorRepository;

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    private Car createOwnedCar(Long carId, Long providerId) {
        CarProvider provider = new CarProvider();
        provider.setId(providerId);
        Car car = new Car();
        car.setId(carId);
        car.setProvider(provider);
        return car;
    }

    private AvailabilitySlotRequest createSlotRequest(String day, String start, String end, boolean available) {
        AvailabilitySlotRequest req = new AvailabilitySlotRequest();
        req.setDayOfWeek(day);
        req.setStartTime(start);
        req.setEndTime(end);
        req.setAvailable(available);
        return req;
    }

    private AvailabilitySlot createSlot(Long id, DayOfWeek day, int startMin, int endMin, boolean available) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setId(id);
        slot.setDayOfWeek(day);
        slot.setStartMinute(startMin);
        slot.setEndMinute(endMin);
        slot.setAvailable(available);
        return slot;
    }

    // --- getWeeklyAvailability ---

    @Test
    void getWeeklyAvailabilityReturnsSlots() {
        Car car = createOwnedCar(11L, 7L);
        AvailabilitySlot slot = createSlot(1L, DayOfWeek.MONDAY, 540, 1080, true);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(11L))
                .thenReturn(List.of(slot));

        WeeklyAvailabilityResponse response = availabilityService.getWeeklyAvailability(7L, 11L);

        assertEquals(11L, response.getCarId());
        assertEquals(1, response.getSlots().size());
        assertEquals("MONDAY", response.getSlots().get(0).getDayOfWeek());
        assertEquals("09:00", response.getSlots().get(0).getStartTime());
        assertEquals("18:00", response.getSlots().get(0).getEndTime());
    }

    @Test
    void getWeeklyAvailabilityThrowsWhenCarNotFound() {
        when(carRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> availabilityService.getWeeklyAvailability(7L, 999L));
    }

    @Test
    void getWeeklyAvailabilityThrowsWhenProviderDoesNotOwnCar() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        assertThrows(RuntimeException.class, () -> availabilityService.getWeeklyAvailability(999L, 11L));
    }

    // --- getWeeklyInstructorAvailability ---

    @Test
    void getWeeklyInstructorAvailabilityReturnsSlots() {
        Instructor instructor = new Instructor();
        instructor.setId(5L);

        AvailabilitySlot slot = createSlot(1L, DayOfWeek.TUESDAY, 480, 720, true);

        when(instructorRepository.findById(5L)).thenReturn(Optional.of(instructor));
        when(availabilitySlotRepository.findByInstructorIdOrderByDayOfWeekAscStartMinuteAsc(5L))
                .thenReturn(List.of(slot));

        WeeklyAvailabilityResponse response = availabilityService.getWeeklyInstructorAvailability(5L);

        assertEquals(5L, response.getCarId()); // uses instructor ID
        assertTrue(response.isAvailable());
        assertEquals(1, response.getSlots().size());
    }

    @Test
    void getWeeklyInstructorAvailabilityThrowsWhenNotFound() {
        when(instructorRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> availabilityService.getWeeklyInstructorAvailability(999L));
    }

    // --- replaceWeeklyAvailability ---

    @Test
    void replaceWeeklyAvailabilityStoresProvidedSlots() {
        Car car = createOwnedCar(11L, 7L);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("MONDAY", "09:00", "11:00", true)));

        var response = availabilityService.replaceWeeklyAvailability(7L, 11L, request);

        assertEquals(11L, response.getCarId());
        assertTrue(response.isAvailable());
        assertEquals(1, response.getSlots().size());
        verify(availabilitySlotRepository).deleteByCarId(11L);
        verify(availabilitySlotRepository, times(1)).save(any());
    }

    @Test
    void replaceWeeklyAvailabilityWithEmptySlots() {
        Car car = createOwnedCar(11L, 7L);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of());

        var response = availabilityService.replaceWeeklyAvailability(7L, 11L, request);

        assertFalse(response.isAvailable());
        assertTrue(response.getSlots().isEmpty());
    }

    @Test
    void replaceWeeklyAvailabilityWithNullSlots() {
        Car car = createOwnedCar(11L, 7L);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(null);

        var response = availabilityService.replaceWeeklyAvailability(7L, 11L, request);

        assertFalse(response.isAvailable());
    }

    @Test
    void replaceWeeklyAvailabilitySetsCarUnavailableWhenAllSlotsUnavailable() {
        Car car = createOwnedCar(11L, 7L);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("MONDAY", "09:00", "11:00", false)));

        var response = availabilityService.replaceWeeklyAvailability(7L, 11L, request);

        assertFalse(response.isAvailable());
    }

    @Test
    void replaceWeeklyAvailabilityRejectsOverlap() {
        Car car = createOwnedCar(10L, 4L);

        when(carRepository.findById(10L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(
                createSlotRequest("WEDNESDAY", "10:00", "11:00", true),
                createSlotRequest("WEDNESDAY", "10:30", "12:00", true)
        ));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(4L, 10L, request));
        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void replaceWeeklyAvailabilityRejectsInvalidDay() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("INVALID_DAY", "09:00", "11:00", true)));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(7L, 11L, request));
    }

    @Test
    void replaceWeeklyAvailabilityRejectsInvalidTimeFormat() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("MONDAY", "invalid", "11:00", true)));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(7L, 11L, request));
    }

    @Test
    void replaceWeeklyAvailabilityRejectsStartAfterEnd() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("MONDAY", "14:00", "09:00", true)));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(7L, 11L, request));
    }

    @Test
    void replaceWeeklyAvailabilityRejectsNullSlotRequest() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        java.util.ArrayList<AvailabilitySlotRequest> slots = new java.util.ArrayList<>();
        slots.add(null);
        request.setSlots(slots);

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(7L, 11L, request));
    }

    @Test
    void replaceWeeklyAvailabilityRejectsNon30MinBoundary() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("MONDAY", "09:15", "11:00", true)));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(7L, 11L, request));
    }

    @Test
    void replaceWeeklyAvailabilityAccepts2400AsEndTime() {
        Car car = createOwnedCar(11L, 7L);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("MONDAY", "22:00", "24:00", true)));

        var response = availabilityService.replaceWeeklyAvailability(7L, 11L, request);
        assertEquals(1, response.getSlots().size());
    }

    @Test
    void replaceWeeklyAvailabilityRejectsNullDay() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest(null, "09:00", "11:00", true)));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(7L, 11L, request));
    }

    @Test
    void replaceWeeklyAvailabilityRejectsNullTime() {
        Car car = createOwnedCar(11L, 7L);
        when(carRepository.findById(11L)).thenReturn(Optional.of(car));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("MONDAY", null, "11:00", true)));

        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyAvailability(7L, 11L, request));
    }

    // --- replaceWeeklyInstructorAvailability ---

    @Test
    void replaceWeeklyInstructorAvailabilityStoresSlots() {
        Instructor instructor = new Instructor();
        instructor.setId(5L);

        when(instructorRepository.findById(5L)).thenReturn(Optional.of(instructor));
        when(availabilitySlotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(createSlotRequest("TUESDAY", "10:00", "14:00", true)));

        var response = availabilityService.replaceWeeklyInstructorAvailability(5L, request);

        assertEquals(5L, response.getCarId());
        assertTrue(response.isAvailable());
        assertEquals(1, response.getSlots().size());
        verify(availabilitySlotRepository).deleteByInstructorId(5L);
    }

    @Test
    void replaceWeeklyInstructorAvailabilityThrowsWhenNotFound() {
        when(instructorRepository.findById(999L)).thenReturn(Optional.empty());
        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of());
        assertThrows(RuntimeException.class, () -> availabilityService.replaceWeeklyInstructorAvailability(999L, request));
    }

    // --- formatMinutes edge case ---

    @Test
    void getWeeklyAvailabilityFormats2400Correctly() {
        Car car = createOwnedCar(11L, 7L);
        AvailabilitySlot slot = createSlot(1L, DayOfWeek.MONDAY, 540, 1440, true); // 09:00-24:00

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(11L))
                .thenReturn(List.of(slot));

        var response = availabilityService.getWeeklyAvailability(7L, 11L);
        assertEquals("24:00", response.getSlots().get(0).getEndTime());
    }

    @Test
    void replaceWeeklyAvailabilityAllowsNonOverlappingSameDay() {
        Car car = createOwnedCar(11L, 7L);

        when(carRepository.findById(11L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeeklyAvailabilityRequest request = new WeeklyAvailabilityRequest();
        request.setSlots(List.of(
                createSlotRequest("MONDAY", "09:00", "12:00", true),
                createSlotRequest("MONDAY", "13:00", "17:00", true)
        ));

        var response = availabilityService.replaceWeeklyAvailability(7L, 11L, request);
        assertEquals(2, response.getSlots().size());
    }
}
