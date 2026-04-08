package com.example.backend.application.dto;

public class MatchResult {
  private Long carId;
  private String makeModel;
  private String transmissionType;
  private String location;
  private Double latitude;
  private Double longitude;
  private double hourlyRate;
  private double totalCost;
  private double proximityScore;
  private double budgetScore;
  private double transmissionScore;
  private double compositeScore;
  private double distanceKm;

  public MatchResult() {}

  public MatchResult(
      Long carId,
      String makeModel,
      String transmissionType,
      String location,
      Double latitude,
      Double longitude,
      double hourlyRate,
      double totalCost,
      double proximityScore,
      double budgetScore,
      double transmissionScore,
      double compositeScore,
      double distanceKm) {
    this.carId = carId;
    this.makeModel = makeModel;
    this.transmissionType = transmissionType;
    this.location = location;
    this.latitude = latitude;
    this.longitude = longitude;
    this.hourlyRate = hourlyRate;
    this.totalCost = totalCost;
    this.proximityScore = proximityScore;
    this.budgetScore = budgetScore;
    this.transmissionScore = transmissionScore;
    this.compositeScore = compositeScore;
    this.distanceKm = distanceKm;
  }

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

  public double getHourlyRate() {
    return hourlyRate;
  }

  public void setHourlyRate(double hourlyRate) {
    this.hourlyRate = hourlyRate;
  }

  public double getTotalCost() {
    return totalCost;
  }

  public void setTotalCost(double totalCost) {
    this.totalCost = totalCost;
  }

  public double getProximityScore() {
    return proximityScore;
  }

  public void setProximityScore(double proximityScore) {
    this.proximityScore = proximityScore;
  }

  public double getBudgetScore() {
    return budgetScore;
  }

  public void setBudgetScore(double budgetScore) {
    this.budgetScore = budgetScore;
  }

  public double getTransmissionScore() {
    return transmissionScore;
  }

  public void setTransmissionScore(double transmissionScore) {
    this.transmissionScore = transmissionScore;
  }

  public double getCompositeScore() {
    return compositeScore;
  }

  public void setCompositeScore(double compositeScore) {
    this.compositeScore = compositeScore;
  }

  public double getDistanceKm() {
    return distanceKm;
  }

  public void setDistanceKm(double distanceKm) {
    this.distanceKm = distanceKm;
  }
}
