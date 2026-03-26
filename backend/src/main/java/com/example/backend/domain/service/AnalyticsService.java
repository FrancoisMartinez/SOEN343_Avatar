package com.example.backend.domain.service;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.application.dto.CarUtilizationDTO;
import com.example.backend.domain.model.Booking;
import com.example.backend.domain.model.Car;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnalyticsService {

    private final CarRepository carRepository;
    private final BookingRepository bookingRepository;

    public AnalyticsService(CarRepository carRepository, BookingRepository bookingRepository) {
        this.carRepository = carRepository;
        this.bookingRepository = bookingRepository;
    }

    public AnalyticsResponseDTO getCarUtilizationAnalytics() {
        return getCarUtilizationAnalytics(null, null);
    }

    public AnalyticsResponseDTO getCarUtilizationAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        validateDateRange(startDate, endDate);

        List<Car> cars = carRepository.findAll();
        List<CarUtilizationDTO> carUtilizations = cars.stream()
                .map(car -> calculateCarUtilization(car, startDate, endDate))
                .toList();

        return new AnalyticsResponseDTO(carUtilizations, System.currentTimeMillis());
    }

    public AnalyticsResponseDTO getCarUtilizationAnalyticsByProvider(Long providerId) {
        return getCarUtilizationAnalyticsByProvider(providerId, null, null);
    }

    public AnalyticsResponseDTO getCarUtilizationAnalyticsByProvider(Long providerId, LocalDateTime startDate,
            LocalDateTime endDate) {
        validateDateRange(startDate, endDate);

        List<Car> cars = carRepository.findByProviderId(providerId);
        List<CarUtilizationDTO> carUtilizations = cars.stream()
                .map(car -> calculateCarUtilization(car, startDate, endDate))
                .toList();

        return new AnalyticsResponseDTO(carUtilizations, System.currentTimeMillis());
    }

    private CarUtilizationDTO calculateCarUtilization(Car car, LocalDateTime startDate, LocalDateTime endDate) {
        List<Booking> bookings;
        if (startDate != null && endDate != null) {
            // Filter bookings by date range using the booking's date field
            bookings = bookingRepository.findByCarId(car.getId()).stream()
                    .filter(b -> {
                        LocalDateTime bookingDateTime = b.getDate().atTime(b.getStartTime());
                        return !bookingDateTime.isBefore(startDate) && !bookingDateTime.isAfter(endDate);
                    })
                    .toList();
        } else {
            bookings = bookingRepository.findByCarId(car.getId());
        }

        int totalBookings = bookings.size();
        // Each booking stores its duration in hours directly
        long totalBookingHours = bookings.stream()
                .mapToLong(Booking::getDuration)
                .sum();
        double totalRevenue = bookings.stream()
                .mapToDouble(Booking::getTotalCost)
                .sum();

        // Utilization: hours booked / (24 * 7 = 168 hours per week)
        double utilizationPercentage = (totalBookingHours / 168.0) * 100;

        return new CarUtilizationDTO(
                car.getId(),
                car.getMakeModel(),
                totalBookings,
                totalBookingHours,
                utilizationPercentage,
                totalRevenue
        );
    }

    private void validateDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        if ((startDate == null && endDate != null) || (startDate != null && endDate == null)) {
            throw new RuntimeException("Both startDate and endDate are required when filtering by date range");
        }

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new RuntimeException("startDate must be before or equal to endDate");
        }
    }
}
