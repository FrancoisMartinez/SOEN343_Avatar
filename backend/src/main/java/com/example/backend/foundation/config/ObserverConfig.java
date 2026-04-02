package com.example.backend.foundation.config;

import com.example.backend.domain.service.observer.AnalyticsObserver;
import com.example.backend.domain.service.observer.BookingEventPublisher;
import com.example.backend.domain.service.observer.LearnerNotificationObserver;
import com.example.backend.domain.service.observer.ProviderNotificationObserver;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

/**
 * Registers all BookingObserver implementations with the BookingEventPublisher.
 */
@Configuration
public class ObserverConfig {

    private final BookingEventPublisher publisher;
    private final LearnerNotificationObserver learnerObserver;
    private final ProviderNotificationObserver providerObserver;
    private final AnalyticsObserver analyticsObserver;

    public ObserverConfig(BookingEventPublisher publisher,
                          LearnerNotificationObserver learnerObserver,
                          ProviderNotificationObserver providerObserver,
                          AnalyticsObserver analyticsObserver) {
        this.publisher = publisher;
        this.learnerObserver = learnerObserver;
        this.providerObserver = providerObserver;
        this.analyticsObserver = analyticsObserver;
    }

    @PostConstruct
    public void registerObservers() {
        publisher.subscribe(learnerObserver);
        publisher.subscribe(providerObserver);
        publisher.subscribe(analyticsObserver);
    }
}
