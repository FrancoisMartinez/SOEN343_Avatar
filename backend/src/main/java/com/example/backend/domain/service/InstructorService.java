package com.example.backend.domain.service;

import com.example.backend.application.dto.InstructorDto;
import com.example.backend.domain.model.Instructor;
import com.example.backend.infrastructure.repository.InstructorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InstructorService {

    private final InstructorRepository instructorRepository;

    public InstructorService(InstructorRepository instructorRepository) {
        this.instructorRepository = instructorRepository;
    }
    public List<InstructorDto> searchInstructors(Double lat, Double lng, Double searchRadius, Double minPrice, Double maxPrice, String dayOfWeek, Integer startMinute, Integer endMinute) {
        List<Instructor> allInstructors = instructorRepository.findAll();

        return allInstructors.stream()
                .filter(instructor -> {
                    // Filter by distance: check if user is within instructor's travel radius
                    if (lat != null && lng != null) {
                        double dist = calculateDistance(instructor.getLatitude(), instructor.getLongitude(), lat, lng);
                        // Mandatory: learner must be within instructor's travel radius for a match to be possible
                        if (dist > instructor.getTravelRadius()) return false;
                        // Optional: learner's own search radius preference
                        if (searchRadius != null && dist > searchRadius) return false;
                    }
                    // Filter by min price if provided
                    if (minPrice != null && instructor.getHourlyRate() < minPrice) {
                        return false;
                    }
                    // Filter by max price if provided
                    if (maxPrice != null && instructor.getHourlyRate() > maxPrice) {
                        return false;
                    }
                    // Filter by availability if provided
                    if (dayOfWeek != null) {
                        if (instructor.getAvailabilitySlots() == null) return false;
                        try {
                            java.time.DayOfWeek requestedDay = java.time.DayOfWeek.valueOf(dayOfWeek.toUpperCase());
                            if (startMinute != null && endMinute != null) {
                                return instructor.getAvailabilitySlots().stream().anyMatch(slot ->
                                        slot.getDayOfWeek() == requestedDay &&
                                                slot.isAvailable() &&
                                                slot.getStartMinute() <= startMinute &&
                                                slot.getEndMinute() >= endMinute
                                );
                            } else {
                                // If only day is provided, show instructors that have at least one available slot on that day
                                return instructor.getAvailabilitySlots().stream().anyMatch(slot ->
                                        slot.getDayOfWeek() == requestedDay && slot.isAvailable()
                                );
                            }
                        } catch (IllegalArgumentException e) {
                            return true; // ignore invalid day
                        }
                    } else {
                        // If no specific time or day requested, only show instructors who HAVE at least one active available slot
                        if (instructor.getAvailabilitySlots() == null || instructor.getAvailabilitySlots().isEmpty()) {
                            return false;
                        }
                        return instructor.getAvailabilitySlots().stream().anyMatch(com.example.backend.domain.model.AvailabilitySlot::isAvailable);
                    }
                })
                .map(this::toDto)
                .collect(Collectors.toList());
    }
private double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Double.MAX_VALUE;

    double earthRadiusKm = 6371.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);

    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

    private InstructorDto toDto(Instructor instructor) {
        return new InstructorDto(
                instructor.getId(),
                instructor.getFullName(),
                instructor.getHourlyRate(),
                instructor.getTravelRadius(),
                instructor.getRating(),
                instructor.getLatitude(),
                instructor.getLongitude()
        );
    }
}
