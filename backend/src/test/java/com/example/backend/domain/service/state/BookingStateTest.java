package com.example.backend.domain.service.state;

import com.example.backend.domain.model.Booking;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BookingStateTest {

    private BookingContext contextWithStatus(String status) {
        Booking booking = new Booking();
        booking.setStatus(status);
        return new BookingContext(booking);
    }

    // --- PendingState transitions ---

    @Test
    void pendingCanBeConfirmed() {
        BookingContext ctx = contextWithStatus("PENDING");
        ctx.confirm();
        assertEquals("CONFIRMED", ctx.getBooking().getStatus());
    }

    @Test
    void pendingCanBeCancelled() {
        BookingContext ctx = contextWithStatus("PENDING");
        ctx.cancel();
        assertEquals("CANCELLED", ctx.getBooking().getStatus());
    }

    @Test
    void pendingCannotBeFinished() {
        BookingContext ctx = contextWithStatus("PENDING");
        assertThrows(IllegalStateException.class, ctx::finish);
    }

    // --- ConfirmedState transitions ---

    @Test
    void confirmedCanBeFinished() {
        BookingContext ctx = contextWithStatus("CONFIRMED");
        ctx.finish();
        assertEquals("FINISHED", ctx.getBooking().getStatus());
    }

    @Test
    void confirmedCanBeCancelled() {
        BookingContext ctx = contextWithStatus("CONFIRMED");
        ctx.cancel();
        assertEquals("CANCELLED", ctx.getBooking().getStatus());
    }

    @Test
    void confirmedCannotBeConfirmedAgain() {
        BookingContext ctx = contextWithStatus("CONFIRMED");
        assertThrows(IllegalStateException.class, ctx::confirm);
    }

    // --- FinishedState (terminal) ---

    @Test
    void finishedCannotBeConfirmed() {
        BookingContext ctx = contextWithStatus("FINISHED");
        assertThrows(IllegalStateException.class, ctx::confirm);
    }

    @Test
    void finishedCannotBeFinishedAgain() {
        BookingContext ctx = contextWithStatus("FINISHED");
        assertThrows(IllegalStateException.class, ctx::finish);
    }

    @Test
    void finishedCannotBeCancelled() {
        BookingContext ctx = contextWithStatus("FINISHED");
        assertThrows(IllegalStateException.class, ctx::cancel);
    }

    // --- CancelledState (terminal) ---

    @Test
    void cancelledCannotBeConfirmed() {
        BookingContext ctx = contextWithStatus("CANCELLED");
        assertThrows(IllegalStateException.class, ctx::confirm);
    }

    @Test
    void cancelledCannotBeFinished() {
        BookingContext ctx = contextWithStatus("CANCELLED");
        assertThrows(IllegalStateException.class, ctx::finish);
    }

    @Test
    void cancelledCannotBeCancelledAgain() {
        BookingContext ctx = contextWithStatus("CANCELLED");
        assertThrows(IllegalStateException.class, ctx::cancel);
    }

    // --- BookingContext ---

    @Test
    void contextResolvesCorrectStateOnCreation() {
        BookingContext ctx = contextWithStatus("PENDING");
        assertEquals("PENDING", ctx.getCurrentState().getStateName());
    }

    @Test
    void contextThrowsForUnknownStatus() {
        Booking booking = new Booking();
        booking.setStatus("INVALID");
        assertThrows(IllegalArgumentException.class, () -> new BookingContext(booking));
    }

    @Test
    void stateNameMatchesForAllStates() {
        assertEquals("PENDING", new PendingState().getStateName());
        assertEquals("CONFIRMED", new ConfirmedState().getStateName());
        assertEquals("FINISHED", new FinishedState().getStateName());
        assertEquals("CANCELLED", new CancelledState().getStateName());
    }

    @Test
    void fullLifecyclePendingToFinished() {
        BookingContext ctx = contextWithStatus("PENDING");
        ctx.confirm();
        assertEquals("CONFIRMED", ctx.getBooking().getStatus());
        ctx.finish();
        assertEquals("FINISHED", ctx.getBooking().getStatus());
    }

    @Test
    void fullLifecyclePendingToCancelled() {
        BookingContext ctx = contextWithStatus("PENDING");
        ctx.cancel();
        assertEquals("CANCELLED", ctx.getBooking().getStatus());
    }
}
