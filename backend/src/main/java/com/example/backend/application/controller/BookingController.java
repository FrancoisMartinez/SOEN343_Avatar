package com.example.backend.application.controller;

import com.example.backend.application.dto.BookingRequest;
import com.example.backend.application.dto.BookingResponse;
import com.example.backend.application.dto.FinishBookingRequest;
import com.example.backend.domain.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /** POST /api/bookings - Create a new booking */
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request) {
        try {
            BookingResponse booking = bookingService.createBooking(request);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/bookings/learner/{learnerId} - Get all bookings for a learner */
    @GetMapping("/learner/{learnerId}")
    public ResponseEntity<List<BookingResponse>> getLearnerBookings(@PathVariable Long learnerId) {
        List<BookingResponse> bookings = bookingService.getBookingsForLearner(learnerId);
        return ResponseEntity.ok(bookings);
    }

    /** GET /api/bookings/provider/{providerId} - Get all bookings for a provider's cars */
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<List<BookingResponse>> getProviderBookings(@PathVariable Long providerId) {
        List<BookingResponse> bookings = bookingService.getBookingsForProvider(providerId);
        return ResponseEntity.ok(bookings);
    }

    /** PUT /api/bookings/{bookingId}/finish - Finish booking with new car location */
    @PutMapping("/{bookingId}/finish")
    public ResponseEntity<?> finishBooking(@PathVariable Long bookingId,
                                           @RequestBody(required = false) FinishBookingRequest request) {
        try {
            BookingResponse booking = bookingService.finishBooking(bookingId, request);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
