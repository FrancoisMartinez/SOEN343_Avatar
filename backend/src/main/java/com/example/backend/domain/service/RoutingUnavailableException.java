package com.example.backend.domain.service;

public class RoutingUnavailableException extends RuntimeException {

    public RoutingUnavailableException(String message) {
        super(message);
    }

    public RoutingUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
