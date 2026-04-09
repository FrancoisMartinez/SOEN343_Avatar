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
import com.example.backend.infrastructure.repository.InstructorRepository;
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
    private final InstructorRepository instructorRepository;

    public BookingService(BookingRepository bookingRepository,
                          CarRepository carRepository,
                          LearnerRepository learnerRepository,
                          AvailabilitySlotRepository availabilitySlotRepository,
                          PricingStrategyFactory pricingStrategyFactory,
                          BookingEventPublisher bookingEventPublisher,
                          InstructorRepository instructorRepository) {
        this.bookingRepository = bookingRepository;
        this.carRepository = carRepository;
        this.learnerRepository = learnerRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.pricingStrategyFactory = pricingStrategyFactory;
        this.bookingEventPublisher = bookingEventPublisher;
        this.instructorRepository = instructorRepository;
    }

    /**
     * Creates a new booking after validating availability and checking for overlaps. 
     * Total cost is computed server-side: duration * hourlyRate.
     */
    public BookingResponse createBooking(BookingRequest request) {
        if (request.getDuration() < 1 || request.getDuration() > 12) {
            throw new IllegalArgumentException("Duration must be between 1 and 12 hours");
        }

        if (request.getCarId() == null && request.getInstructorId() == null) {
            throw new IllegalArgumentException("Either Car ID or Instructor ID must be provided");
        }

        Learner learner = learnerRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime startTime = LocalTime.parse(request.getStartTime());
        LocalTime endTime = startTime.plusHours(request.getDuration());

        // Validate booking is at least 1 hour in the future
        if (date.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot book in the past");
        }
        if (date.isEqual(LocalDate.now())) {
            if (startTime.isBefore(LocalTime.now().plusHours(1))) {
                throw new IllegalArgumentException("Bookings must be at least 1 hour in advance");
            }
        }

        Car car = null;
        Instructor instructor = null;
        double totalCost = 0.0;

        if (request.getCarId() != null) {
            car = carRepository.findById(request.getCarId())
                    .orElseThrow(() -> new IllegalArgumentException("Car not found"));    
            validateAvailability(car.getId(), date, startTime, endTime);
            validateNoOverlap(car.getId(), date, startTime, endTime);

            // Strategy Pattern: delegate pricing to the selected strategy
            PricingStrategy pricingStrategy = pricingStrategyFactory.getStrategy(request.getPricingStrategy());
            totalCost = pricingStrategy.calculatePrice(car, request.getDuration(), date, startTime);
        } else if (request.getInstructorId() != null) {
            instructor = instructorRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new IllegalArgumentException("Instructor not found"));
            validateInstructorAvailability(instructor.getId(), date, startTime, endTime);
            validateInstructorNoOverlap(instructor.getId(), date, startTime, endTime);
            
            totalCost = instructor.getHourlyRate() * request.getDuration();
        }

        Booking booking = new Booking();
        if (car != null) {
            booking.setCar(car);
        }
        if (instructor != null) {
            booking.setInstructor(instructor);
        }
        booking.setLearner(learner);
        booking.setDate(date);
        booking.setStartTime(startTime);
        booking.setDuration(request.getDuration());
        booking.setTotalCost(totalCost);
        booking.setStatus(instructor != null ? "PENDING" : "CONFIRMED");

        Booking saved = bookingRepository.save(booking);

        // Observer Pattern: notify all observers about the new booking
        bookingEventPublisher.publish(new BookingEvent(BookingEvent.EventType.CREATED, saved));

        return toResponse(saved);
    }

    /**
     * Confirms a pending booking. Optionally assigns a car if provided.
     */
    @Transactional
    public BookingResponse confirmBooking(Long bookingId, Long carId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        BookingContext context = new BookingContext(booking);
        context.confirm(); // Transitions PENDING -> CONFIRMED

        if (carId != null) {
            Car car = carRepository.findById(carId)
                    .orElseThrow(() -> new IllegalArgumentException("Car not found"));
            booking.setCar(car);
        }

        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    /**
     * Cancels a booking.
     */
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        BookingContext context = new BookingContext(booking);
        context.cancel(); // Transitions PENDING/CONFIRMED -> CANCELLED

        Booking saved = bookingRepository.save(booking);
        bookingEventPublisher.publish(new BookingEvent(BookingEvent.EventType.CANCELLED, saved));
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
     * Returns all bookings for a given instructor.
     */
    public List<BookingResponse> getBookingsForInstructor(Long instructorId) {
        return bookingRepository.findByInstructorIdOrderByDateDesc(instructorId)
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

        // Update car location (if it was a car booking)
        if (booking.getCar() != null) {
            Car car = booking.getCar();
            if (request != null && request.getLatitude() != null && request.getLongitude() != null) {
                car.setLatitude(request.getLatitude());
                car.setLongitude(request.getLongitude());
                if (request.getLocation() != null && !request.getLocation().isBlank()) {  
                    car.setLocation(request.getLocation());
                }
                carRepository.save(car);
            }
        }

        // Update instructor rating (if it was an instructor booking)
        if (booking.getInstructor() != null && request != null && request.getRating() != null) {
            Instructor instructor = booking.getInstructor();
            instructor.addRating(request.getRating());
            instructorRepository.save(instructor);
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

    private void validateInstructorAvailability(Long instructorId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<AvailabilitySlot> slots = availabilitySlotRepository.findByInstructorIdOrderByDayOfWeekAscStartMinuteAsc(instructorId);

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
            throw new IllegalArgumentException("Instructor is not available for this timeslot");
        }
    }

    private void validateInstructorNoOverlap(Long instructorId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Booking> existingBookings = bookingRepository.findActiveBookingsByInstructorAndDate(instructorId, date);

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
        
        if (booking.getCar() != null) {
            res.setCarId(booking.getCar().getId());
            res.setCarName(booking.getCar().getMakeModel());
        }
        
        if (booking.getInstructor() != null) {
            res.setInstructorId(booking.getInstructor().getId());
            res.setInstructorName(booking.getInstructor().getFullName());
        }
        
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
