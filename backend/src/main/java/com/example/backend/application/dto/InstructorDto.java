package com.example.backend.application.dto;

public class InstructorDto {
    private Long id;
    private String fullName;
    private Double hourlyRate;
    private Double rating;
    private Double latitude;
    private Double longitude;

    public InstructorDto() {
    }

    public InstructorDto(Long id, String fullName, Double hourlyRate, Double rating, Double latitude, Double longitude) {
        this.id = id;
        this.fullName = fullName;
        this.hourlyRate = hourlyRate;
        this.rating = rating;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Double getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(Double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
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
}
