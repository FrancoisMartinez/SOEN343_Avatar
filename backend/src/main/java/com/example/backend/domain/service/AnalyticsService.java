package com.example.backend.domain.service;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.application.dto.CarUtilizationDTO;
import com.example.backend.domain.model.Booking;
import com.example.backend.domain.model.Car;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class AnalyticsService {

    private final CarRepository carRepository;
    private final BookingRepository bookingRepository;

    public AnalyticsService(CarRepository carRepository, BookingRepository bookingRepository) {
        this.carRepository = carRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Get car utilization analytics for all cars.
     * Calculates total bookings, booked hours, utilization %, and revenue per car.
     */
    public AnalyticsResponseDTO getCarUtilizationAnalytics() {
        List<Car> cars = carRepository.findAll();
        List<CarUtilizationDTO> carUtilizations = cars.stream()
                .map(this::calculateCarUtilization)
                .toList();

        return new AnalyticsResponseDTO(carUtilizations, System.currentTimeMillis());
    }

    /**
     * Get car utilization analytics for a specific provider's cars.
     */
    public AnalyticsResponseDTO getCarUtilizationAnalyticsByProvider(Long providerId) {
        List<Car> cars = carRepository.findByProviderId(providerId);
        List<CarUtilizationDTO> carUtilizations = cars.stream()
                .map(this::calculateCarUtilization)
                .toList();

        return new AnalyticsResponseDTO(carUtilizations, System.currentTimeMillis());
    }

    /**
     * Calculate utilization metrics for a single car.
     */
    private CarUtilizationDTO calculateCarUtilization(Car car) {
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getCar() != null && b.getCar().getId().equals(car.getId()))
                .toList();

        int totalBookings = bookings.size();
        long totalBookingHours = calculateTotalBookingHours(bookings);
        double totalRevenue = totalBookingHours * car.getHourlyRate();

        // Utilization: hours booked / (24 * 7 = 168 hours per week)
        // later we could be based on actual available slots
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

    /**
     * Calculate total hours from all bookings.
     */
    private long calculateTotalBookingHours(List<Booking> bookings) {
        return bookings.stream()
                .mapToLong(this::getBookingDurationHours)
                .sum();
    }

    /**
     * Get duration of a single booking in hours.
     */
    private long getBookingDurationHours(Booking booking) {
        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            return 0;
        }

        Duration duration = Duration.between(booking.getStartTime(), booking.getEndTime());
        return duration.toHours();
    }
}
