package com.example.backend.domain.service;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.InstructorDto;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.application.dto.MatchingRequest;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock private CarService carService;
    @Mock private InstructorService instructorService;
    @Mock private LearnerRepository learnerRepository;

    @InjectMocks
    private MatchingService matchingService;

    private Learner createLearner(Long id, double balance) {
        Learner l = new Learner();
        l.setId(id);
        l.setFullName("Test Learner");
        l.setBalance(balance);
        return l;
    }

    private CarDto createCarDto(Long id, String makeModel, String transmission, double rate, double lat, double lng) {
        return new CarDto(id, makeModel, transmission, "Location", lat, lng, true, rate);
    }

    private InstructorDto createInstructorDto(Long id, String name, double rate, double lat, double lng) {
        return new InstructorDto(id, name, rate, 4.5, lat, lng);
    }

    private MatchingRequest createRequest(Long learnerId, double lat, double lng) {
        MatchingRequest req = new MatchingRequest();
        req.setLearnerId(learnerId);
        req.setLearnerLat(lat);
        req.setLearnerLng(lng);
        return req;
    }

    // --- Validation tests ---

    @Test
    void autoMatchThrowsWhenLearnerIdIsNull() {
        MatchingRequest req = createRequest(null, 45.5, -73.6);
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchThrowsWhenLatitudeOutOfRange() {
        MatchingRequest req = createRequest(1L, 91.0, -73.6);
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchThrowsWhenLatitudeTooLow() {
        MatchingRequest req = createRequest(1L, -91.0, -73.6);
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchThrowsWhenLongitudeOutOfRange() {
        MatchingRequest req = createRequest(1L, 45.5, 181.0);
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchThrowsWhenLongitudeTooLow() {
        MatchingRequest req = createRequest(1L, 45.5, -181.0);
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchThrowsWhenLearnerNotFound() {
        MatchingRequest req = createRequest(999L, 45.5, -73.6);
        when(learnerRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    // --- Date/time parsing ---

    @Test
    void autoMatchThrowsOnInvalidDateFormat() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setDate("not-a-date");
        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchParsesDateAndTime() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setDate("2027-06-16"); // Wednesday
        req.setStartTime("10:00");
        req.setDuration(2);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), eq(45.5), eq(-73.6), any(), eq("WEDNESDAY"), eq(600), eq(720)))
                .thenReturn(List.of());
        when(instructorService.searchInstructors(eq(45.5), eq(-73.6), any(), any(), any(), eq("WEDNESDAY"), eq(600), eq(720)))
                .thenReturn(List.of());

        List<MatchResult> results = matchingService.autoMatch(req);
        assertTrue(results.isEmpty());
    }

    // --- Successful matching ---

    @Test
    void autoMatchReturnsRankedResults() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);

        CarDto car = createCarDto(1L, "Toyota", "AUTOMATIC", 50.0, 45.501, -73.601);
        InstructorDto instructor = createInstructorDto(1L, "Jane", 40.0, 45.502, -73.602);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), eq(45.5), eq(-73.6), any(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(car));
        when(instructorService.searchInstructors(eq(45.5), eq(-73.6), any(), any(), any(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(instructor));

        List<MatchResult> results = matchingService.autoMatch(req);

        assertEquals(1, results.size());
        MatchResult result = results.get(0);
        assertEquals(1L, result.getCarId());
        assertEquals(1L, result.getInstructorId());
        assertEquals(90.0, result.getTotalCost()); // 1 hour * (50 + 40)
        assertTrue(result.getCompositeScore() > 0);
        assertTrue(result.getProximityScore() > 0);
        assertTrue(result.getDistanceKm() > 0);
    }

    @Test
    void autoMatchWithMultiplePairsReturnsSortedByScore() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setTransmissionPreference("AUTOMATIC");

        CarDto closeCar = createCarDto(1L, "Toyota", "AUTOMATIC", 40.0, 45.501, -73.601);
        CarDto farCar = createCarDto(2L, "Honda", "MANUAL", 30.0, 46.0, -74.0);
        InstructorDto instructor = createInstructorDto(1L, "Jane", 40.0, 45.502, -73.602);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), anyDouble(), anyDouble(), any(), any(), any(), any()))
                .thenReturn(List.of(closeCar, farCar));
        when(instructorService.searchInstructors(anyDouble(), anyDouble(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(instructor));

        List<MatchResult> results = matchingService.autoMatch(req);

        assertEquals(2, results.size());
        // Close car + matching transmission should score higher
        assertTrue(results.get(0).getCompositeScore() >= results.get(1).getCompositeScore());
    }

    @Test
    void autoMatchReturnsMaxTwentyResults() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);

        // Create 5 cars and 5 instructors = 25 pairs, should return max 20
        List<CarDto> cars = new java.util.ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            cars.add(createCarDto((long) i, "Car" + i, "AUTOMATIC", 40.0 + i, 45.5 + i * 0.001, -73.6));
        }
        List<InstructorDto> instructors = new java.util.ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            instructors.add(createInstructorDto((long) i, "Inst" + i, 30.0 + i, 45.5, -73.6 + i * 0.001));
        }

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 10000.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), anyDouble(), anyDouble(), any(), any(), any(), any()))
                .thenReturn(cars);
        when(instructorService.searchInstructors(anyDouble(), anyDouble(), any(), any(), any(), any(), any(), any()))
                .thenReturn(instructors);

        List<MatchResult> results = matchingService.autoMatch(req);
        assertEquals(20, results.size());
    }

    @Test
    void autoMatchWithNoCandidatesReturnsEmpty() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), anyDouble(), anyDouble(), any(), any(), any(), any()))
                .thenReturn(List.of());
        when(instructorService.searchInstructors(anyDouble(), anyDouble(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());

        List<MatchResult> results = matchingService.autoMatch(req);
        assertTrue(results.isEmpty());
    }

    @Test
    void autoMatchWithDurationUsesCorrectCostCalculation() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setDuration(3);

        CarDto car = createCarDto(1L, "Toyota", "AUTOMATIC", 50.0, 45.501, -73.601);
        InstructorDto instructor = createInstructorDto(1L, "Jane", 40.0, 45.502, -73.602);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), anyDouble(), anyDouble(), any(), any(), any(), any()))
                .thenReturn(List.of(car));
        when(instructorService.searchInstructors(anyDouble(), anyDouble(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(instructor));

        List<MatchResult> results = matchingService.autoMatch(req);
        assertEquals(1, results.size());
        assertEquals(270.0, results.get(0).getTotalCost()); // 3 * (50 + 40) = 270
    }

    @Test
    void autoMatchWithNullDurationDefaultsToOneHour() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setDuration(null);

        CarDto car = createCarDto(1L, "Toyota", "AUTOMATIC", 50.0, 45.501, -73.601);
        InstructorDto instructor = createInstructorDto(1L, "Jane", 40.0, 45.502, -73.602);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), anyDouble(), anyDouble(), any(), any(), any(), any()))
                .thenReturn(List.of(car));
        when(instructorService.searchInstructors(anyDouble(), anyDouble(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(instructor));

        List<MatchResult> results = matchingService.autoMatch(req);
        assertEquals(90.0, results.get(0).getTotalCost()); // 1 * (50 + 40) = 90
    }

    @Test
    void autoMatchWithBlankDateDoesNotSetDayOfWeek() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setDate("   ");

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), anyDouble(), anyDouble(), any(), isNull(), isNull(), isNull()))
                .thenReturn(List.of());
        when(instructorService.searchInstructors(anyDouble(), anyDouble(), any(), any(), any(), isNull(), isNull(), isNull()))
                .thenReturn(List.of());

        List<MatchResult> results = matchingService.autoMatch(req);
        assertTrue(results.isEmpty());
    }

    @Test
    void autoMatchWithBlankStartTimeDoesNotSetMinutes() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setStartTime("   ");

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), any(), any(), eq(true), anyDouble(), anyDouble(), any(), any(), isNull(), isNull()))
                .thenReturn(List.of());
        when(instructorService.searchInstructors(anyDouble(), anyDouble(), any(), any(), any(), any(), isNull(), isNull()))
                .thenReturn(List.of());

        List<MatchResult> results = matchingService.autoMatch(req);
        assertTrue(results.isEmpty());
    }

    // --- Scoring functions ---

    @Test
    void computeProximityScoreAtZeroDistanceIs100() {
        assertEquals(100.0, matchingService.computeProximityScore(0));
    }

    @Test
    void computeProximityScoreAtMaxDistanceIsZero() {
        assertEquals(0.0, matchingService.computeProximityScore(100.0));
    }

    @Test
    void computeProximityScoreAt50KmIs50() {
        assertEquals(50.0, matchingService.computeProximityScore(50.0));
    }

    @Test
    void computeProximityScoreNeverNegative() {
        assertEquals(0.0, matchingService.computeProximityScore(200.0));
    }

    @Test
    void computeBudgetScoreWhenCostIsZero() {
        assertEquals(100.0, matchingService.computeBudgetScore(0, 500.0));
    }

    @Test
    void computeBudgetScoreWhenBalanceIsZero() {
        assertEquals(0.0, matchingService.computeBudgetScore(100.0, 0));
    }

    @Test
    void computeBudgetScoreWhenBalanceCoversExactly() {
        assertEquals(100.0, matchingService.computeBudgetScore(100.0, 100.0));
    }

    @Test
    void computeBudgetScoreCapsAt100() {
        assertEquals(100.0, matchingService.computeBudgetScore(50.0, 200.0));
    }

    @Test
    void computeBudgetScorePartialCoverage() {
        assertEquals(50.0, matchingService.computeBudgetScore(100.0, 50.0));
    }

    @Test
    void computeTransmissionScoreWithNullPreference() {
        assertEquals(75.0, matchingService.computeTransmissionScore("AUTOMATIC", null));
    }

    @Test
    void computeTransmissionScoreWithBlankPreference() {
        assertEquals(75.0, matchingService.computeTransmissionScore("AUTOMATIC", ""));
    }

    @Test
    void computeTransmissionScoreWithMatchingPreference() {
        assertEquals(100.0, matchingService.computeTransmissionScore("AUTOMATIC", "AUTOMATIC"));
    }

    @Test
    void computeTransmissionScoreWithMatchingCaseInsensitive() {
        assertEquals(100.0, matchingService.computeTransmissionScore("AUTOMATIC", "automatic"));
    }

    @Test
    void computeTransmissionScoreWithNonMatchingPreference() {
        assertEquals(50.0, matchingService.computeTransmissionScore("AUTOMATIC", "MANUAL"));
    }

    // --- Time parsing edge cases ---

    @Test
    void autoMatchWithInvalidStartTimeThrows() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setStartTime("invalid");
        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchWithInvalidTimeValuesThrows() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setStartTime("25:00");
        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        assertThrows(IllegalArgumentException.class, () -> matchingService.autoMatch(req));
    }

    @Test
    void autoMatchPassesRadiusAndPriceFilters() {
        MatchingRequest req = createRequest(1L, 45.5, -73.6);
        req.setRadius(25.0);
        req.setMinPrice(20.0);
        req.setMaxPrice(100.0);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(createLearner(1L, 500.0)));
        when(carService.searchCars(any(), eq(20.0), eq(100.0), eq(true), eq(45.5), eq(-73.6), eq(25.0), any(), any(), any()))
                .thenReturn(List.of());
        when(instructorService.searchInstructors(eq(45.5), eq(-73.6), eq(25.0), eq(20.0), eq(100.0), any(), any(), any()))
                .thenReturn(List.of());

        List<MatchResult> results = matchingService.autoMatch(req);
        assertTrue(results.isEmpty());
    }
}
