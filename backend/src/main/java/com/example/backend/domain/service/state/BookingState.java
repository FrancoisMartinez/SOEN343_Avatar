package com.example.backend.domain.service.state;

import com.example.backend.domain.model.Booking;

/**
 * State interface for the Booking lifecycle.
 * Each concrete state defines which transitions are valid and how they behave.
 */
public interface BookingState {
    String getStateName();
    void finish(BookingContext context);
    void cancel(BookingContext context);
}
