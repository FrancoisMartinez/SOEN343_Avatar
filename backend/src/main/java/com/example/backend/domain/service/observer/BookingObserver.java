package com.example.backend.domain.service.observer;

/**
 * Observer interface for booking lifecycle events.
 * Implementations react to booking creation, completion, or cancellation.
 */
public interface BookingObserver {
    void onBookingEvent(BookingEvent event);
}
