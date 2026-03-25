package com.example.backend.domain.service;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.application.dto.CarUtilizationDTO;
import com.example.backend.domain.model.Booking;
import com.example.backend.domain.model.Car;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
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

    /**
     * Get car utilization analytics for all cars.
     * Calculates total bookings, booked hours, utilization %, and revenue per car.
     */
    public AnalyticsResponseDTO getCarUtilizationAnalytics() {
        return getCarUtilizationAnalytics(null, null);
    }

    /**
     * Get car utilization analytics for all cars in an optional date range.
     */
    public AnalyticsResponseDTO getCarUtilizationAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        validateDateRange(startDate, endDate);

        List<Car> cars = carRepository.findAll();
        List<CarUtilizationDTO> carUtilizations = cars.stream()
                .map(car -> calculateCarUtilization(car, startDate, endDate))
                .toList();

        return new AnalyticsResponseDTO(carUtilizations, System.currentTimeMillis());
    }

    /**
     * Get car utilization analytics for a specific provider's cars.
     */
    public AnalyticsResponseDTO getCarUtilizationAnalyticsByProvider(Long providerId) {
        return getCarUtilizationAnalyticsByProvider(providerId, null, null);
        }

        /**
         * Get car utilization analytics for a specific provider's cars in an optional date range.
         */
        public AnalyticsResponseDTO getCarUtilizationAnalyticsByProvider(Long providerId, LocalDateTime startDate,
            LocalDateTime endDate) {
        validateDateRange(startDate, endDate);

        List<Car> cars = carRepository.findByProviderId(providerId);
        List<CarUtilizationDTO> carUtilizations = cars.stream()
            .map(car -> calculateCarUtilization(car, startDate, endDate))
                .toList();

        return new AnalyticsResponseDTO(carUtilizations, System.currentTimeMillis());
    }

    /**
     * Calculate utilization metrics for a single car.
     */
    private CarUtilizationDTO calculateCarUtilization(Car car, LocalDateTime startDate, LocalDateTime endDate) {
        List<Booking> bookings;
        if (startDate != null && endDate != null) {
            bookings = bookingRepository.findByCarIdAndStartTimeGreaterThanEqualAndEndTimeLessThanEqual(
                    car.getId(), startDate, endDate);
        } else {
            bookings = bookingRepository.findByCarId(car.getId());
        }

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

    private void validateDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        if ((startDate == null && endDate != null) || (startDate != null && endDate == null)) {
            throw new RuntimeException("Both startDate and endDate are required when filtering by date range");
        }

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new RuntimeException("startDate must be before or equal to endDate");
        }
    }
}
