package com.example.backend.domain.service.observer;

import com.example.backend.domain.model.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Observer that tracks booking events for analytics purposes.
 * Logs metrics that can feed into dashboards or reporting systems.
 */
@Component
public class AnalyticsObserver implements BookingObserver {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsObserver.class);

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        String entityType = booking.getCar() != null ? "CAR" : "INSTRUCTOR";
        Long entityId = booking.getCar() != null ? booking.getCar().getId() : booking.getInstructor().getId();

        switch (event.getType()) {
            case CREATED -> log.info("[ANALYTICS] Booking CREATED: type={}, id={}, learnerId={}, cost={}",
                    entityType,
                    entityId,
                    booking.getLearner().getId(),
                    booking.getTotalCost());
            case FINISHED -> log.info("[ANALYTICS] Booking FINISHED: bookingId={}, revenue={}",
                    booking.getId(),
                    booking.getTotalCost());
            case CANCELLED -> log.info("[ANALYTICS] Booking CANCELLED: bookingId={}",
                    booking.getId());
        }
    }
}
