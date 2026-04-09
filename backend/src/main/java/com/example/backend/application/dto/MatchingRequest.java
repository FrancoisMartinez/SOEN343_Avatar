package com.example.backend.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class MatchingRequest {
  @NotNull(message = "learnerId is required")
  private Long learnerId;

  @NotBlank(message = "date is required in YYYY-MM-DD format")
  private String date;

  @NotBlank(message = "startTime is required in HH:mm format")
  private String startTime;

  @Positive(message = "duration must be between 1 and 12 hours")
  private int duration;

  @Min(value = -90, message = "latitude must be between -90 and 90")
  @Max(value = 90, message = "latitude must be between -90 and 90")
  private double learnerLat;

  @Min(value = -180, message = "longitude must be between -180 and 180")
  @Max(value = 180, message = "longitude must be between -180 and 180")
  private double learnerLng;

  private String transmissionPreference;

  public MatchingRequest() {}

  public MatchingRequest(
      Long learnerId,
      String date,
      String startTime,
      int duration,
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

  public int getDuration() {
    return duration;
  }

  public void setDuration(int duration) {
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
}
