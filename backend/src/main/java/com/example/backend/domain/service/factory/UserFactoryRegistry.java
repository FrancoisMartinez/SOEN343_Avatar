package com.example.backend.domain.service.factory;

import com.example.backend.domain.model.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Registry that maps role names to their corresponding UserFactory.
 * New user types can be added by simply creating a new UserFactory implementation
 * without modifying existing code (Open-Closed Principle).
 */
@Component
public class UserFactoryRegistry {

    private final Map<String, UserFactory> factoryMap;

    public UserFactoryRegistry(List<UserFactory> factories) {
        this.factoryMap = factories.stream()
                .collect(Collectors.toMap(UserFactory::getSupportedRole, f -> f));
    }

    public User createUser(String role) {
        UserFactory factory = factoryMap.get(role.toUpperCase());
        if (factory == null) {
            throw new IllegalArgumentException("Unsupported user role: " + role);
        }
        return factory.createUser();
    }
}
