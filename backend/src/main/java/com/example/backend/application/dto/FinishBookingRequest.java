package com.example.backend.application.dto;

/**
 * Request payload for finishing a booking with a new car location.
 */
public class FinishBookingRequest {
    private Double latitude;
    private Double longitude;
    private String location;
    private Integer rating;

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
}
