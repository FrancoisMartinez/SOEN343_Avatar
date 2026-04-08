package com.example.backend.domain.service;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.MatchingRequest;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.model.Learner;
import com.example.backend.infrastructure.repository.LearnerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class MatchingService {

  private final CarService carService;
  private final LearnerRepository learnerRepository;

  public MatchingService(CarService carService, LearnerRepository learnerRepository) {
    this.carService = carService;
    this.learnerRepository = learnerRepository;
  }

  /**
   * Auto-match: finds and ranks available cars for a learner's request.
   */
  public List<MatchResult> autoMatch(MatchingRequest request) {
    Learner learner = learnerRepository.findById(request.getLearnerId())
        .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

    String dayOfWeek = dayOfWeekFrom(request.getDate());
    int startMinute = startMinuteFrom(request.getStartTime());
    int endMinute = endMinuteFrom(request.getStartTime(), request.getDuration());

    List<CarDto> candidates = carService.searchCars(
        request.getTransmissionPreference(),
        null,
        null,
        true,
        request.getLearnerLat(),
        request.getLearnerLng(),
        50.0,
        dayOfWeek,
        startMinute,
        endMinute
    );

    return candidates.stream()
        .map(car -> scoreAndBuild(car, request, learner.getBalance()))
        .sorted((a, b) -> Double.compare(b.getCompositeScore(), a.getCompositeScore()))
        .toList();
  }

  private MatchResult scoreAndBuild(CarDto car, MatchingRequest request, double learnerBalance) {
    double distanceKm = haversineKm(
        request.getLearnerLat(),
        request.getLearnerLng(),
        car.getLatitude(),
        car.getLongitude()
    );

    double totalCost = request.getDuration() * car.getHourlyRate();

    double proximityScore = computeProximityScore(distanceKm);
    double budgetScore = computeBudgetScore(totalCost, learnerBalance);
    double transmissionScore = computeTransmissionScore(car.getTransmissionType(),
        request.getTransmissionPreference());
    double compositeScore = computeComposite(proximityScore, budgetScore, transmissionScore);

    return new MatchResult(
        car.getId(),
        car.getMakeModel(),
        car.getTransmissionType(),
        car.getLocation(),
        car.getLatitude(),
        car.getLongitude(),
        car.getHourlyRate(),
        totalCost,
        proximityScore,
        budgetScore,
        transmissionScore,
        compositeScore,
        distanceKm
    );
  }

  public double computeProximityScore(double distanceKm) {
    final double MAX_RADIUS = 50.0;
    return Math.max(0, 100 - (distanceKm / MAX_RADIUS) * 100);
  }

  public double computeBudgetScore(double totalCost, double learnerBalance) {
    if (totalCost <= 0) return 100.0;
    if (learnerBalance <= 0) return 0.0;
    return Math.min(100.0, (learnerBalance / totalCost) * 100);
  }

  public double computeTransmissionScore(String carTransmission, String preference) {
    if (preference == null || preference.isBlank()) {
      return 75.0; // Neutral score for no preference
    }
    if (preference.equalsIgnoreCase(carTransmission)) {
      return 100.0;
    }
    return 50.0;
  }

  private double computeComposite(double proximity, double budget, double transmission) {
    return 0.40 * proximity + 0.40 * budget + 0.20 * transmission;
  }

  private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
    final int R = 6371; // Earth radius in km

    double latDistance = Math.toRadians(lat2 - lat1);
    double lonDistance = Math.toRadians(lon2 - lon1);
    double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private String dayOfWeekFrom(String date) {
    LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
    return localDate.getDayOfWeek().name();
  }

  private int startMinuteFrom(String time) {
    String[] parts = time.split(":");
    int hours = Integer.parseInt(parts[0]);
    int minutes = Integer.parseInt(parts[1]);
    return hours * 60 + minutes;
  }

  private int endMinuteFrom(String time, int durationHours) {
    int startMinute = startMinuteFrom(time);
    return startMinute + (durationHours * 60);
  }
}
