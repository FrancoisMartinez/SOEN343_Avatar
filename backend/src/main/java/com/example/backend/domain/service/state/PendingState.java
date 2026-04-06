package com.example.backend.domain.service.state;

/**
 * State representing a pending booking (waiting for confirmation).
 * Valid transitions: PENDING → CONFIRMED, PENDING → CANCELLED.
 */
public class PendingState implements BookingState {

    @Override
    public String getStateName() { return "PENDING"; }

    @Override
    public void confirm(BookingContext context) {
        context.setState(new ConfirmedState());
    }

    @Override
    public void finish(BookingContext context) {
        throw new IllegalStateException("Cannot finish a pending booking. It must be confirmed first.");
    }

    @Override
    public void cancel(BookingContext context) {
        context.setState(new CancelledState());
    }
}
