package com.example.backend.foundation.config;

import com.example.backend.domain.service.observer.AnalyticsObserver;
import com.example.backend.domain.service.observer.BookingEventPublisher;
import com.example.backend.domain.service.observer.LearnerNotificationObserver;
import com.example.backend.domain.service.observer.ProviderNotificationObserver;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class ObserverConfigTest {

    @Test
    void registerObserversSubscribesAllObservers() {
        BookingEventPublisher publisher = mock(BookingEventPublisher.class);
        LearnerNotificationObserver learnerObs = new LearnerNotificationObserver();
        ProviderNotificationObserver providerObs = new ProviderNotificationObserver();
        AnalyticsObserver analyticsObs = new AnalyticsObserver();

        ObserverConfig config = new ObserverConfig(publisher, learnerObs, providerObs, analyticsObs);
        config.registerObservers();

        verify(publisher).subscribe(learnerObs);
        verify(publisher).subscribe(providerObs);
        verify(publisher).subscribe(analyticsObs);
    }
}
