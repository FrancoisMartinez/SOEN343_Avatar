package com.example.backend.application.controller;

import com.example.backend.application.dto.AvailabilitySlotDto;
import com.example.backend.application.dto.CarDto;
import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.service.CarService;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cars")
public class CarSearchController {

    private final CarService carService;
    private final AvailabilitySlotRepository availabilitySlotRepository;

    public CarSearchController(CarService carService, AvailabilitySlotRepository availabilitySlotRepository) {
        this.carService = carService;
        this.availabilitySlotRepository = availabilitySlotRepository;
    }

    /**
     * Search cars based on filters.
     */
    @GetMapping("/search")
    public ResponseEntity<List<CarDto>> searchCars(
            @RequestParam(required = false) String transmissionType,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) String dayOfWeek,
            @RequestParam(required = false) Integer startMinute,
            @RequestParam(required = false) Integer endMinute) {

        List<CarDto> cars = carService.searchCars(transmissionType, minPrice, maxPrice, isAvailable, lat, lng, radius, dayOfWeek, startMinute, endMinute);
        return ResponseEntity.ok(cars);
    }

    /**
     * GET /api/cars/{carId}/availability
     * Public endpoint so learners can view a car's availability without needing the providerId.
     */
    @GetMapping("/{carId}/availability")
    public ResponseEntity<?> getCarAvailability(@PathVariable Long carId) {
        List<AvailabilitySlot> slots = availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(carId);

        List<AvailabilitySlotDto> slotDtos = slots.stream().map(slot -> {
            AvailabilitySlotDto dto = new AvailabilitySlotDto();
            dto.setId(slot.getId());
            dto.setDayOfWeek(slot.getDayOfWeek().name());
            dto.setStartTime(minutesToTime(slot.getStartMinute()));
            dto.setEndTime(minutesToTime(slot.getEndMinute()));
            dto.setAvailable(slot.isAvailable());
            return dto;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "carId", carId,
                "slots", slotDtos
        ));
    }

    private String minutesToTime(int totalMinutes) {
        int h = totalMinutes / 60;
        int m = totalMinutes % 60;
        return String.format("%02d:%02d", h, m);
    }
}
