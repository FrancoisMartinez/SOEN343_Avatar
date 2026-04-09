package com.example.backend.domain.service;

import com.example.backend.application.dto.AnalyticsResponseDTO;
import com.example.backend.application.dto.DashboardAnalyticsDTO;
import com.example.backend.domain.model.*;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import com.example.backend.infrastructure.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private CarRepository carRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private Learner createLearner(String name) {
        Learner l = new Learner();
        l.setFullName(name);
        return l;
    }

    private Car createCar(Long id, String makeModel) {
        Car c = new Car();
        c.setId(id);
        c.setMakeModel(makeModel);
        c.setHourlyRate(50.0);
        return c;
    }

    private Instructor createInstructor(String name) {
        Instructor i = new Instructor();
        i.setFullName(name);
        return i;
    }

    private Booking createBooking(Car car, Learner learner, Instructor instructor, double cost, int duration) {
        Booking b = new Booking();
        b.setCar(car);
        b.setLearner(learner);
        b.setInstructor(instructor);
        b.setTotalCost(cost);
        b.setDuration(duration);
        b.setDate(LocalDate.of(2026, 4, 10));
        b.setStartTime(LocalTime.of(10, 0));
        return b;
    }

    // --- Admin Dashboard ---

    @Test
    void adminDashboardComputesCorrectStats() {
        Learner learner = createLearner("Alice");
        learner.setId(1L);
        Car car = createCar(1L, "Toyota");
        Booking b1 = createBooking(car, learner, null, 100.0, 2);
        Booking b2 = createBooking(car, learner, null, 200.0, 3);

        when(bookingRepository.findAll()).thenReturn(List.of(b1, b2));
        when(carRepository.findAll()).thenReturn(List.of(car));
        when(userRepository.findAll()).thenReturn(List.of(learner));

        DashboardAnalyticsDTO dto = analyticsService.getAdminDashboard();

        assertEquals(1L, dto.getStats().get("activeUsers"));
        assertEquals(1L, dto.getStats().get("activeCars"));
        assertEquals(2L, dto.getStats().get("totalBookings"));
        assertEquals(300.0, dto.getStats().get("totalRevenue"));
        assertEquals(2, dto.getCharts().get("usageByCarType").get("Toyota").intValue());
    }

    @Test
    void adminDashboardExcludesAdminsFromActiveUsers() {
        Admin admin = new Admin();
        admin.setFullName("Admin");
        Learner learner = createLearner("Alice");

        when(bookingRepository.findAll()).thenReturn(List.of());
        when(carRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of(admin, learner));

        DashboardAnalyticsDTO dto = analyticsService.getAdminDashboard();
        assertEquals(1L, dto.getStats().get("activeUsers"));
    }

    @Test
    void adminDashboardCountsInstructors() {
        Instructor instructor = createInstructor("Jane");

        when(bookingRepository.findAll()).thenReturn(List.of());
        when(carRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of(instructor));

        DashboardAnalyticsDTO dto = analyticsService.getAdminDashboard();
        assertEquals(1L, dto.getStats().get("activeInstructors"));
    }

    // --- Learner Dashboard ---

    @Test
    void learnerDashboardComputesCorrectStats() {
        Car car = createCar(1L, "Honda");
        Learner learner = createLearner("Alice");
        Instructor instructor = createInstructor("Bob");
        Booking b1 = createBooking(car, learner, instructor, 150.0, 3);

        when(bookingRepository.findByLearnerIdOrderByDateDesc(1L)).thenReturn(List.of(b1));

        DashboardAnalyticsDTO dto = analyticsService.getLearnerDashboard(1L);

        assertEquals(1L, dto.getStats().get("totalBookings"));
        assertEquals(150.0, dto.getStats().get("totalSpent"));
        assertEquals(180L, dto.getStats().get("totalTimeSpentMinutes")); // 3 hours * 60
        assertEquals(1, dto.getCharts().get("usageByCarType").get("Honda").intValue());
        assertEquals(1, dto.getCharts().get("topInstructors").get("Bob").intValue());
    }

    // --- Provider Dashboard ---

    @Test
    void providerDashboardComputesCorrectStats() {
        Car car = createCar(1L, "BMW");
        Learner learner = createLearner("Alice");
        Booking b1 = createBooking(car, learner, null, 200.0, 4);

        when(carRepository.findByProviderId(10L)).thenReturn(List.of(car));
        when(bookingRepository.findByProviderIdOrderByDateDesc(10L)).thenReturn(List.of(b1));

        DashboardAnalyticsDTO dto = analyticsService.getProviderDashboard(10L);

        assertEquals(1L, dto.getStats().get("activeCars"));
        assertEquals(1L, dto.getStats().get("totalBookings"));
        assertEquals(200.0, dto.getStats().get("totalRevenue"));
        assertEquals(1, dto.getCharts().get("topLearners").get("Alice").intValue());
    }

    // --- Instructor Dashboard ---

    @Test
    void instructorDashboardComputesCorrectStats() {
        Learner learner = createLearner("Charlie");
        Instructor instructor = createInstructor("Jane");
        Car car = createCar(1L, "Tesla");
        Booking b1 = createBooking(car, learner, instructor, 80.0, 2);

        when(bookingRepository.findByInstructorIdOrderByDateDesc(5L)).thenReturn(List.of(b1));

        DashboardAnalyticsDTO dto = analyticsService.getInstructorDashboard(5L);

        assertEquals(1L, dto.getStats().get("totalBookings"));
        assertEquals(80.0, dto.getStats().get("totalEarned"));
        assertEquals(120L, dto.getStats().get("totalTimeSpentMinutes"));
    }

    // --- Car Utilization ---

    @Test
    void carUtilizationComputesCorrectMetrics() {
        Car car = createCar(1L, "Toyota");
        Booking b = new Booking();
        b.setDuration(10);
        b.setTotalCost(500.0);
        b.setDate(LocalDate.of(2026, 4, 10));
        b.setStartTime(LocalTime.of(8, 0));

        when(carRepository.findAll()).thenReturn(List.of(car));
        when(bookingRepository.findByCarId(1L)).thenReturn(List.of(b));

        AnalyticsResponseDTO dto = analyticsService.getCarUtilizationAnalytics();

        assertEquals(1, dto.getCarUtilizations().size());
        assertEquals(1, dto.getCarUtilizations().get(0).getTotalBookings());
        assertEquals(10, dto.getCarUtilizations().get(0).getTotalBookingHours());
        assertEquals(500.0, dto.getCarUtilizations().get(0).getTotalRevenue());
        assertTrue(dto.getTimestamp() > 0);
    }

    @Test
    void carUtilizationFiltersByDateRange() {
        Car car = createCar(1L, "Toyota");

        Booking inRange = new Booking();
        inRange.setDuration(2);
        inRange.setTotalCost(100.0);
        inRange.setDate(LocalDate.of(2026, 4, 10));
        inRange.setStartTime(LocalTime.of(10, 0));

        Booking outOfRange = new Booking();
        outOfRange.setDuration(3);
        outOfRange.setTotalCost(150.0);
        outOfRange.setDate(LocalDate.of(2026, 5, 1));
        outOfRange.setStartTime(LocalTime.of(10, 0));

        when(carRepository.findAll()).thenReturn(List.of(car));
        when(bookingRepository.findByCarId(1L)).thenReturn(List.of(inRange, outOfRange));

        LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 4, 30, 23, 59);

        AnalyticsResponseDTO dto = analyticsService.getCarUtilizationAnalytics(start, end);

        assertEquals(1, dto.getCarUtilizations().get(0).getTotalBookings());
        assertEquals(2, dto.getCarUtilizations().get(0).getTotalBookingHours());
    }

    @Test
    void carUtilizationByProviderFiltersToProviderCars() {
        Car car = createCar(1L, "Honda");

        when(carRepository.findByProviderId(10L)).thenReturn(List.of(car));
        when(bookingRepository.findByCarId(1L)).thenReturn(List.of());

        AnalyticsResponseDTO dto = analyticsService.getCarUtilizationAnalyticsByProvider(10L);

        assertEquals(1, dto.getCarUtilizations().size());
        assertEquals(0, dto.getCarUtilizations().get(0).getTotalBookings());
    }

    // --- Validation ---

    @Test
    void validateDateRangeThrowsWhenOnlyStartProvided() {
        assertThrows(RuntimeException.class, () ->
                analyticsService.getCarUtilizationAnalytics(LocalDateTime.now(), null));
    }

    @Test
    void validateDateRangeThrowsWhenOnlyEndProvided() {
        assertThrows(RuntimeException.class, () ->
                analyticsService.getCarUtilizationAnalytics(null, LocalDateTime.now()));
    }

    @Test
    void validateDateRangeThrowsWhenStartAfterEnd() {
        LocalDateTime start = LocalDateTime.of(2026, 5, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 4, 1, 0, 0);
        assertThrows(RuntimeException.class, () ->
                analyticsService.getCarUtilizationAnalytics(start, end));
    }

    // --- Empty data ---

    @Test
    void adminDashboardHandlesEmptyData() {
        when(bookingRepository.findAll()).thenReturn(List.of());
        when(carRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());

        DashboardAnalyticsDTO dto = analyticsService.getAdminDashboard();

        assertEquals(0L, dto.getStats().get("totalBookings"));
        assertEquals(0.0, dto.getStats().get("totalRevenue"));
    }

    @Test
    void learnerDashboardHandlesNoBookings() {
        when(bookingRepository.findByLearnerIdOrderByDateDesc(1L)).thenReturn(List.of());

        DashboardAnalyticsDTO dto = analyticsService.getLearnerDashboard(1L);

        assertEquals(0L, dto.getStats().get("totalBookings"));
        assertEquals(0.0, dto.getStats().get("totalSpent"));
    }
}
