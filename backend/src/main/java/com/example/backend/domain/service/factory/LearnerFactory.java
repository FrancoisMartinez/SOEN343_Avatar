package com.example.backend.domain.service.factory;

import com.example.backend.domain.model.Learner;
import com.example.backend.domain.model.User;
import org.springframework.stereotype.Component;

/**
 * Factory that creates Learner instances with default configuration:
 * initial balance of 0.0 and experience level "BEGINNER".
 */
@Component
public class LearnerFactory implements UserFactory {

    @Override
    public User createUser() {
        Learner learner = new Learner();
        learner.setBalance(0.0);
        learner.setExperienceLevel("BEGINNER");
        return learner;
    }

    @Override
    public String getSupportedRole() {
        return "LEARNER";
    }
}
