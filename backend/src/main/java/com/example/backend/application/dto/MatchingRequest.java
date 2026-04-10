package com.example.backend.application.dto;

public class MatchingRequest {
  private Long learnerId;
  private String date;
  private String startTime;
  private Integer duration;
  private double learnerLat;
  private double learnerLng;
  private String transmissionPreference;
  private Double radius;
  private Double minPrice;
  private Double maxPrice;

  public MatchingRequest() {}

  public MatchingRequest(
      Long learnerId,
      String date,
      String startTime,
      Integer duration,
      double learnerLat,
      double learnerLng,
      String transmissionPreference) {
    this.learnerId = learnerId;
    this.date = date;
    this.startTime = startTime;
    this.duration = duration;
    this.learnerLat = learnerLat;
    this.learnerLng = learnerLng;
    this.transmissionPreference = transmissionPreference;
  }

  public Long getLearnerId() {
    return learnerId;
  }

  public void setLearnerId(Long learnerId) {
    this.learnerId = learnerId;
  }

  public String getDate() {
    return date;
  }

  public void setDate(String date) {
    this.date = date;
  }

  public String getStartTime() {
    return startTime;
  }

  public void setStartTime(String startTime) {
    this.startTime = startTime;
  }

  public Integer getDuration() {
    return duration;
  }

  public void setDuration(Integer duration) {
    this.duration = duration;
  }

  public double getLearnerLat() {
    return learnerLat;
  }

  public void setLearnerLat(double learnerLat) {
    this.learnerLat = learnerLat;
  }

  public double getLearnerLng() {
    return learnerLng;
  }

  public void setLearnerLng(double learnerLng) {
    this.learnerLng = learnerLng;
  }

  public String getTransmissionPreference() {
    return transmissionPreference;
  }

  public void setTransmissionPreference(String transmissionPreference) {
    this.transmissionPreference = transmissionPreference;
  }

  public Double getRadius() {
    return radius;
  }

  public void setRadius(Double radius) {
    this.radius = radius;
  }

  public Double getMinPrice() {
    return minPrice;
  }

  public void setMinPrice(Double minPrice) {
    this.minPrice = minPrice;
  }

  public Double getMaxPrice() {
    return maxPrice;
  }

  public void setMaxPrice(Double maxPrice) {
    this.maxPrice = maxPrice;
  }
}