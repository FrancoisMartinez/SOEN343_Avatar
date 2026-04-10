package com.example.backend.domain.service.observer;

import com.example.backend.domain.model.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BookingObserverTest {

    private Booking createCarBooking() {
        Car car = new Car();
        car.setId(1L);
        car.setMakeModel("Toyota Corolla");
        CarProvider provider = new CarProvider();
        provider.setContactInfo("provider@test.com");
        car.setProvider(provider);

        Learner learner = new Learner();
        learner.setId(10L);
        learner.setFullName("John Doe");

        Booking booking = new Booking();
        booking.setId(100L);
        booking.setCar(car);
        booking.setLearner(learner);
        booking.setDate(LocalDate.of(2026, 4, 10));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(2);
        booking.setTotalCost(100.0);
        booking.setStatus("CONFIRMED");
        return booking;
    }

    private Booking createInstructorBooking() {
        Instructor instructor = new Instructor();
        instructor.setId(5L);
        instructor.setFullName("Jane Instructor");
        instructor.setEmail("jane@test.com");

        Learner learner = new Learner();
        learner.setId(10L);
        learner.setFullName("John Doe");

        Booking booking = new Booking();
        booking.setId(101L);
        booking.setInstructor(instructor);
        booking.setLearner(learner);
        booking.setDate(LocalDate.of(2026, 4, 10));
        booking.setStartTime(LocalTime.of(14, 0));
        booking.setDuration(1);
        booking.setTotalCost(50.0);
        booking.setStatus("PENDING");
        return booking;
    }

    // --- BookingEventPublisher ---

    @Test
    void publisherNotifiesAllSubscribers() {
        BookingEventPublisher publisher = new BookingEventPublisher();
        List<BookingEvent> received1 = new ArrayList<>();
        List<BookingEvent> received2 = new ArrayList<>();

        publisher.subscribe(received1::add);
        publisher.subscribe(received2::add);

        BookingEvent event = new BookingEvent(BookingEvent.EventType.CREATED, createCarBooking());
        publisher.publish(event);

        assertEquals(1, received1.size());
        assertEquals(1, received2.size());
        assertEquals(BookingEvent.EventType.CREATED, received1.get(0).getType());
    }

    @Test
    void publisherDoesNotNotifyUnsubscribed() {
        BookingEventPublisher publisher = new BookingEventPublisher();
        List<BookingEvent> received = new ArrayList<>();
        BookingObserver observer = received::add;

        publisher.subscribe(observer);
        publisher.unsubscribe(observer);

        publisher.publish(new BookingEvent(BookingEvent.EventType.CREATED, createCarBooking()));
        assertTrue(received.isEmpty());
    }

    @Test
    void publisherHandlesNoSubscribers() {
        BookingEventPublisher publisher = new BookingEventPublisher();
        // Should not throw
        assertDoesNotThrow(() ->
                publisher.publish(new BookingEvent(BookingEvent.EventType.CREATED, createCarBooking())));
    }

    // --- BookingEvent ---

    @Test
    void bookingEventHoldsTypeAndBooking() {
        Booking booking = createCarBooking();
        BookingEvent event = new BookingEvent(BookingEvent.EventType.FINISHED, booking);

        assertEquals(BookingEvent.EventType.FINISHED, event.getType());
        assertSame(booking, event.getBooking());
    }

    @Test
    void bookingEventTypesExist() {
        assertEquals(3, BookingEvent.EventType.values().length);
        assertNotNull(BookingEvent.EventType.CREATED);
        assertNotNull(BookingEvent.EventType.FINISHED);
        assertNotNull(BookingEvent.EventType.CANCELLED);
    }

    // --- AnalyticsObserver (logs, doesn't throw) ---

    @Test
    void analyticsObserverHandlesCarBookingCreated() {
        AnalyticsObserver observer = new AnalyticsObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CREATED, createCarBooking())));
    }

    @Test
    void analyticsObserverHandlesInstructorBookingCreated() {
        AnalyticsObserver observer = new AnalyticsObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CREATED, createInstructorBooking())));
    }

    @Test
    void analyticsObserverHandlesFinished() {
        AnalyticsObserver observer = new AnalyticsObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.FINISHED, createCarBooking())));
    }

    @Test
    void analyticsObserverHandlesCancelled() {
        AnalyticsObserver observer = new AnalyticsObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CANCELLED, createCarBooking())));
    }

    // --- LearnerNotificationObserver ---

    @Test
    void learnerNotificationHandlesCarBookingCreated() {
        LearnerNotificationObserver observer = new LearnerNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CREATED, createCarBooking())));
    }

    @Test
    void learnerNotificationHandlesInstructorBookingCreated() {
        LearnerNotificationObserver observer = new LearnerNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CREATED, createInstructorBooking())));
    }

    @Test
    void learnerNotificationHandlesFinished() {
        LearnerNotificationObserver observer = new LearnerNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.FINISHED, createCarBooking())));
    }

    @Test
    void learnerNotificationHandlesCancelled() {
        LearnerNotificationObserver observer = new LearnerNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CANCELLED, createCarBooking())));
    }

    // --- ProviderNotificationObserver ---

    @Test
    void providerNotificationHandlesCarBookingCreated() {
        ProviderNotificationObserver observer = new ProviderNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CREATED, createCarBooking())));
    }

    @Test
    void providerNotificationHandlesInstructorBookingCreated() {
        ProviderNotificationObserver observer = new ProviderNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CREATED, createInstructorBooking())));
    }

    @Test
    void providerNotificationHandlesCarBookingFinished() {
        ProviderNotificationObserver observer = new ProviderNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.FINISHED, createCarBooking())));
    }

    @Test
    void providerNotificationHandlesCarBookingCancelled() {
        ProviderNotificationObserver observer = new ProviderNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CANCELLED, createCarBooking())));
    }

    @Test
    void providerNotificationHandlesInstructorBookingFinished() {
        ProviderNotificationObserver observer = new ProviderNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.FINISHED, createInstructorBooking())));
    }

    @Test
    void providerNotificationHandlesInstructorBookingCancelled() {
        ProviderNotificationObserver observer = new ProviderNotificationObserver();
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CANCELLED, createInstructorBooking())));
    }

    @Test
    void providerNotificationHandlesBookingWithNeitherCarNorInstructor() {
        Learner learner = new Learner();
        learner.setFullName("Test");
        Booking booking = new Booking();
        booking.setId(200L);
        booking.setLearner(learner);
        booking.setDate(LocalDate.of(2026, 4, 10));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setDuration(1);
        booking.setTotalCost(0.0);

        ProviderNotificationObserver observer = new ProviderNotificationObserver();
        // Should not throw even without car or instructor
        assertDoesNotThrow(() ->
                observer.onBookingEvent(new BookingEvent(BookingEvent.EventType.CREATED, booking)));
    }
}
