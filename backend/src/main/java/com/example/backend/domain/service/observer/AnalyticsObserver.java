package com.example.backend.domain.service.observer;

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
        switch (event.getType()) {
            case CREATED -> log.info("[ANALYTICS] Booking CREATED: carId={}, learnerId={}, cost={}",
                    event.getBooking().getCar().getId(),
                    event.getBooking().getLearner().getId(),
                    event.getBooking().getTotalCost());
            case FINISHED -> log.info("[ANALYTICS] Booking FINISHED: bookingId={}, revenue={}",
                    event.getBooking().getId(),
                    event.getBooking().getTotalCost());
            case CANCELLED -> log.info("[ANALYTICS] Booking CANCELLED: bookingId={}",
                    event.getBooking().getId());
        }
    }
}
