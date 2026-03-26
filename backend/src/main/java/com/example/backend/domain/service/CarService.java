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
        car.setLatitude(request.getLatitude());
        car.setLongitude(request.getLongitude());
        car.setAvailable(request.isAvailable());
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
        car.setLatitude(request.getLatitude());
        car.setLongitude(request.getLongitude());
        car.setAvailable(request.isAvailable());
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
     * Search cars based on filters.
     */
    public List<CarDto> searchCars(String transmissionType, Double minPrice, Double maxPrice, Boolean isAvailable, Double lat, Double lng, Double radius, String dayOfWeek, Integer startMinute, Integer endMinute) {
        List<Car> allCars = carRepository.findAll();

        return allCars.stream()
                .filter(car -> transmissionType == null || transmissionType.isEmpty() || transmissionType.equalsIgnoreCase(car.getTransmissionType()))
                .filter(car -> minPrice == null || car.getHourlyRate() >= minPrice)
                .filter(car -> maxPrice == null || car.getHourlyRate() <= maxPrice)
                .filter(car -> isAvailable == null || car.isAvailable() == isAvailable)
                .filter(car -> {
                    if (lat == null || lng == null || radius == null) return true;
                    if (car.getLatitude() == null || car.getLongitude() == null) return false;
                    double distance = calculateDistance(lat, lng, car.getLatitude(), car.getLongitude());
                    return distance <= radius;
                })
                .filter(car -> {
                    if (dayOfWeek == null || startMinute == null || endMinute == null) return true;
                    if (car.getAvailabilitySlots() == null) return false;
                    
                    try {
                        java.time.DayOfWeek requestedDay = java.time.DayOfWeek.valueOf(dayOfWeek.toUpperCase());
                        return car.getAvailabilitySlots().stream().anyMatch(slot -> 
                            slot.getDayOfWeek() == requestedDay &&
                            slot.isAvailable() &&
                            slot.getStartMinute() <= startMinute &&
                            slot.getEndMinute() >= endMinute
                        );
                    } catch (IllegalArgumentException e) {
                        return true; // ignore invalid dayOfWeek
                    }
                })
                .map(this::toDto)
                .toList();
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     * Returns distance in kilometers.
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
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
                car.getLatitude(),
                car.getLongitude(),
                car.isAvailable(),
                car.getHourlyRate());
    }
}
