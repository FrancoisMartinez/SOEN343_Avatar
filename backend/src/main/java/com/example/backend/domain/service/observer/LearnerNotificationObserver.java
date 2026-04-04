package com.example.backend.domain.service.observer;

import com.example.backend.domain.model.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Observer that sends notifications to the learner when booking events occur.
 * Currently logs notifications; can be extended to send emails or push notifications.
 */
@Component
public class LearnerNotificationObserver implements BookingObserver {

    private static final Logger log = LoggerFactory.getLogger(LearnerNotificationObserver.class);

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        String learnerName = booking.getLearner().getFullName();
        String carName = booking.getCar().getMakeModel();

        switch (event.getType()) {
            case CREATED -> log.info("[NOTIFICATION] Learner '{}': Your booking for {} on {} at {} has been confirmed. Total: ${}",
                    learnerName, carName, booking.getDate(), booking.getStartTime(), booking.getTotalCost());
            case FINISHED -> log.info("[NOTIFICATION] Learner '{}': Your booking for {} has been completed. ${} deducted from your balance.",
                    learnerName, carName, booking.getTotalCost());
            case CANCELLED -> log.info("[NOTIFICATION] Learner '{}': Your booking for {} on {} has been cancelled.",
                    learnerName, carName, booking.getDate());
        }
    }
}
