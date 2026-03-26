package com.example.backend.domain.service.observer;

import com.example.backend.domain.model.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Observer that notifies car providers about booking events on their vehicles.
 * Currently logs notifications; can be extended to send emails or dashboard alerts.
 */
@Component
public class ProviderNotificationObserver implements BookingObserver {

    private static final Logger log = LoggerFactory.getLogger(ProviderNotificationObserver.class);

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        String providerContact = booking.getCar().getProvider().getContactInfo();
        String carName = booking.getCar().getMakeModel();

        switch (event.getType()) {
            case CREATED -> log.info("[NOTIFICATION] Provider '{}': New booking for {} on {} ({} hours, ${})",
                    providerContact, carName, booking.getDate(), booking.getDuration(), booking.getTotalCost());
            case FINISHED -> log.info("[NOTIFICATION] Provider '{}': Booking for {} completed. Revenue: ${}",
                    providerContact, carName, booking.getTotalCost());
            case CANCELLED -> log.info("[NOTIFICATION] Provider '{}': Booking for {} on {} was cancelled.",
                    providerContact, carName, booking.getDate());
        }
    }
}
