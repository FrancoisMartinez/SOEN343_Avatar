package com.example.backend.domain.service.pricing;

import com.example.backend.domain.model.Car;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PricingStrategyTest {

    private Car carWithRate(double rate) {
        Car car = new Car();
        car.setHourlyRate(rate);
        return car;
    }

    // --- StandardPricingStrategy ---

    @Test
    void standardPricingReturnsBasePrice() {
        StandardPricingStrategy strategy = new StandardPricingStrategy();
        double price = strategy.calculatePrice(carWithRate(50.0), 3, LocalDate.of(2026, 4, 6), LocalTime.of(10, 0));
        assertEquals(150.0, price);
    }

    @Test
    void standardPricingSingleHour() {
        StandardPricingStrategy strategy = new StandardPricingStrategy();
        double price = strategy.calculatePrice(carWithRate(25.0), 1, LocalDate.of(2026, 4, 6), LocalTime.of(14, 0));
        assertEquals(25.0, price);
    }

    // --- WeekendPricingStrategy ---

    @Test
    void weekendPricingAppliesSurchargeOnSaturday() {
        WeekendPricingStrategy strategy = new WeekendPricingStrategy();
        // 2026-04-11 is a Saturday
        double price = strategy.calculatePrice(carWithRate(100.0), 2, LocalDate.of(2026, 4, 11), LocalTime.of(10, 0));
        assertEquals(250.0, price); // 200 * 1.25 = 250
    }

    @Test
    void weekendPricingAppliesSurchargeOnSunday() {
        WeekendPricingStrategy strategy = new WeekendPricingStrategy();
        // 2026-04-12 is a Sunday
        double price = strategy.calculatePrice(carWithRate(80.0), 2, LocalDate.of(2026, 4, 12), LocalTime.of(10, 0));
        assertEquals(200.0, price); // 160 * 1.25 = 200
    }

    @Test
    void weekendPricingNoSurchargeOnWeekday() {
        WeekendPricingStrategy strategy = new WeekendPricingStrategy();
        // 2026-04-06 is a Monday
        double price = strategy.calculatePrice(carWithRate(100.0), 2, LocalDate.of(2026, 4, 6), LocalTime.of(10, 0));
        assertEquals(200.0, price); // no surcharge
    }

    // --- PeakHourPricingStrategy ---

    @Test
    void peakHourPricingAppliesSurchargeDuringMorningPeak() {
        PeakHourPricingStrategy strategy = new PeakHourPricingStrategy();
        double price = strategy.calculatePrice(carWithRate(100.0), 2, LocalDate.of(2026, 4, 6), LocalTime.of(7, 0));
        assertEquals(300.0, price); // 200 * 1.50 = 300
    }

    @Test
    void peakHourPricingAppliesSurchargeDuringEveningPeak() {
        PeakHourPricingStrategy strategy = new PeakHourPricingStrategy();
        double price = strategy.calculatePrice(carWithRate(100.0), 2, LocalDate.of(2026, 4, 6), LocalTime.of(17, 0));
        assertEquals(300.0, price); // 200 * 1.50 = 300
    }

    @Test
    void peakHourPricingNoSurchargeOffPeak() {
        PeakHourPricingStrategy strategy = new PeakHourPricingStrategy();
        double price = strategy.calculatePrice(carWithRate(100.0), 2, LocalDate.of(2026, 4, 6), LocalTime.of(10, 0));
        assertEquals(200.0, price); // no surcharge
    }

    @Test
    void peakHourPricingNoSurchargeAtBoundary() {
        PeakHourPricingStrategy strategy = new PeakHourPricingStrategy();
        // 9:00 is NOT peak (peak is 7:00-9:00 exclusive of 9:00)
        double price = strategy.calculatePrice(carWithRate(100.0), 1, LocalDate.of(2026, 4, 6), LocalTime.of(9, 0));
        assertEquals(100.0, price);
    }

    @Test
    void peakHourPricingAtEveningBoundary() {
        PeakHourPricingStrategy strategy = new PeakHourPricingStrategy();
        // 18:00 is NOT peak (peak is 16:00-18:00 exclusive of 18:00)
        double price = strategy.calculatePrice(carWithRate(100.0), 1, LocalDate.of(2026, 4, 6), LocalTime.of(18, 0));
        assertEquals(100.0, price);
    }

    // --- PricingStrategyFactory ---

    @Test
    void factoryReturnsStandardByDefault() {
        PricingStrategyFactory factory = new PricingStrategyFactory();
        PricingStrategy strategy = factory.getStrategy(null);
        double price = strategy.calculatePrice(carWithRate(100.0), 1, LocalDate.of(2026, 4, 6), LocalTime.of(10, 0));
        assertEquals(100.0, price);
    }

    @Test
    void factoryReturnsWeekendStrategy() {
        PricingStrategyFactory factory = new PricingStrategyFactory();
        PricingStrategy strategy = factory.getStrategy("WEEKEND");
        // Saturday
        double price = strategy.calculatePrice(carWithRate(100.0), 1, LocalDate.of(2026, 4, 11), LocalTime.of(10, 0));
        assertEquals(125.0, price);
    }

    @Test
    void factoryReturnsPeakHourStrategy() {
        PricingStrategyFactory factory = new PricingStrategyFactory();
        PricingStrategy strategy = factory.getStrategy("PEAK_HOUR");
        double price = strategy.calculatePrice(carWithRate(100.0), 1, LocalDate.of(2026, 4, 6), LocalTime.of(8, 0));
        assertEquals(150.0, price);
    }

    @Test
    void factoryReturnsStandardForUnknown() {
        PricingStrategyFactory factory = new PricingStrategyFactory();
        PricingStrategy strategy = factory.getStrategy("UNKNOWN");
        double price = strategy.calculatePrice(carWithRate(100.0), 1, LocalDate.of(2026, 4, 6), LocalTime.of(10, 0));
        assertEquals(100.0, price);
    }

    @Test
    void factoryHandlesCaseInsensitiveInput() {
        PricingStrategyFactory factory = new PricingStrategyFactory();
        PricingStrategy strategy = factory.getStrategy("weekend");
        // Saturday
        double price = strategy.calculatePrice(carWithRate(100.0), 1, LocalDate.of(2026, 4, 11), LocalTime.of(10, 0));
        assertEquals(125.0, price);
    }
}
