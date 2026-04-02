package com.example.backend.domain.service.pricing;

import com.example.backend.domain.model.Car;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Standard pricing: duration * hourly rate.
 */
public class StandardPricingStrategy implements PricingStrategy {
    @Override
    public double calculatePrice(Car car, int durationHours, LocalDate date, LocalTime startTime) {
        return durationHours * car.getHourlyRate();
    }
}
