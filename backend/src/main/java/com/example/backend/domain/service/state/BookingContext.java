package com.example.backend.domain.service.state;

import com.example.backend.domain.model.Booking;

/**
 * Context that wraps a Booking entity and delegates state-dependent
 * behavior to the current BookingState object.
 */
public class BookingContext {

    private final Booking booking;
    private BookingState currentState;

    public BookingContext(Booking booking) {
        this.booking = booking;
        this.currentState = resolveState(booking.getStatus());
    }

    public void setState(BookingState state) {
        this.currentState = state;
        this.booking.setStatus(state.getStateName());
    }

    public void confirm() {
        currentState.confirm(this);
    }

    public void finish() {
        currentState.finish(this);
    }

    public void cancel() {
        currentState.cancel(this);
    }

    public Booking getBooking() { return booking; }
    public BookingState getCurrentState() { return currentState; }

    private static BookingState resolveState(String status) {
        return switch (status) {
            case "PENDING" -> new PendingState();
            case "CONFIRMED" -> new ConfirmedState();
            case "FINISHED" -> new FinishedState();
            case "CANCELLED" -> new CancelledState();
            default -> throw new IllegalArgumentException("Unknown booking status: " + status);
        };
    }
}
