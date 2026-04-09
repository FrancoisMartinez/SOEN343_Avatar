package com.example.backend.domain.service;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.MatchingRequest;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.model.Instructor;
import com.example.backend.domain.model.Learner;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import com.example.backend.infrastructure.repository.InstructorRepository;
import com.example.backend.infrastructure.repository.LearnerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Stream;

@Service
public class MatchingService {

  private final CarService carService;
  private final LearnerRepository learnerRepository;
  private final InstructorRepository instructorRepository;
  private final AvailabilitySlotRepository availabilitySlotRepository;

  public MatchingService(CarService carService, LearnerRepository learnerRepository,
      InstructorRepository instructorRepository, AvailabilitySlotRepository availabilitySlotRepository) {
    this.carService = carService;
    this.learnerRepository = learnerRepository;
    this.instructorRepository = instructorRepository;
    this.availabilitySlotRepository = availabilitySlotRepository;
  }

  /**
   * Auto-match: finds and ranks available cars for a learner's request.
   */
  public List<MatchResult> autoMatch(MatchingRequest request) {
    // Validate request fields
    if (request.getLearnerId() == null) {
      throw new IllegalArgumentException("learnerId is required");
    }
    if (request.getDate() == null || request.getDate().isBlank()) {
      throw new IllegalArgumentException("date is required in YYYY-MM-DD format");
    }
    if (request.getStartTime() == null || request.getStartTime().isBlank()) {
      throw new IllegalArgumentException("startTime is required in HH:mm format");
    }
    if (request.getDuration() <= 0 || request.getDuration() > 12) {
      throw new IllegalArgumentException("duration must be between 1 and 12 hours");
    }
    if (request.getLearnerLat() < -90 || request.getLearnerLat() > 90) {
      throw new IllegalArgumentException("latitude must be between -90 and 90");
    }
    if (request.getLearnerLng() < -180 || request.getLearnerLng() > 180) {
      throw new IllegalArgumentException("longitude must be between -180 and 180");
    }

    Learner learner = learnerRepository.findById(request.getLearnerId())
        .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

    String dayOfWeek = dayOfWeekFrom(request.getDate());
    int startMinute = startMinuteFrom(request.getStartTime());
    int endMinute = endMinuteFrom(request.getStartTime(), request.getDuration());

    List<CarDto> carCandidates = carService.searchCars(
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

    List<MatchResult> carResults = carCandidates.stream()
        .map(car -> scoreAndBuildCar(car, request, learner.getBalance()))
        .toList();

    List<MatchResult> instructorResults = matchInstructors(request, learner.getBalance(), dayOfWeek, startMinute, endMinute);

    return Stream.concat(carResults.stream(), instructorResults.stream())
        .sorted((a, b) -> Double.compare(b.getCompositeScore(), a.getCompositeScore()))
        .toList();
  }

  private MatchResult scoreAndBuildCar(CarDto car, MatchingRequest request, double learnerBalance) {
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
        "CAR",
        car.getId(),
        null,
        car.getMakeModel(),
        null,
        car.getTransmissionType(),
        car.getLocation(),
        car.getLatitude(),
        car.getLongitude(),
        null,
        car.getHourlyRate(),
        totalCost,
        proximityScore,
        budgetScore,
        transmissionScore,
        compositeScore,
        distanceKm
    );
  }

  private List<MatchResult> matchInstructors(MatchingRequest request, double learnerBalance,
      String dayOfWeek, int startMinute, int endMinute) {
    return instructorRepository.findAll().stream()
        .filter(instructor -> isInstructorAvailable(instructor, dayOfWeek, startMinute, endMinute))
        .filter(instructor -> isInstructorWithinReach(instructor, request))
        .map(instructor -> scoreAndBuildInstructor(instructor, request, learnerBalance))
        .toList();
  }

  private boolean isInstructorWithinReach(Instructor instructor, MatchingRequest request) {
    if (instructor.getLatitude() == null || instructor.getLongitude() == null) {
      return false;
    }
    double distanceKm = haversineKm(
        request.getLearnerLat(),
        request.getLearnerLng(),
        instructor.getLatitude(),
        instructor.getLongitude()
    );
    return distanceKm <= instructor.getTravelRadius();
  }

  private boolean isInstructorAvailable(Instructor instructor, String dayOfWeek, int startMinute, int endMinute) {
    List<AvailabilitySlot> slots = availabilitySlotRepository.findByInstructorIdOrderByDayOfWeekAscStartMinuteAsc(instructor.getId());
    return slots.stream()
        .anyMatch(slot -> slot.getDayOfWeek().name().equals(dayOfWeek)
            && slot.isAvailable()
            && slot.getStartMinute() <= startMinute
            && slot.getEndMinute() >= endMinute);
  }

  private MatchResult scoreAndBuildInstructor(Instructor instructor, MatchingRequest request, double learnerBalance) {
    double distanceKm = haversineKm(
        request.getLearnerLat(),
        request.getLearnerLng(),
        instructor.getLatitude(),
        instructor.getLongitude()
    );

    double totalCost = request.getDuration() * instructor.getHourlyRate();

    double proximityScore = computeProximityScoreInstructor(distanceKm, instructor.getTravelRadius());
    double budgetScore = computeBudgetScore(totalCost, learnerBalance);
    double ratingScore = computeRatingScore(instructor.getRating());
    double compositeScore = computeCompositeInstructor(proximityScore, budgetScore, ratingScore);

    return new MatchResult(
        "INSTRUCTOR",
        null,
        instructor.getId(),
        null,
        instructor.getFullName(),
        null,
        null,
        instructor.getLatitude(),
        instructor.getLongitude(),
        instructor.getRating(),
        instructor.getHourlyRate(),
        totalCost,
        proximityScore,
        budgetScore,
        ratingScore,
        compositeScore,
        distanceKm
    );
  }

  private double computeProximityScoreInstructor(double distanceKm, double travelRadius) {
    return Math.max(0, 100 - (distanceKm / travelRadius) * 100);
  }

  private double computeRatingScore(double rating) {
    // Rating is 0-5, map to 0-100
    return (rating / 5.0) * 100;
  }

  private double computeCompositeInstructor(double proximity, double budget, double rating) {
    return 0.40 * proximity + 0.40 * budget + 0.20 * rating;
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
