package com.example.backend.application.dto;

public class CarDto {
    private Long id;
    private String makeModel;
    private String transmissionType;
    private String location;
    private boolean available;
    private String accessibilityFeatures;
    private double hourlyRate;

    public CarDto() {}

    public CarDto(Long id, String makeModel, String transmissionType, String location,
                  boolean available, String accessibilityFeatures, double hourlyRate) {
        this.id = id;
        this.makeModel = makeModel;
        this.transmissionType = transmissionType;
        this.location = location;
        this.available = available;
        this.accessibilityFeatures = accessibilityFeatures;
        this.hourlyRate = hourlyRate;
    }

    // --- Getters & Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMakeModel() {
        return makeModel;
    }

    public void setMakeModel(String makeModel) {
        this.makeModel = makeModel;
    }

    public String getTransmissionType() {
        return transmissionType;
    }

    public void setTransmissionType(String transmissionType) {
        this.transmissionType = transmissionType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public String getAccessibilityFeatures() {
        return accessibilityFeatures;
    }

    public void setAccessibilityFeatures(String accessibilityFeatures) {
        this.accessibilityFeatures = accessibilityFeatures;
    }

    public double getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }
}
