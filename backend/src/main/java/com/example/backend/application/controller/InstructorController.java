package com.example.backend.application.controller;

import com.example.backend.application.dto.InstructorDto;
import com.example.backend.application.dto.WeeklyAvailabilityRequest;
import com.example.backend.application.dto.WeeklyAvailabilityResponse;
import com.example.backend.domain.service.AvailabilityService;
import com.example.backend.domain.service.InstructorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instructors")
public class InstructorController {

    private final InstructorService instructorService;
    private final AvailabilityService availabilityService;

    public InstructorController(InstructorService instructorService, AvailabilityService availabilityService) {
        this.instructorService = instructorService;
        this.availabilityService = availabilityService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<InstructorDto>> searchInstructors(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String dayOfWeek,
            @RequestParam(required = false) Integer startMinute,
            @RequestParam(required = false) Integer endMinute) {
        List<InstructorDto> instructors = instructorService.searchInstructors(lat, lng, radius, minPrice, maxPrice, dayOfWeek, startMinute, endMinute);
        return ResponseEntity.ok(instructors);
    }

    @GetMapping("/{instructorId}/availability")
    public ResponseEntity<WeeklyAvailabilityResponse> getInstructorAvailability(
            @PathVariable Long instructorId) {
        WeeklyAvailabilityResponse response = availabilityService.getWeeklyInstructorAvailability(instructorId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{instructorId}/availability")
    public ResponseEntity<WeeklyAvailabilityResponse> replaceInstructorAvailability(
            @PathVariable Long instructorId,
            @RequestBody WeeklyAvailabilityRequest request) {
        WeeklyAvailabilityResponse response = availabilityService.replaceWeeklyInstructorAvailability(instructorId, request);
        return ResponseEntity.ok(response);
    }
}
