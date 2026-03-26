package com.example.backend.domain.service.state;

/**
 * State representing a confirmed booking.
 * Valid transitions: CONFIRMED → FINISHED, CONFIRMED → CANCELLED.
 */
public class ConfirmedState implements BookingState {

    @Override
    public String getStateName() { return "CONFIRMED"; }

    @Override
    public void finish(BookingContext context) {
        context.setState(new FinishedState());
    }

    @Override
    public void cancel(BookingContext context) {
        context.setState(new CancelledState());
    }
}
