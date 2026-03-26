package com.example.backend.domain.service.state;

/**
 * Terminal state representing a cancelled booking.
 * No further transitions are allowed.
 */
public class CancelledState implements BookingState {

    @Override
    public String getStateName() { return "CANCELLED"; }

    @Override
    public void finish(BookingContext context) {
        throw new IllegalStateException("Cannot finish a cancelled booking");
    }

    @Override
    public void cancel(BookingContext context) {
        throw new IllegalStateException("Booking is already cancelled");
    }
}
