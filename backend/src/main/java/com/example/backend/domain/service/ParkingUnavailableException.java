package com.example.backend.domain.service;

public class ParkingUnavailableException extends RuntimeException {
    public ParkingUnavailableException(String message) {
        super(message);
    }

    public ParkingUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
