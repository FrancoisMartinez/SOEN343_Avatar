package com.example.backend.application.dto;

import java.util.List;

public class AnalyticsResponseDTO {
    private List<CarUtilizationDTO> carUtilizations;
    private long timestamp;

    public AnalyticsResponseDTO() {
    }

    public AnalyticsResponseDTO(List<CarUtilizationDTO> carUtilizations, long timestamp) {
        this.carUtilizations = carUtilizations;
        this.timestamp = timestamp;
    }

    // --- Getters & Setters ---

    public List<CarUtilizationDTO> getCarUtilizations() {
        return carUtilizations;
    }

    public void setCarUtilizations(List<CarUtilizationDTO> carUtilizations) {
        this.carUtilizations = carUtilizations;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
