package com.example.backend.domain.service.factory;

import com.example.backend.domain.model.*;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class UserFactoryTest {

    // --- LearnerFactory ---

    @Test
    void learnerFactoryCreatesLearnerWithDefaults() {
        LearnerFactory factory = new LearnerFactory();
        User user = factory.createUser();

        assertInstanceOf(Learner.class, user);
        Learner learner = (Learner) user;
        assertEquals(0.0, learner.getBalance());
        assertEquals("BEGINNER", learner.getExperienceLevel());
    }

    @Test
    void learnerFactorySupportsLearnerRole() {
        assertEquals("LEARNER", new LearnerFactory().getSupportedRole());
    }

    // --- InstructorFactory ---

    @Test
    void instructorFactoryCreatesInstructorWithDefaults() {
        InstructorFactory factory = new InstructorFactory();
        User user = factory.createUser();

        assertInstanceOf(Instructor.class, user);
        Instructor instructor = (Instructor) user;
        assertEquals(0.0, instructor.getRating());
        assertEquals(10.0, instructor.getTravelRadius());
    }

    @Test
    void instructorFactorySupportsInstructorRole() {
        assertEquals("INSTRUCTOR", new InstructorFactory().getSupportedRole());
    }

    // --- CarProviderFactory ---

    @Test
    void carProviderFactoryCreatesCarProvider() {
        CarProviderFactory factory = new CarProviderFactory();
        User user = factory.createUser();

        assertInstanceOf(CarProvider.class, user);
    }

    @Test
    void carProviderFactorySupportsCarProviderRole() {
        assertEquals("CAR_PROVIDER", new CarProviderFactory().getSupportedRole());
    }

    // --- UserFactoryRegistry ---

    @Test
    void registryCreatesLearner() {
        UserFactoryRegistry registry = new UserFactoryRegistry(
                List.of(new LearnerFactory(), new InstructorFactory(), new CarProviderFactory()));

        User user = registry.createUser("LEARNER");
        assertInstanceOf(Learner.class, user);
    }

    @Test
    void registryCreatesInstructor() {
        UserFactoryRegistry registry = new UserFactoryRegistry(
                List.of(new LearnerFactory(), new InstructorFactory(), new CarProviderFactory()));

        User user = registry.createUser("INSTRUCTOR");
        assertInstanceOf(Instructor.class, user);
    }

    @Test
    void registryCreatesCarProvider() {
        UserFactoryRegistry registry = new UserFactoryRegistry(
                List.of(new LearnerFactory(), new InstructorFactory(), new CarProviderFactory()));

        User user = registry.createUser("CAR_PROVIDER");
        assertInstanceOf(CarProvider.class, user);
    }

    @Test
    void registryHandlesCaseInsensitiveRole() {
        UserFactoryRegistry registry = new UserFactoryRegistry(
                List.of(new LearnerFactory(), new InstructorFactory(), new CarProviderFactory()));

        User user = registry.createUser("learner");
        assertInstanceOf(Learner.class, user);
    }

    @Test
    void registryThrowsForUnsupportedRole() {
        UserFactoryRegistry registry = new UserFactoryRegistry(
                List.of(new LearnerFactory(), new InstructorFactory(), new CarProviderFactory()));

        assertThrows(IllegalArgumentException.class, () -> registry.createUser("UNKNOWN"));
    }
}
