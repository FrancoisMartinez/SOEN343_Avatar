package com.example.backend.domain.service;

import com.example.backend.application.dto.AuthResponse;
import com.example.backend.application.dto.RegisterRequest;
import com.example.backend.domain.model.*;
import com.example.backend.infrastructure.repository.UserRepository;
import com.example.backend.infrastructure.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Authenticate a user by email and password.
     * Follows the sequence: findByEmail → verify password → generate JWT.
     */
    public AuthResponse authenticate(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        return new AuthResponse(token, user.getId(), user.getRole());
    }

    /**
     * Register a new user. Creates the appropriate subclass based on the first role provided.
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        String primaryRole = request.getRoles().get(0);
        User user = createUserByRole(primaryRole);

        user.setFullName(request.getFirstName() + " " + request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getId(), saved.getRole());
        return new AuthResponse(token, saved.getId(), saved.getRole());
    }

    private User createUserByRole(String role) {
        return switch (role) {
            case "INSTRUCTOR" -> new Instructor();
            case "CAR_PROVIDER" -> new CarProvider();
            default -> new Learner();
        };
    }
}
