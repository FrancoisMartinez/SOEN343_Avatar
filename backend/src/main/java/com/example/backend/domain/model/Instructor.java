package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Instructor extends User {
    private int yearsLicensed;
    private double travelRadius;
    private double rating;
    private int ratingCount;
    private double hourlyRate;
    private Double latitude;
    private Double longitude;

    @OneToMany(mappedBy = "instructor")
    private List<Booking> bookings;

    @OneToMany(mappedBy = "instructor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AvailabilitySlot> availabilitySlots;

    @OneToOne
    private TransitRoute transitRoute;

    public int getYearsLicensed() { return yearsLicensed; }
    public void setYearsLicensed(int yearsLicensed) { this.yearsLicensed = yearsLicensed; }

    public double getTravelRadius() { return travelRadius; }
    public void setTravelRadius(double travelRadius) { this.travelRadius = travelRadius; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }

    public void addRating(int newRating) {
        double totalScore = this.rating * this.ratingCount;
        this.ratingCount++;
        this.rating = (totalScore + newRating) / this.ratingCount;
    }

    public double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(double hourlyRate) { this.hourlyRate = hourlyRate; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public List<Booking> getBookings() { return bookings; }
    public void setBookings(List<Booking> bookings) { this.bookings = bookings; }

    public List<AvailabilitySlot> getAvailabilitySlots() { return availabilitySlots; }
    public void setAvailabilitySlots(List<AvailabilitySlot> availabilitySlots) { this.availabilitySlots = availabilitySlots; }

    public TransitRoute getTransitRoute() { return transitRoute; }
    public void setTransitRoute(TransitRoute transitRoute) { this.transitRoute = transitRoute; }
}
