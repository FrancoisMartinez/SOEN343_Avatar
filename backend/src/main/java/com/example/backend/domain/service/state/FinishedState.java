package com.example.backend.domain.service.state;

/**
 * Terminal state representing a finished booking.
 * No further transitions are allowed.
 */
public class FinishedState implements BookingState {

    @Override
    public String getStateName() { return "FINISHED"; }

    @Override
    public void finish(BookingContext context) {
        throw new IllegalStateException("Booking is already finished");
    }

    @Override
    public void cancel(BookingContext context) {
        throw new IllegalStateException("Cannot cancel a finished booking");
    }
}
