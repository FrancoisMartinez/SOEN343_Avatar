package com.example.backend.domain.service.factory;

import com.example.backend.domain.model.CarProvider;
import com.example.backend.domain.model.User;
import org.springframework.stereotype.Component;

/**
 * Factory that creates CarProvider instances with default configuration.
 */
@Component
public class CarProviderFactory implements UserFactory {

    @Override
    public User createUser() {
        return new CarProvider();
    }

    @Override
    public String getSupportedRole() {
        return "CAR_PROVIDER";
    }
}
