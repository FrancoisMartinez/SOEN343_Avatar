package com.example.backend.domain.service;

import com.example.backend.application.dto.InstructorDto;
import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.model.Instructor;
import com.example.backend.infrastructure.repository.InstructorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InstructorServiceTest {

    @Mock
    private InstructorRepository instructorRepository;

    @InjectMocks
    private InstructorService instructorService;

    private Instructor createInstructor(Long id, String name, double rate, double radius,
                                         Double lat, Double lng, List<AvailabilitySlot> slots) {
        Instructor i = new Instructor();
        i.setId(id);
        i.setFullName(name);
        i.setHourlyRate(rate);
        i.setRating(4.5);
        i.setLatitude(lat);
        i.setLongitude(lng);
        i.setAvailabilitySlots(slots);
        return i;
    }

    private AvailabilitySlot createSlot(DayOfWeek day, int startMin, int endMin, boolean available) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setDayOfWeek(day);
        slot.setStartMinute(startMin);
        slot.setEndMinute(endMin);
        slot.setAvailable(available);
        return slot;
    }

    @Test
    void searchWithNoFiltersReturnsInstructorsWithAvailableSlots() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        Instructor i = createInstructor(1L, "Jane", 50.0, 10.0, 45.5, -73.6, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(i));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, null, null, null);
        assertEquals(1, result.size());
        assertEquals("Jane", result.get(0).getFullName());
    }

    @Test
    void searchExcludesInstructorsWithNoSlots() {
        Instructor i = createInstructor(1L, "Jane", 50.0, 10.0, 45.5, -73.6, null);

        when(instructorRepository.findAll()).thenReturn(List.of(i));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, null, null, null);
        assertTrue(result.isEmpty());
    }

    @Test
    void searchExcludesInstructorsWithEmptySlots() {
        Instructor i = createInstructor(1L, "Jane", 50.0, 10.0, 45.5, -73.6, List.of());

        when(instructorRepository.findAll()).thenReturn(List.of(i));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, null, null, null);
        assertTrue(result.isEmpty());
    }

    @Test
    void searchExcludesInstructorsWithOnlyUnavailableSlots() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, false);
        Instructor i = createInstructor(1L, "Jane", 50.0, 10.0, 45.5, -73.6, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(i));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, null, null, null);
        assertTrue(result.isEmpty());
    }

    @Test
    void searchFiltersByMinPrice() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        Instructor cheap = createInstructor(1L, "Cheap", 30.0, 10.0, 45.5, -73.6, List.of(slot));
        Instructor expensive = createInstructor(2L, "Expensive", 80.0, 10.0, 45.5, -73.6, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(cheap, expensive));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, 50.0, null, null, null, null);
        assertEquals(1, result.size());
        assertEquals("Expensive", result.get(0).getFullName());
    }

    @Test
    void searchFiltersByMaxPrice() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        Instructor cheap = createInstructor(1L, "Cheap", 30.0, 10.0, 45.5, -73.6, List.of(slot));
        Instructor expensive = createInstructor(2L, "Expensive", 80.0, 10.0, 45.5, -73.6, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(cheap, expensive));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, 50.0, null, null, null);
        assertEquals(1, result.size());
        assertEquals("Cheap", result.get(0).getFullName());
    }

    @Test
    void searchFiltersByLocation() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        // Instructor at (45.5, -73.6) with 5km radius
        Instructor nearby = createInstructor(1L, "Nearby", 50.0, 5.0, 45.5, -73.6, List.of(slot));
        // Far away instructor
        Instructor farAway = createInstructor(2L, "Far", 50.0, 5.0, 40.0, -74.0, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(nearby, farAway));

        // Search near (45.5, -73.6)
        List<InstructorDto> result = instructorService.searchInstructors(45.501, -73.601, null, null, null, null, null, null);
        assertEquals(1, result.size());
        assertEquals("Nearby", result.get(0).getFullName());
    }

    @Test
    void searchExcludesInstructorWithNullCoordinatesWhenLocationFiltered() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        Instructor noCoords = createInstructor(1L, "NoCoords", 50.0, 10.0, null, null, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(noCoords));

        List<InstructorDto> result = instructorService.searchInstructors(45.5, -73.6, null, null, null, null, null, null);
        assertTrue(result.isEmpty());
    }

    @Test
    void searchFiltersByDayOfWeek() {
        AvailabilitySlot mondaySlot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        AvailabilitySlot tuesdaySlot = createSlot(DayOfWeek.TUESDAY, 480, 1080, true);
        Instructor mondayInst = createInstructor(1L, "Monday", 50.0, 10.0, 45.5, -73.6, List.of(mondaySlot));
        Instructor tuesdayInst = createInstructor(2L, "Tuesday", 50.0, 10.0, 45.5, -73.6, List.of(tuesdaySlot));

        when(instructorRepository.findAll()).thenReturn(List.of(mondayInst, tuesdayInst));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, "MONDAY", null, null);
        assertEquals(1, result.size());
        assertEquals("Monday", result.get(0).getFullName());
    }

    @Test
    void searchFiltersByDayAndTimeRange() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true); // 8:00-18:00
        Instructor i = createInstructor(1L, "Jane", 50.0, 10.0, 45.5, -73.6, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(i));

        // Within range
        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, "MONDAY", 600, 720);
        assertEquals(1, result.size());

        // Outside range
        result = instructorService.searchInstructors(null, null, null, null, null, "MONDAY", 300, 400);
        assertTrue(result.isEmpty());
    }

    @Test
    void searchIgnoresInvalidDayOfWeek() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        Instructor i = createInstructor(1L, "Jane", 50.0, 10.0, 45.5, -73.6, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(i));

        // Invalid day should not filter out
        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, "INVALID_DAY", null, null);
        assertEquals(1, result.size());
    }

    @Test
    void searchReturnsCorrectDtoFields() {
        AvailabilitySlot slot = createSlot(DayOfWeek.MONDAY, 480, 1080, true);
        Instructor i = createInstructor(1L, "Jane Doe", 55.0, 15.0, 45.5, -73.6, List.of(slot));

        when(instructorRepository.findAll()).thenReturn(List.of(i));

        List<InstructorDto> result = instructorService.searchInstructors(null, null, null, null, null, null, null, null);
        assertEquals(1, result.size());
        InstructorDto dto = result.get(0);
        assertEquals(1L, dto.getId());
        assertEquals("Jane Doe", dto.getFullName());
        assertEquals(55.0, dto.getHourlyRate());
        assertEquals(4.5, dto.getRating());
    }
}
