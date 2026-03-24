package com.example.backend.application.dto;

import java.util.List;

public class WeeklyAvailabilityRequest {
    private List<AvailabilitySlotRequest> slots;

    public List<AvailabilitySlotRequest> getSlots() {
        return slots;
    }

    public void setSlots(List<AvailabilitySlotRequest> slots) {
        this.slots = slots;
    }
}
