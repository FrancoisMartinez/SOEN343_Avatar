package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CarRequestTest {

    @Test
    void settersAndGettersWork() {
        CarRequest request = new CarRequest();
        request.setMakeModel("Model 3");
        request.setTransmissionType("AUTO");
        request.setLocation("Laval");
        request.setLatitude(45.5);
        request.setLongitude(-73.7);
        request.setAvailable(true);
        request.setHourlyRate(60.0);

        assertEquals("Model 3", request.getMakeModel());
        assertEquals("AUTO", request.getTransmissionType());
        assertEquals("Laval", request.getLocation());
        assertEquals(45.5, request.getLatitude());
        assertEquals(-73.7, request.getLongitude());
        assertEquals(true, request.isAvailable());
        assertEquals(60.0, request.getHourlyRate());
    }
}