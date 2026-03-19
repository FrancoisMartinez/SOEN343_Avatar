package com.example.backend.domain.service;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.CarRequest;
import com.example.backend.domain.model.Car;
import com.example.backend.domain.model.CarProvider;
import com.example.backend.infrastructure.repository.CarProviderRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CarService {

    private final CarRepository carRepository;
    private final CarProviderRepository carProviderRepository;

    public CarService(CarRepository carRepository, CarProviderRepository carProviderRepository) {
        this.carRepository = carRepository;
        this.carProviderRepository = carProviderRepository;
    }

    /**
     * List all cars owned by a specific provider.
     */
    public List<CarDto> getCarsByProvider(Long providerId) {
        List<Car> cars = carRepository.findByProviderId(providerId);
        return cars.stream().map(this::toDto).toList();
    }

    /**
     * Create a new car for a provider.
     */
    public CarDto createCar(Long providerId, CarRequest request) {
        CarProvider provider = carProviderRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        Car car = new Car();
        car.setMakeModel(request.getMakeModel());
        car.setTransmissionType(request.getTransmissionType());
        car.setLocation(request.getLocation());
        car.setAvailable(request.isAvailable());
        car.setAccessibilityFeatures(request.getAccessibilityFeatures());
        car.setHourlyRate(request.getHourlyRate());
        car.setProvider(provider);

        Car saved = carRepository.save(car);
        return toDto(saved);
    }

    /**
     * Update an existing car.
     */
    public CarDto updateCar(Long carId, CarRequest request) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new RuntimeException("Car not found"));

        car.setMakeModel(request.getMakeModel());
        car.setTransmissionType(request.getTransmissionType());
        car.setLocation(request.getLocation());
        car.setAvailable(request.isAvailable());
        car.setAccessibilityFeatures(request.getAccessibilityFeatures());
        car.setHourlyRate(request.getHourlyRate());

        Car saved = carRepository.save(car);
        return toDto(saved);
    }

    /**
     * Delete a car by its ID.
     */
    public void deleteCar(Long carId) {
        if (!carRepository.existsById(carId)) {
            throw new RuntimeException("Car not found");
        }
        carRepository.deleteById(carId);
    }

    /**
     * Maps a Car entity to a CarDto.
     */
    private CarDto toDto(Car car) {
        return new CarDto(
                car.getId(),
                car.getMakeModel(),
                car.getTransmissionType(),
                car.getLocation(),
                car.isAvailable(),
                car.getAccessibilityFeatures(),
                car.getHourlyRate()
        );
    }
}
