package com.example.backend.domain.service.pricing;

import com.example.backend.domain.model.Car;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Weekend pricing: applies a 25% surcharge on Saturdays and Sundays.
 * Falls back to standard pricing on weekdays.
 */
public class WeekendPricingStrategy implements PricingStrategy {

    private static final double WEEKEND_SURCHARGE = 1.25;

    @Override
    public double calculatePrice(Car car, int durationHours, LocalDate date, LocalTime startTime) {
        double basePrice = durationHours * car.getHourlyRate();
        DayOfWeek day = date.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return Math.round(basePrice * WEEKEND_SURCHARGE * 100.0) / 100.0;
        }
        return basePrice;
    }
}
