package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MatchingRequestTest {

  @Test
  void testGettersAndSetters() {
    MatchingRequest request = new MatchingRequest();
    request.setLearnerId(123L);
    request.setDate("2026-04-08");
    request.setStartTime("14:30");
    request.setDuration(2);
    request.setLearnerLat(45.5);
    request.setLearnerLng(-73.5);
    request.setTransmissionPreference("Automatic");

    assertEquals(123L, request.getLearnerId());
    assertEquals("2026-04-08", request.getDate());
    assertEquals("14:30", request.getStartTime());
    assertEquals(2, request.getDuration());
    assertEquals(45.5, request.getLearnerLat());
    assertEquals(-73.5, request.getLearnerLng());
    assertEquals("Automatic", request.getTransmissionPreference());
  }

  @Test
  void testConstructorWithAllArgs() {
    MatchingRequest request =
        new MatchingRequest(123L, "2026-04-08", "14:30", 2, 45.5, -73.5, "Automatic");

    assertEquals(123L, request.getLearnerId());
    assertEquals("2026-04-08", request.getDate());
    assertEquals("14:30", request.getStartTime());
    assertEquals(2, request.getDuration());
    assertEquals(45.5, request.getLearnerLat());
    assertEquals(-73.5, request.getLearnerLng());
    assertEquals("Automatic", request.getTransmissionPreference());
  }

  @Test
  void testNoArgConstructor() {
    MatchingRequest request = new MatchingRequest();
    assertNull(request.getLearnerId());
    assertNull(request.getDate());
    assertNull(request.getStartTime());
    assertEquals(0, request.getDuration());
    assertEquals(0.0, request.getLearnerLat());
    assertEquals(0.0, request.getLearnerLng());
    assertNull(request.getTransmissionPreference());
  }
}
