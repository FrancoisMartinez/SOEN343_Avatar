package com.example.backend.application.dto;

public class CarDto {
    private Long id;
    private String makeModel;
    private String transmissionType;
    private String location;
    private Double latitude;
    private Double longitude;
    private boolean available;
    private double hourlyRate;

    public CarDto() {
    }

    public CarDto(Long id, String makeModel, String transmissionType, String location,
            Double latitude, Double longitude, boolean available, double hourlyRate) {
        this.id = id;
        this.makeModel = makeModel;
        this.transmissionType = transmissionType;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.available = available;
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public double getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }
}
