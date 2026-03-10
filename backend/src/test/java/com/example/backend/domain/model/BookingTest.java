package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BookingTest {

    @Test
    void testCreation() {
        Booking booking = new Booking();
        assertNotNull(booking);
    }
}
