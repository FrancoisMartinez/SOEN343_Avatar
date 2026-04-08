package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MatchResultTest {

  @Test
  void testGettersAndSetters() {
    MatchResult result = new MatchResult();
    result.setCarId(1L);
    result.setMakeModel("Toyota Corolla");
    result.setTransmissionType("Automatic");
    result.setLocation("Montreal");
    result.setLatitude(45.5);
    result.setLongitude(-73.5);
    result.setHourlyRate(50.0);
    result.setTotalCost(100.0);
    result.setProximityScore(95.0);
    result.setBudgetScore(80.0);
    result.setTransmissionScore(100.0);
    result.setCompositeScore(88.0);
    result.setDistanceKm(2.5);

    assertEquals(1L, result.getCarId());
    assertEquals("Toyota Corolla", result.getMakeModel());
    assertEquals("Automatic", result.getTransmissionType());
    assertEquals("Montreal", result.getLocation());
    assertEquals(45.5, result.getLatitude());
    assertEquals(-73.5, result.getLongitude());
    assertEquals(50.0, result.getHourlyRate());
    assertEquals(100.0, result.getTotalCost());
    assertEquals(95.0, result.getProximityScore());
    assertEquals(80.0, result.getBudgetScore());
    assertEquals(100.0, result.getTransmissionScore());
    assertEquals(88.0, result.getCompositeScore());
    assertEquals(2.5, result.getDistanceKm());
  }

  @Test
  void testConstructorWithAllArgs() {
    MatchResult result =
        new MatchResult(
            1L,
            "Toyota Corolla",
            "Automatic",
            "Montreal",
            45.5,
            -73.5,
            50.0,
            100.0,
            95.0,
            80.0,
            100.0,
            88.0,
            2.5);

    assertEquals(1L, result.getCarId());
    assertEquals("Toyota Corolla", result.getMakeModel());
    assertEquals("Automatic", result.getTransmissionType());
    assertEquals("Montreal", result.getLocation());
    assertEquals(45.5, result.getLatitude());
    assertEquals(-73.5, result.getLongitude());
    assertEquals(50.0, result.getHourlyRate());
    assertEquals(100.0, result.getTotalCost());
    assertEquals(95.0, result.getProximityScore());
    assertEquals(80.0, result.getBudgetScore());
    assertEquals(100.0, result.getTransmissionScore());
    assertEquals(88.0, result.getCompositeScore());
    assertEquals(2.5, result.getDistanceKm());
  }
}
