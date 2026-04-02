package com.example.backend.domain.service.observer;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Central publisher that manages BookingObserver subscriptions and
 * dispatches BookingEvents to all registered observers.
 */
@Component
public class BookingEventPublisher {

    private final List<BookingObserver> observers = new ArrayList<>();

    public void subscribe(BookingObserver observer) {
        observers.add(observer);
    }

    public void unsubscribe(BookingObserver observer) {
        observers.remove(observer);
    }

    public void publish(BookingEvent event) {
        for (BookingObserver observer : observers) {
            observer.onBookingEvent(event);
        }
    }
}
