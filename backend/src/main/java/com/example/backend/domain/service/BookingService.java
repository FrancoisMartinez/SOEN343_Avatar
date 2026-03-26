package com.example.backend.domain.service;

import com.example.backend.application.dto.BookingRequest;
import com.example.backend.application.dto.BookingResponse;
import com.example.backend.domain.model.*;
import com.example.backend.infrastructure.repository.BookingRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import com.example.backend.infrastructure.repository.LearnerRepository;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import org.springframework.stereotype.Service;

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

    public BookingService(BookingRepository bookingRepository,
                          CarRepository carRepository,
                          LearnerRepository learnerRepository,
                          AvailabilitySlotRepository availabilitySlotRepository) {
        this.bookingRepository = bookingRepository;
        this.carRepository = carRepository;
        this.learnerRepository = learnerRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
    }

    /**
     * Creates a new booking after validating availability and checking for overlaps.
     * Total cost is computed server-side: duration * hourlyRate.
     */
    public BookingResponse createBooking(BookingRequest request) {
        // Validate duration range
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

        // Validate that the requested slot fits within the car's weekly availability
        validateAvailability(car.getId(), date, startTime, endTime);

        // Prevent overlapping bookings for the same car on the same date
        validateNoOverlap(car.getId(), date, startTime, endTime);

        // Calculate cost
        double totalCost = request.getDuration() * car.getHourlyRate();

        // Create and save the booking
        Booking booking = new Booking();
        booking.setCar(car);
        booking.setLearner(learner);
        booking.setDate(date);
        booking.setStartTime(startTime);
        booking.setDuration(request.getDuration());
        booking.setTotalCost(totalCost);
        booking.setStatus("CONFIRMED");

        Booking saved = bookingRepository.save(booking);
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
     * Marks a booking as FINISHED (placeholder - no business logic yet).
     */
    public BookingResponse finishBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        booking.setStatus("FINISHED");
        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    /**
     * Checks that the requested time slot falls within one of the car's
     * weekly availability windows for the corresponding day of week.
     */
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

    /**
     * Ensures no existing booking for the same car on the same date
     * overlaps with the requested time window.
     */
    private void validateNoOverlap(Long carId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Booking> existingBookings = bookingRepository.findActiveBookingsByCarAndDate(carId, date);

        int reqStart = startTime.getHour() * 60 + startTime.getMinute();
        int reqEnd = endTime.getHour() * 60 + endTime.getMinute();

        boolean hasOverlap = existingBookings.stream().anyMatch(b -> {
            int bStart = b.getStartTime().getHour() * 60 + b.getStartTime().getMinute();
            int bEnd = bStart + (b.getDuration() * 60);
            // Two ranges overlap if one starts before the other ends
            return reqStart < bEnd && reqEnd > bStart;
        });

        if (hasOverlap) {
            throw new IllegalArgumentException("This timeslot overlaps with an existing booking");
        }
    }

    /** Maps a Booking entity to the response DTO */
    private BookingResponse toResponse(Booking booking) {
        BookingResponse res = new BookingResponse();
        res.setId(booking.getId());
        res.setCarId(booking.getCar().getId());
        res.setCarName(booking.getCar().getMakeModel());
        res.setUserId(booking.getLearner().getId());
        res.setDate(booking.getDate().toString());
        res.setStartTime(booking.getStartTime().toString());
        res.setDuration(booking.getDuration());
        res.setTotalCost(booking.getTotalCost());
        res.setStatus(booking.getStatus());
        return res;
    }
}
