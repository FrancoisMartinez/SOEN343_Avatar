package com.example.backend.domain.service.observer;

import com.example.backend.domain.model.Booking;

/**
 * Represents a booking lifecycle event that observers can react to.
 */
public class BookingEvent {

    public enum EventType {
        CREATED,
        FINISHED,
        CANCELLED
    }

    private final EventType type;
    private final Booking booking;

    public BookingEvent(EventType type, Booking booking) {
        this.type = type;
        this.booking = booking;
    }

    public EventType getType() { return type; }
    public Booking getBooking() { return booking; }
}
