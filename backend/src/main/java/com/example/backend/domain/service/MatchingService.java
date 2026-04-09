package com.example.backend.domain.service;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.InstructorDto;
import com.example.backend.application.dto.MatchingRequest;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.model.Learner;
import com.example.backend.infrastructure.repository.LearnerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class MatchingService {

  private final CarService carService;
  private final InstructorService instructorService;
  private final LearnerRepository learnerRepository;

  public MatchingService(CarService carService, InstructorService instructorService, LearnerRepository learnerRepository) {
    this.carService = carService;
    this.instructorService = instructorService;
    this.learnerRepository = learnerRepository;
  }

  /**
   * Auto-match: finds and ranks available car+instructor pairs for a learner's request.
   */
  public List<MatchResult> autoMatch(MatchingRequest request) {
    if (request.getLearnerId() == null) {
      throw new IllegalArgumentException("learnerId is required");
    }
    if (request.getLearnerLat() < -90 || request.getLearnerLat() > 90) {
      throw new IllegalArgumentException("latitude must be between -90 and 90");
    }
    if (request.getLearnerLng() < -180 || request.getLearnerLng() > 180) {
      throw new IllegalArgumentException("longitude must be between -180 and 180");
    }

    Learner learner = learnerRepository.findById(request.getLearnerId())
        .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

    String dayOfWeek = null;
    Integer startMinute = null;
    Integer endMinute = null;

    if (request.getDate() != null && !request.getDate().isBlank()) {
      dayOfWeek = dayOfWeekFrom(request.getDate());
    }

    if (request.getStartTime() != null && !request.getStartTime().isBlank()) {
      startMinute = startMinuteFrom(request.getStartTime());
      int duration = (request.getDuration() != null && request.getDuration() > 0) ? request.getDuration() : 1;
      endMinute = endMinuteFrom(request.getStartTime(), duration);
    }

    List<CarDto> carCandidates = carService.searchCars(
        request.getTransmissionPreference(),
        request.getMinPrice(),
        request.getMaxPrice(),
        true, // Available cars
        request.getLearnerLat(),
        request.getLearnerLng(),
        request.getRadius(),
        dayOfWeek,
        startMinute,
        endMinute
    );

    List<InstructorDto> instructorCandidates = instructorService.searchInstructors(
        request.getLearnerLat(),
        request.getLearnerLng(),
        request.getRadius(),
        request.getMinPrice(),
        request.getMaxPrice(),
        dayOfWeek,
        startMinute,
        endMinute
    );

    List<MatchResult> allPairs = new ArrayList<>();
    
    // Default duration to 1 hour if not specified to calculate scoring costs reasonably.
    int effectiveDuration = (request.getDuration() != null && request.getDuration() > 0) ? request.getDuration() : 1;

    for (CarDto car : carCandidates) {
      for (InstructorDto instructor : instructorCandidates) {
        MatchResult result = scoreAndBuild(car, instructor, request, learner.getBalance(), effectiveDuration);
        allPairs.add(result);
      }
    }

    return allPairs.stream()
        .sorted((a, b) -> Double.compare(b.getCompositeScore(), a.getCompositeScore()))
        .limit(20) // Only return the top 20 matches to avoid overwhelming frontend
        .toList();
  }

  private MatchResult scoreAndBuild(CarDto car, InstructorDto instructor, MatchingRequest request, double learnerBalance, int duration) {
    double distanceLearnerToCar = haversineKm(
        request.getLearnerLat(),
        request.getLearnerLng(),
        car.getLatitude(),
        car.getLongitude()
    );

    double distanceLearnerToInstructor = haversineKm(
        request.getLearnerLat(),
        request.getLearnerLng(),
        instructor.getLatitude(),
        instructor.getLongitude()
    );

    // Sum of distances (Learner to Car and Learner to Instructor)
    double totalDistanceKm = distanceLearnerToCar + distanceLearnerToInstructor;

    double totalCost = duration * (car.getHourlyRate() + instructor.getHourlyRate());

    double proximityScore = computeProximityScore(totalDistanceKm);
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
        instructor.getId(),
        instructor.getFullName(),
        instructor.getHourlyRate(),
        instructor.getRating(),
        instructor.getLatitude(),
        instructor.getLongitude(),
        totalCost,
        proximityScore,
        budgetScore,
        transmissionScore,
        compositeScore,
        totalDistanceKm
    );
  }

  public double computeProximityScore(double distanceKm) {
    // Distance could be up to 100km max theoretically (50km max for each)
    final double MAX_RADIUS = 100.0;
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
    try {
      LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
      return localDate.getDayOfWeek().name();
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid date format. Use YYYY-MM-DD format");
    }
  }

  private int startMinuteFrom(String time) {
    try {
      String[] parts = time.split(":");
      if (parts.length < 2) {
        throw new IllegalArgumentException("Invalid time format");
      }
      int hours = Integer.parseInt(parts[0]);
      int minutes = Integer.parseInt(parts[1]);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new IllegalArgumentException("Invalid time values");
      }
      return hours * 60 + minutes;
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid time format. Use HH:mm format");
    }
  }

  private int endMinuteFrom(String time, int durationHours) {
    int startMinute = startMinuteFrom(time);
    return startMinute + (durationHours * 60);
  }
}