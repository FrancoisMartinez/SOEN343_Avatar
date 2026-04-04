package com.example.backend.application.dto;

/**
 * Request payload for creating a new booking.
 * The frontend sends: carId, userId, date, startTime, and duration.
 * totalCost is calculated server-side from duration * hourlyRate.
 */
public class BookingRequest {
    private Long carId;
    private Long userId;
    private String date;       // ISO date: "2026-04-01"
    private String startTime;  // "HH:mm" format: "09:00"
    private int duration;      // Hours (1-12)
    private String pricingStrategy; // Optional: "STANDARD", "WEEKEND", "PEAK_HOUR"

    public Long getCarId() { return carId; }
    public void setCarId(Long carId) { this.carId = carId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public String getPricingStrategy() { return pricingStrategy; }
    public void setPricingStrategy(String pricingStrategy) { this.pricingStrategy = pricingStrategy; }
}
