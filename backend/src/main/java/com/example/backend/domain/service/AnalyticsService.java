package com.example.backend.domain.service;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.application.dto.CarUtilizationDTO;
import com.example.backend.application.dto.DashboardAnalyticsDTO;
import com.example.backend.domain.model.Booking;
import com.example.backend.domain.model.Car;
import com.example.backend.domain.model.User;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import com.example.backend.infrastructure.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final CarRepository carRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public AnalyticsService(CarRepository carRepository, BookingRepository bookingRepository, UserRepository userRepository) {
        this.carRepository = carRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    public DashboardAnalyticsDTO getAdminDashboard() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Car> allCars = carRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        long activeUsers = allUsers.stream().filter(u -> !u.getRole().equals("ADMIN")).count();
        long activeInstructors = allUsers.stream().filter(u -> u.getRole().equals("INSTRUCTOR")).count();
        long activeCars = allCars.size();
        long totalBookings = allBookings.size();
        double totalRevenue = allBookings.stream().mapToDouble(Booking::getTotalCost).sum();
        long totalDrivingMinutes = allBookings.stream()
                .filter(b -> b.getCar() != null)
                .mapToLong(Booking::getDuration).sum() * 60;
        long totalLearningMinutes = allBookings.stream()
                .filter(b -> b.getInstructor() != null)
                .mapToLong(Booking::getDuration).sum() * 60;

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeUsers", activeUsers);
        stats.put("activeCars", activeCars);
        stats.put("activeInstructors", activeInstructors);
        stats.put("totalBookings", totalBookings);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalDrivingMinutes", totalDrivingMinutes);
        stats.put("totalLearningMinutes", totalLearningMinutes);

        Map<String, Number> usageByCarType = new HashMap<>();
        for (Booking b : allBookings) {
            if (b.getCar() != null) {
                String type = b.getCar().getMakeModel();
                usageByCarType.put(type, usageByCarType.getOrDefault(type, 0).intValue() + 1);
            }
        }

        Map<String, Number> topLearners = new HashMap<>();
        for (Booking b : allBookings) {
            if (b.getLearner() != null) {
                String name = b.getLearner().getFullName();
                topLearners.put(name, topLearners.getOrDefault(name, 0).intValue() + 1);
            }
        }

        Map<String, Number> topInstructors = new HashMap<>();
        for (Booking b : allBookings) {
            if (b.getInstructor() != null) {
                String name = b.getInstructor().getFullName();
                topInstructors.put(name, topInstructors.getOrDefault(name, 0).intValue() + 1);
            }
        }

        Map<String, Map<String, Number>> charts = new HashMap<>();
        charts.put("usageByCarType", usageByCarType);
        charts.put("topLearners", topLearners);
        charts.put("topInstructors", topInstructors);

        return new DashboardAnalyticsDTO(stats, charts);
    }

    public DashboardAnalyticsDTO getLearnerDashboard(Long learnerId) {
        List<Booking> bookings = bookingRepository.findByLearnerIdOrderByDateDesc(learnerId);

        long totalBookings = bookings.size();
        double totalSpent = bookings.stream().mapToDouble(Booking::getTotalCost).sum();
        long totalTimeSpentMinutes = bookings.stream().mapToLong(Booking::getDuration).sum() * 60;
        long totalDrivingMinutes = bookings.stream()
                .filter(b -> b.getCar() != null)
                .mapToLong(Booking::getDuration).sum() * 60;
        long totalLearningMinutes = bookings.stream()
                .filter(b -> b.getInstructor() != null)
                .mapToLong(Booking::getDuration).sum() * 60;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", totalBookings);
        stats.put("totalSpent", totalSpent);
        stats.put("totalTimeSpentMinutes", totalTimeSpentMinutes);
        stats.put("totalDrivingMinutes", totalDrivingMinutes);
        stats.put("totalLearningMinutes", totalLearningMinutes);

        Map<String, Number> usageByCarType = new HashMap<>();
        Map<String, Number> topInstructors = new HashMap<>();
        for (Booking b : bookings) {
            if (b.getCar() != null) {
                String type = b.getCar().getMakeModel();
                usageByCarType.put(type, usageByCarType.getOrDefault(type, 0).intValue() + 1);
            }
            if (b.getInstructor() != null) {
                String name = b.getInstructor().getFullName();
                topInstructors.put(name, topInstructors.getOrDefault(name, 0).intValue() + 1);
            }
        }

        Map<String, Map<String, Number>> charts = new HashMap<>();
        charts.put("usageByCarType", usageByCarType);
        charts.put("topInstructors", topInstructors);

        return new DashboardAnalyticsDTO(stats, charts);
    }

    public DashboardAnalyticsDTO getProviderDashboard(Long providerId) {
        List<Car> providerCars = carRepository.findByProviderId(providerId);
        List<Booking> bookings = bookingRepository.findByProviderIdOrderByDateDesc(providerId);

        long activeCars = providerCars.size();
        long totalBookings = bookings.size();
        double totalRevenue = bookings.stream().mapToDouble(Booking::getTotalCost).sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeCars", activeCars);
        stats.put("totalBookings", totalBookings);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalDrivingMinutes", bookings.stream()
                .filter(b -> b.getCar() != null)
                .mapToLong(Booking::getDuration).sum() * 60);
        stats.put("totalLearningMinutes", bookings.stream()
                .filter(b -> b.getInstructor() != null)
                .mapToLong(Booking::getDuration).sum() * 60);

        Map<String, Number> usageByCarType = new HashMap<>();
        Map<String, Number> topLearners = new HashMap<>();
        for (Booking b : bookings) {
            if (b.getCar() != null) {
                String type = b.getCar().getMakeModel();
                usageByCarType.put(type, usageByCarType.getOrDefault(type, 0).intValue() + 1);
            }
            if (b.getLearner() != null) {
                String name = b.getLearner().getFullName();
                topLearners.put(name, topLearners.getOrDefault(name, 0).intValue() + 1);
            }
        }

        Map<String, Map<String, Number>> charts = new HashMap<>();
        charts.put("usageByCarType", usageByCarType);
        charts.put("topLearners", topLearners);

        return new DashboardAnalyticsDTO(stats, charts);
    }

    public DashboardAnalyticsDTO getInstructorDashboard(Long instructorId) {
        List<Booking> bookings = bookingRepository.findByInstructorIdOrderByDateDesc(instructorId);

        long totalBookings = bookings.size();
        double totalEarned = bookings.stream().mapToDouble(Booking::getTotalCost).sum();
        long totalTimeSpentMinutes = bookings.stream().mapToLong(Booking::getDuration).sum() * 60;
        long totalDrivingMinutes = bookings.stream()
                .filter(b -> b.getCar() != null)
                .mapToLong(Booking::getDuration).sum() * 60;
        long totalLearningMinutes = bookings.stream()
                .filter(b -> b.getInstructor() != null)
                .mapToLong(Booking::getDuration).sum() * 60;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", totalBookings);
        stats.put("totalEarned", totalEarned);
        stats.put("totalTimeSpentMinutes", totalTimeSpentMinutes);
        stats.put("totalDrivingMinutes", totalDrivingMinutes);
        stats.put("totalLearningMinutes", totalLearningMinutes);

        Map<String, Number> usageByCarType = new HashMap<>();
        Map<String, Number> topLearners = new HashMap<>();
        for (Booking b : bookings) {
            if (b.getCar() != null) {
                String type = b.getCar().getMakeModel();
                usageByCarType.put(type, usageByCarType.getOrDefault(type, 0).intValue() + 1);
            }
            if (b.getLearner() != null) {
                String name = b.getLearner().getFullName();
                topLearners.put(name, topLearners.getOrDefault(name, 0).intValue() + 1);
            }
        }

        Map<String, Map<String, Number>> charts = new HashMap<>();
        charts.put("usageByCarType", usageByCarType);
        charts.put("topLearners", topLearners);

        return new DashboardAnalyticsDTO(stats, charts);
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
