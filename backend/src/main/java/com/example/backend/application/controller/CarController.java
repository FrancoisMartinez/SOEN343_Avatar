package com.example.backend.application.controller;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.CarRequest;
import com.example.backend.domain.service.CarService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/providers/{providerId}/cars")
public class CarController {

    private final CarService carService;

    public CarController(CarService carService) {
        this.carService = carService;
    }

    /**
     * List all cars for a provider.
     */
    @GetMapping
    public ResponseEntity<List<CarDto>> listCars(@PathVariable Long providerId) {
        List<CarDto> cars = carService.getCarsByProvider(providerId);
        return ResponseEntity.ok(cars);
    }

    /**
     * Create a new car for a provider.
     */
    @PostMapping
    public ResponseEntity<?> createCar(@PathVariable Long providerId, @RequestBody CarRequest request) {
        try {
            CarDto created = carService.createCar(providerId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update an existing car.
     */
    @PutMapping("/{carId}")
    public ResponseEntity<?> updateCar(@PathVariable Long providerId,
                                       @PathVariable Long carId,
                                       @RequestBody CarRequest request) {
        try {
            CarDto updated = carService.updateCar(carId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a car. Validates that the provider owns the car.
     */
    @DeleteMapping("/{carId}")
    public ResponseEntity<?> deleteCar(@PathVariable Long providerId,
                                       @PathVariable Long carId) {
        try {
            carService.deleteCar(providerId, carId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
