package com.example.backend.domain.service.pricing;

import com.example.backend.domain.model.Car;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Peak-hour pricing: applies a 50% surcharge for bookings starting
 * during peak hours (7:00–9:00 and 16:00–18:00).
 */
public class PeakHourPricingStrategy implements PricingStrategy {

    private static final double PEAK_SURCHARGE = 1.50;
    private static final LocalTime MORNING_PEAK_START = LocalTime.of(7, 0);
    private static final LocalTime MORNING_PEAK_END = LocalTime.of(9, 0);
    private static final LocalTime EVENING_PEAK_START = LocalTime.of(16, 0);
    private static final LocalTime EVENING_PEAK_END = LocalTime.of(18, 0);

    @Override
    public double calculatePrice(Car car, int durationHours, LocalDate date, LocalTime startTime) {
        double basePrice = durationHours * car.getHourlyRate();
        if (isDuringPeak(startTime)) {
            return Math.round(basePrice * PEAK_SURCHARGE * 100.0) / 100.0;
        }
        return basePrice;
    }

    private boolean isDuringPeak(LocalTime time) {
        boolean morningPeak = !time.isBefore(MORNING_PEAK_START) && time.isBefore(MORNING_PEAK_END);
        boolean eveningPeak = !time.isBefore(EVENING_PEAK_START) && time.isBefore(EVENING_PEAK_END);
        return morningPeak || eveningPeak;
    }
}
