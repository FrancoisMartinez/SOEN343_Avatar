package com.example.backend.foundation.config;

import com.example.backend.domain.model.Instructor;
import com.example.backend.domain.model.Learner;
import com.example.backend.infrastructure.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                Learner learner = new Learner();
                learner.setFullName("Test Learner");
                learner.setEmail("learner@test.com");
                learner.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(learner);

                Instructor instructor = new Instructor();
                instructor.setFullName("Test Instructor");
                instructor.setEmail("instructor@test.com");
                instructor.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(instructor);

                System.out.println(">>> Seeded 2 test users (learner@test.com, instructor@test.com / password123)");
            }
        };
    }
}
