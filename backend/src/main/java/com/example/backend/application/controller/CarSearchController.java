package com.example.backend.application.controller;

import com.example.backend.application.dto.CarDto;
import com.example.backend.domain.service.CarService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
public class CarSearchController {

    private final CarService carService;

    public CarSearchController(CarService carService) {
        this.carService = carService;
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
}
