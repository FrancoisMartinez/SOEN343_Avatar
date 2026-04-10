package com.example.backend.domain.service;

import com.example.backend.application.dto.BookingRequest;
import com.example.backend.application.dto.BookingResponse;
import com.example.backend.application.dto.FinishBookingRequest;
import com.example.backend.domain.model.*;
import com.example.backend.domain.service.observer.BookingEventPublisher;
import com.example.backend.domain.service.pricing.PricingStrategy;
import com.example.backend.domain.service.pricing.PricingStrategyFactory;
import com.example.backend.infrastructure.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private CarRepository carRepository;
    @Mock private LearnerRepository learnerRepository;
    @Mock private AvailabilitySlotRepository availabilitySlotRepository;
    @Mock private PricingStrategyFactory pricingStrategyFactory;
    @Mock private BookingEventPublisher bookingEventPublisher;
    @Mock private InstructorRepository instructorRepository;

    @InjectMocks
    private BookingService bookingService;

    // --- Helper methods ---

    private Learner createLearner(Long id, double balance) {
        Learner learner = new Learner();
        learner.setId(id);
        learner.setFullName("Test Learner");
        learner.setBalance(balance);
        return learner;
    }

    private Car createCar(Long id, double hourlyRate) {
        Car car = new Car();
        car.setId(id);
        car.setMakeModel("Test Car");
        car.setHourlyRate(hourlyRate);
        return car;
    }

    private Instructor createInstructor(Long id, double hourlyRate) {
        Instructor instructor = new Instructor();
        instructor.setId(id);
        instructor.setFullName("Test Instructor");
        instructor.setHourlyRate(hourlyRate);
        instructor.setRating(4.0);
        instructor.setRatingCount(5);
        return instructor;
    }

    private AvailabilitySlot createSlot(DayOfWeek day, int startMin, int endMin) {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setDayOfWeek(day);
        slot.setStartMinute(startMin);
        slot.setEndMinute(endMin);
        slot.setAvailable(true);
        return slot;
    }

    private BookingRequest createCarBookingRequest(Long carId, Long userId, String date, String startTime, int duration) {
        BookingRequest req = new BookingRequest();
        req.setCarId(carId);
        req.setUserId(userId);
        req.setDate(date);
        req.setStartTime(startTime);
        req.setDuration(duration);
        return req;
    }

    private BookingRequest createInstructorBookingRequest(Long instructorId, Long userId, String date, String startTime, int duration) {
        BookingRequest req = new BookingRequest();
        req.setInstructorId(instructorId);
        req.setUserId(userId);
        req.setDate(date);
        req.setStartTime(startTime);
        req.setDuration(duration);
        return req;
    }

    // --- createBooking: validation ---

    @Test
    void createBookingThrowsWhenDurationTooLow() {
        BookingRequest req = createCarBookingRequest(1L, 1L, "2027-04-10", "10:00", 0);
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    @Test
    void createBookingThrowsWhenDurationTooHigh() {
        BookingRequest req = createCarBookingRequest(1L, 1L, "2027-04-10", "10:00", 13);
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    @Test
    void createBookingThrowsWhenNoCarOrInstructor() {
        BookingRequest req = new BookingRequest();
        req.setUserId(1L);
        req.setDate("2027-04-10");
        req.setStartTime("10:00");
        req.setDuration(2);
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    @Test
    void createBookingThrowsWhenLearnerNotFound() {
        BookingRequest req = createCarBookingRequest(1L, 999L, "2027-04-10", "10:00", 2);
        when(learnerRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    @Test
    void createBookingThrowsWhenDateInPast() {
        BookingRequest req = createCarBookingRequest(1L, 1L, "2020-01-01", "10:00", 2);
        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 100.0)));
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    @Test
    void createBookingThrowsWhenCarNotFound() {
        BookingRequest req = createCarBookingRequest(999L, 1L, "2027-06-15", "10:00", 2);
        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 100.0)));
        when(carRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    @Test
    void createBookingThrowsWhenInstructorNotFound() {
        BookingRequest req = createInstructorBookingRequest(999L, 1L, "2027-06-15", "10:00", 2);
        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 100.0)));
        when(instructorRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    // --- createBooking: success paths ---

    @Test
    void createCarBookingSuccessfully() {
        // 2027-06-15 is a Tuesday
        BookingRequest req = createCarBookingRequest(1L, 1L, "2027-06-15", "10:00", 2);
        req.setPricingStrategy("STANDARD");

        Learner learner = createLearner(1L, 500.0);
        Car car = createCar(1L, 50.0);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(carRepository.findById(1L)).thenReturn(Optional.of(car));
        when(availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(1L))
                .thenReturn(List.of(createSlot(DayOfWeek.TUESDAY, 480, 1080))); // 8:00-18:00 (June 15, 2027 is Tuesday)
        when(bookingRepository.findActiveBookingsByCarAndDate(eq(1L), any())).thenReturn(List.of());

        PricingStrategy mockStrategy = mock(PricingStrategy.class);
        when(mockStrategy.calculatePrice(car, 2, LocalDate.of(2027, 6, 15), LocalTime.of(10, 0))).thenReturn(100.0);
        when(pricingStrategyFactory.getStrategy("STANDARD")).thenReturn(mockStrategy);

        Booking savedBooking = new Booking();
        savedBooking.setId(1L);
        savedBooking.setCar(car);
        savedBooking.setLearner(learner);
        savedBooking.setDate(LocalDate.of(2027, 6, 15));
        savedBooking.setStartTime(LocalTime.of(10, 0));
        savedBooking.setDuration(2);
        savedBooking.setTotalCost(100.0);
        savedBooking.setStatus("CONFIRMED");
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingResponse response = bookingService.createBooking(req);

        assertEquals(1L, response.getId());
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals(100.0, response.getTotalCost());
        verify(bookingEventPublisher).publish(any());
    }

    @Test
    void createInstructorBookingSuccessfully() {
        // 2027-06-16 is a Wednesday
        BookingRequest req = createInstructorBookingRequest(5L, 1L, "2027-06-16", "14:00", 1);

        Learner learner = createLearner(1L, 500.0);
        Instructor instructor = createInstructor(5L, 60.0);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(instructorRepository.findById(5L)).thenReturn(Optional.of(instructor));
        when(availabilitySlotRepository.findByInstructorIdOrderByDayOfWeekAscStartMinuteAsc(5L))
                .thenReturn(List.of(createSlot(DayOfWeek.WEDNESDAY, 720, 1080))); // 12:00-18:00
        when(bookingRepository.findActiveBookingsByInstructorAndDate(eq(5L), any())).thenReturn(List.of());

        Booking savedBooking = new Booking();
        savedBooking.setId(2L);
        savedBooking.setInstructor(instructor);
        savedBooking.setLearner(learner);
        savedBooking.setDate(LocalDate.of(2027, 6, 16));
        savedBooking.setStartTime(LocalTime.of(14, 0));
        savedBooking.setDuration(1);
        savedBooking.setTotalCost(60.0);
        savedBooking.setStatus("PENDING");
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingResponse response = bookingService.createBooking(req);

        assertEquals(2L, response.getId());
        assertEquals("PENDING", response.getStatus());
        assertEquals(60.0, response.getTotalCost());
    }

    @Test
    void createBookingThrowsWhenCarNotAvailableForTimeslot() {
        BookingRequest req = createCarBookingRequest(1L, 1L, "2027-06-15", "10:00", 2);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carRepository.findById(1L)).thenReturn(Optional.of(createCar(1L, 50.0)));
        // No matching slots
        when(availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(1L)).thenReturn(List.of());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
        assertEquals("Car is not available for this timeslot", ex.getMessage());
    }

    @Test
    void createBookingThrowsWhenOverlapExists() {
        BookingRequest req = createCarBookingRequest(1L, 1L, "2027-06-15", "10:00", 2);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carRepository.findById(1L)).thenReturn(Optional.of(createCar(1L, 50.0)));
        when(availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(1L))
                .thenReturn(List.of(createSlot(DayOfWeek.TUESDAY, 480, 1080)));

        // Existing booking from 9:00-11:00 overlaps with 10:00-12:00
        Booking existing = new Booking();
        existing.setStartTime(LocalTime.of(9, 0));
        existing.setDuration(2);
        when(bookingRepository.findActiveBookingsByCarAndDate(eq(1L), any())).thenReturn(List.of(existing));

        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req));
    }

    // --- confirmBooking ---

    @Test
    void confirmBookingTransitionsPendingToConfirmed() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus("PENDING");
        Learner learner = createLearner(1L, 100.0);
        booking.setLearner(learner);
        booking.setDate(LocalDate.of(2027, 6, 15));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(2);
        booking.setTotalCost(100.0);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse response = bookingService.confirmBooking(1L, null);
        assertEquals("CONFIRMED", response.getStatus());
    }

    @Test
    void confirmBookingAssignsCarIfProvided() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus("PENDING");
        Learner learner = createLearner(1L, 100.0);
        booking.setLearner(learner);
        booking.setDate(LocalDate.of(2027, 6, 15));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(2);
        booking.setTotalCost(100.0);

        Car car = createCar(5L, 50.0);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(carRepository.findById(5L)).thenReturn(Optional.of(car));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse response = bookingService.confirmBooking(1L, 5L);
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals(5L, response.getCarId());
    }

    @Test
    void confirmBookingThrowsWhenNotFound() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> bookingService.confirmBooking(999L, null));
    }

    // --- cancelBooking ---

    @Test
    void cancelBookingTransitionsToCancel() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus("CONFIRMED");
        Learner learner = createLearner(1L, 100.0);
        booking.setLearner(learner);
        booking.setDate(LocalDate.of(2027, 6, 15));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(2);
        booking.setTotalCost(100.0);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse response = bookingService.cancelBooking(1L);
        assertEquals("CANCELLED", response.getStatus());
        verify(bookingEventPublisher).publish(any());
    }

    // --- finishBooking ---

    @Test
    void finishBookingDeductsBalanceAndUpdatesCarLocation() {
        Learner learner = createLearner(1L, 500.0);
        Car car = createCar(1L, 50.0);

        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus("CONFIRMED");
        booking.setLearner(learner);
        booking.setCar(car);
        booking.setDate(LocalDate.of(2027, 6, 15));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(2);
        booking.setTotalCost(100.0);

        FinishBookingRequest finishReq = new FinishBookingRequest();
        finishReq.setLatitude(45.5);
        finishReq.setLongitude(-73.6);
        finishReq.setLocation("New Location");

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse response = bookingService.finishBooking(1L, finishReq);

        assertEquals("FINISHED", response.getStatus());
        assertEquals(400.0, learner.getBalance());
        assertEquals(45.5, car.getLatitude());
        assertEquals(-73.6, car.getLongitude());
        assertEquals("New Location", car.getLocation());
        verify(learnerRepository).save(learner);
        verify(carRepository).save(car);
        verify(bookingEventPublisher).publish(any());
    }

    @Test
    void finishBookingThrowsWhenInsufficientBalance() {
        Learner learner = createLearner(1L, 50.0);

        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus("CONFIRMED");
        booking.setLearner(learner);
        booking.setDate(LocalDate.of(2027, 6, 15));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(2);
        booking.setTotalCost(100.0);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThrows(IllegalArgumentException.class, () -> bookingService.finishBooking(1L, null));
    }

    @Test
    void finishBookingRatesInstructor() {
        Learner learner = createLearner(1L, 500.0);
        Instructor instructor = createInstructor(5L, 60.0);

        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus("CONFIRMED");
        booking.setLearner(learner);
        booking.setInstructor(instructor);
        booking.setDate(LocalDate.of(2027, 6, 15));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(1);
        booking.setTotalCost(60.0);

        FinishBookingRequest finishReq = new FinishBookingRequest();
        finishReq.setRating(5);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        bookingService.finishBooking(1L, finishReq);

        verify(instructorRepository).save(instructor);
    }

    // --- getBookingsForLearner / Provider / Instructor ---

    @Test
    void getBookingsForLearnerReturnsBookings() {
        Learner learner = createLearner(1L, 100.0);
        Car car = createCar(1L, 50.0);

        Booking b = new Booking();
        b.setId(1L);
        b.setCar(car);
        b.setLearner(learner);
        b.setDate(LocalDate.of(2027, 6, 15));
        b.setStartTime(LocalTime.of(10, 0));
        b.setDuration(2);
        b.setTotalCost(100.0);
        b.setStatus("CONFIRMED");

        when(bookingRepository.findByLearnerIdOrderByDateDesc(1L)).thenReturn(List.of(b));

        List<BookingResponse> responses = bookingService.getBookingsForLearner(1L);
        assertEquals(1, responses.size());
        assertEquals(1L, responses.get(0).getId());
    }

    @Test
    void getBookingsForProviderReturnsBookings() {
        Learner learner = createLearner(1L, 100.0);
        Car car = createCar(1L, 50.0);

        Booking b = new Booking();
        b.setId(1L);
        b.setCar(car);
        b.setLearner(learner);
        b.setDate(LocalDate.of(2027, 6, 15));
        b.setStartTime(LocalTime.of(10, 0));
        b.setDuration(2);
        b.setTotalCost(100.0);
        b.setStatus("CONFIRMED");

        when(bookingRepository.findByProviderIdOrderByDateDesc(10L)).thenReturn(List.of(b));

        List<BookingResponse> responses = bookingService.getBookingsForProvider(10L);
        assertEquals(1, responses.size());
    }

    @Test
    void getBookingsForInstructorReturnsBookings() {
        Learner learner = createLearner(1L, 100.0);
        Instructor instructor = createInstructor(5L, 60.0);

        Booking b = new Booking();
        b.setId(1L);
        b.setInstructor(instructor);
        b.setLearner(learner);
        b.setDate(LocalDate.of(2027, 6, 15));
        b.setStartTime(LocalTime.of(14, 0));
        b.setDuration(1);
        b.setTotalCost(60.0);
        b.setStatus("PENDING");

        when(bookingRepository.findByInstructorIdOrderByDateDesc(5L)).thenReturn(List.of(b));

        List<BookingResponse> responses = bookingService.getBookingsForInstructor(5L);
        assertEquals(1, responses.size());
        assertEquals("Test Instructor", responses.get(0).getInstructorName());
    }
}
