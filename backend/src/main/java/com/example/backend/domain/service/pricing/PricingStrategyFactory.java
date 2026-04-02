package com.example.backend.domain.service.pricing;

import org.springframework.stereotype.Component;

/**
 * Resolves the appropriate PricingStrategy based on a strategy name.
 * Acts as a simple factory to decouple strategy selection from business logic.
 */
@Component
public class PricingStrategyFactory {

    private final PricingStrategy standardStrategy = new StandardPricingStrategy();
    private final PricingStrategy weekendStrategy = new WeekendPricingStrategy();
    private final PricingStrategy peakHourStrategy = new PeakHourPricingStrategy();

    public PricingStrategy getStrategy(String strategyName) {
        if (strategyName == null) {
            return standardStrategy;
        }
        return switch (strategyName.toUpperCase()) {
            case "WEEKEND" -> weekendStrategy;
            case "PEAK_HOUR" -> peakHourStrategy;
            default -> standardStrategy;
        };
    }
}
