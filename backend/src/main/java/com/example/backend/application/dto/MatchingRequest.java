package com.example.backend.application.dto;

public class MatchingRequest {
  private Long learnerId;
  private String date;
  private String startTime;
  private int duration;
  private double learnerLat;
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
