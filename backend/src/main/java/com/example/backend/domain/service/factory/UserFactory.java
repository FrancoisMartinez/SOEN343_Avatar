package com.example.backend.domain.service.factory;

import com.example.backend.domain.model.User;

/**
 * Factory Method interface for creating User instances.
 * Each concrete factory creates a specific type of user
 * with its role-specific default configuration.
 */
public interface UserFactory {
    User createUser();
    String getSupportedRole();
}
