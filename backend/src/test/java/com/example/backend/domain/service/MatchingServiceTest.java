package com.example.backend.domain.service;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.MatchingRequest;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.model.Learner;
import com.example.backend.infrastructure.repository.LearnerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

  @Mock
  private CarService carService;

  @Mock
  private LearnerRepository learnerRepository;

  @InjectMocks
  private MatchingService matchingService;

  @Test
  void proximityScore_zeroDist_returns100() {
    assertEquals(100.0, matchingService.computeProximityScore(0.0), 0.01);
  }

  @Test
  void proximityScore_50kmAway_returnsZero() {
    assertEquals(0.0, matchingService.computeProximityScore(50.0), 0.01);
  }

  @Test
  void budgetScore_sufficientBalance_returns100() {
    assertEquals(100.0, matchingService.computeBudgetScore(100.0, 500.0), 0.01);
  }

  @Test
  void budgetScore_halfBalance_returns50() {
    assertEquals(50.0, matchingService.computeBudgetScore(200.0, 100.0), 0.01);
  }

  @Test
  void transmissionScore_match_returns100() {
    assertEquals(100.0, matchingService.computeTransmissionScore("Automatic", "Automatic"),
        0.01);
  }

  @Test
  void transmissionScore_noPreference_returns75() {
    assertEquals(75.0, matchingService.computeTransmissionScore("Automatic", null), 0.01);
    assertEquals(75.0, matchingService.computeTransmissionScore("Manual", ""), 0.01);
  }

  @Test
  void transmissionScore_mismatch_returns50() {
    assertEquals(50.0, matchingService.computeTransmissionScore("Manual", "Automatic"), 0.01);
  }

  @Test
  void autoMatch_unknownLearner_throwsIllegalArgument() {
    when(learnerRepository.findById(99L)).thenReturn(Optional.empty());

    MatchingRequest request = new MatchingRequest(99L, "2026-04-08", "14:30", 2, 45.5, -73.5,
        "Automatic");

    assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(request));
  }

  @Test
  void autoMatch_ranksCarsByComposite_closerFirst() {
    Learner learner = new Learner();
    learner.setId(1L);
    learner.setBalance(500.0);

    when(learnerRepository.findById(1L)).thenReturn(Optional.of(learner));

    CarDto car1 = new CarDto(1L, "Toyota", "Automatic", "Downtown", 45.505, -73.495, true, 50.0);
    CarDto car2 = new CarDto(2L, "Honda", "Automatic", "Suburbs", 45.4, -73.6, true, 50.0);

    when(carService.searchCars(
        "Automatic",
        null,
        null,
        true,
        45.5,
        -73.5,
        50.0,
        "WEDNESDAY",
        870,
        930
    )).thenReturn(List.of(car1, car2));

    MatchingRequest request =
        new MatchingRequest(1L, "2026-04-09", "14:30", 1, 45.5, -73.5, "Automatic");
    List<MatchResult> results = matchingService.autoMatch(request);

    assertNotNull(results);
    assertFalse(results.isEmpty());
    assertTrue(results.get(0).getCompositeScore() >= results.get(results.size() - 1)
        .getCompositeScore());
  }
}
