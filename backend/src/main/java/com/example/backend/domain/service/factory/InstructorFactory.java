package com.example.backend.domain.service.factory;

import com.example.backend.domain.model.Instructor;
import com.example.backend.domain.model.User;
import org.springframework.stereotype.Component;

/**
 * Factory that creates Instructor instances with default configuration:
 * initial rating of 0.0.
 */
@Component
public class InstructorFactory implements UserFactory {

    @Override
    public User createUser() {
        Instructor instructor = new Instructor();
        instructor.setRating(0.0);
        return instructor;
    }

    @Override
    public String getSupportedRole() {
        return "INSTRUCTOR";
    }
}
