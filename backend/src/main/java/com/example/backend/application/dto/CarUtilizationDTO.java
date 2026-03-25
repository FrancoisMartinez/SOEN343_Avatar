package com.example.backend.application.dto;

public class CarUtilizationDTO {
    private Long carId;
    private String makeModel;
    private int totalBookings;
    private long totalBookingHours;
    private double utilizationPercentage;
    private double totalRevenue;

    public CarUtilizationDTO() {
    }

    public CarUtilizationDTO(Long carId, String makeModel, int totalBookings, 
                             long totalBookingHours, double utilizationPercentage, 
                             double totalRevenue) {
        this.carId = carId;
        this.makeModel = makeModel;
        this.totalBookings = totalBookings;
        this.totalBookingHours = totalBookingHours;
        this.utilizationPercentage = utilizationPercentage;
        this.totalRevenue = totalRevenue;
    }

    // --- Getters & Setters ---

    public Long getCarId() {
        return carId;
    }

    public void setCarId(Long carId) {
        this.carId = carId;
    }

    public String getMakeModel() {
        return makeModel;
    }

    public void setMakeModel(String makeModel) {
        this.makeModel = makeModel;
    }

    public int getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(int totalBookings) {
        this.totalBookings = totalBookings;
    }

    public long getTotalBookingHours() {
        return totalBookingHours;
    }

    public void setTotalBookingHours(long totalBookingHours) {
        this.totalBookingHours = totalBookingHours;
    }

    public double getUtilizationPercentage() {
        return utilizationPercentage;
    }

    public void setUtilizationPercentage(double utilizationPercentage) {
        this.utilizationPercentage = utilizationPercentage;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
