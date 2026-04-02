package com.example.backend.domain.service.pricing;

import com.example.backend.domain.model.Car;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Strategy interface for calculating rental pricing.
 * Each implementation encapsulates a different pricing algorithm.
 */
public interface PricingStrategy {
    double calculatePrice(Car car, int durationHours, LocalDate date, LocalTime startTime);
}
