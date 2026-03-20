package com.example.backend.application.dto;

import java.util.List;

public class WeeklyAvailabilityResponse {
    private Long carId;
    private boolean available;
    private List<AvailabilitySlotDto> slots;

    public WeeklyAvailabilityResponse() {
    }

    public WeeklyAvailabilityResponse(Long carId, boolean available, List<AvailabilitySlotDto> slots) {
        this.carId = carId;
        this.available = available;
        this.slots = slots;
    }

    public Long getCarId() {
        return carId;
    }

    public void setCarId(Long carId) {
        this.carId = carId;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public List<AvailabilitySlotDto> getSlots() {
        return slots;
    }

    public void setSlots(List<AvailabilitySlotDto> slots) {
        this.slots = slots;
    }
}
