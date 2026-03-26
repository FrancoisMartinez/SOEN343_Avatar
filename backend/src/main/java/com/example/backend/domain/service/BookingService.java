package com.example.backend.domain.service;

import com.example.backend.application.dto.BookingRequest;
import com.example.backend.application.dto.BookingResponse;
import com.example.backend.application.dto.FinishBookingRequest;
import com.example.backend.domain.model.*;
import com.example.backend.domain.service.observer.BookingEvent;
import com.example.backend.domain.service.observer.BookingEventPublisher;
import com.example.backend.domain.service.state.BookingContext;
import com.example.backend.domain.service.pricing.PricingStrategy;
import com.example.backend.domain.service.pricing.PricingStrategyFactory;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import com.example.backend.infrastructure.repository.LearnerRepository;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final LearnerRepository learnerRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final PricingStrategyFactory pricingStrategyFactory;
    private final BookingEventPublisher bookingEventPublisher;

    public BookingService(BookingRepository bookingRepository,
                          CarRepository carRepository,
                          LearnerRepository learnerRepository,
                          AvailabilitySlotRepository availabilitySlotRepository,
                          PricingStrategyFactory pricingStrategyFactory,
                          BookingEventPublisher bookingEventPublisher) {
        this.bookingRepository = bookingRepository;
        this.carRepository = carRepository;
        this.learnerRepository = learnerRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.pricingStrategyFactory = pricingStrategyFactory;
        this.bookingEventPublisher = bookingEventPublisher;
    }

    /**
     * Creates a new booking after validating availability and checking for overlaps.
     * Total cost is computed server-side: duration * hourlyRate.
     */
    public BookingResponse createBooking(BookingRequest request) {
        if (request.getDuration() < 1 || request.getDuration() > 12) {
            throw new IllegalArgumentException("Duration must be between 1 and 12 hours");
        }

        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new IllegalArgumentException("Car not found"));

        Learner learner = learnerRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime startTime = LocalTime.parse(request.getStartTime());
        LocalTime endTime = startTime.plusHours(request.getDuration());

        validateAvailability(car.getId(), date, startTime, endTime);
        validateNoOverlap(car.getId(), date, startTime, endTime);

        // Strategy Pattern: delegate pricing to the selected strategy
        PricingStrategy pricingStrategy = pricingStrategyFactory.getStrategy(request.getPricingStrategy());
        double totalCost = pricingStrategy.calculatePrice(car, request.getDuration(), date, startTime);

        Booking booking = new Booking();
        booking.setCar(car);
        booking.setLearner(learner);
        booking.setDate(date);
        booking.setStartTime(startTime);
        booking.setDuration(request.getDuration());
        booking.setTotalCost(totalCost);
        booking.setStatus("CONFIRMED");

        Booking saved = bookingRepository.save(booking);

        // Observer Pattern: notify all observers about the new booking
        bookingEventPublisher.publish(new BookingEvent(BookingEvent.EventType.CREATED, saved));

        return toResponse(saved);
    }

    /**
     * Returns all bookings for a given learner.
     */
    public List<BookingResponse> getBookingsForLearner(Long learnerId) {
        return bookingRepository.findByLearnerIdOrderByDateDesc(learnerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns all bookings for cars owned by a given provider (read-only).
     */
    public List<BookingResponse> getBookingsForProvider(Long providerId) {
        return bookingRepository.findByProviderIdOrderByDateDesc(providerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Finishes a booking: deducts balance from learner and updates car location.
     */
    @Transactional
    public BookingResponse finishBooking(Long bookingId, FinishBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // State Pattern: delegate transition validation to the current state
        BookingContext bookingContext = new BookingContext(booking);
        bookingContext.finish(); // throws IllegalStateException if transition is invalid

        // Deduct balance from learner
        Learner learner = booking.getLearner();
        if (learner.getBalance() < booking.getTotalCost()) {
            throw new IllegalArgumentException("Insufficient balance");
        }
        learner.setBalance(learner.getBalance() - booking.getTotalCost());
        learnerRepository.save(learner);

        // Update car location
        Car car = booking.getCar();
        if (request != null && request.getLatitude() != null && request.getLongitude() != null) {
            car.setLatitude(request.getLatitude());
            car.setLongitude(request.getLongitude());
            if (request.getLocation() != null && !request.getLocation().isBlank()) {
                car.setLocation(request.getLocation());
            }
            carRepository.save(car);
        }

        Booking saved = bookingRepository.save(booking);

        // Observer Pattern: notify all observers about the finished booking
        bookingEventPublisher.publish(new BookingEvent(BookingEvent.EventType.FINISHED, saved));

        return toResponse(saved);
    }

    private void validateAvailability(Long carId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<AvailabilitySlot> slots = availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(carId);

        boolean fits = slots.stream()
                .filter(slot -> slot.getDayOfWeek() == dayOfWeek && slot.isAvailable())
                .anyMatch(slot -> {
                    int slotStart = slot.getStartMinute();
                    int slotEnd = slot.getEndMinute();
                    int reqStart = startTime.getHour() * 60 + startTime.getMinute();
                    int reqEnd = endTime.getHour() * 60 + endTime.getMinute();
                    return reqStart >= slotStart && reqEnd <= slotEnd;
                });

        if (!fits) {
            throw new IllegalArgumentException("Car is not available for this timeslot");
        }
    }

    private void validateNoOverlap(Long carId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Booking> existingBookings = bookingRepository.findActiveBookingsByCarAndDate(carId, date);

        int reqStart = startTime.getHour() * 60 + startTime.getMinute();
        int reqEnd = endTime.getHour() * 60 + endTime.getMinute();

        boolean hasOverlap = existingBookings.stream().anyMatch(b -> {
            int bStart = b.getStartTime().getHour() * 60 + b.getStartTime().getMinute();
            int bEnd = bStart + (b.getDuration() * 60);
            return reqStart < bEnd && reqEnd > bStart;
        });

        if (hasOverlap) {
            throw new IllegalArgumentException("This timeslot overlaps with an existing booking");
        }
    }

    private BookingResponse toResponse(Booking booking) {
        BookingResponse res = new BookingResponse();
        res.setId(booking.getId());
        res.setCarId(booking.getCar().getId());
        res.setCarName(booking.getCar().getMakeModel());
        res.setUserId(booking.getLearner().getId());
        res.setLearnerName(booking.getLearner().getFullName());
        res.setDate(booking.getDate().toString());
        res.setStartTime(booking.getStartTime().toString());
        res.setDuration(booking.getDuration());
        res.setTotalCost(booking.getTotalCost());
        res.setStatus(booking.getStatus());
        return res;
    }
}
