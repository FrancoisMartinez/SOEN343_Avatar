package com.example.backend.domain.service;

import com.example.backend.application.dto.AuthResponse;
import com.example.backend.application.dto.RegisterRequest;
import com.example.backend.application.dto.UpdateProfileRequest;
import com.example.backend.application.dto.UserProfileResponse;
import com.example.backend.domain.model.*;
import com.example.backend.domain.service.factory.UserFactoryRegistry;
import com.example.backend.infrastructure.repository.LearnerRepository;
import com.example.backend.infrastructure.repository.UserRepository;
import com.example.backend.infrastructure.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final LearnerRepository learnerRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final UserFactoryRegistry userFactoryRegistry;

    public UserService(UserRepository userRepository, LearnerRepository learnerRepository,
                       JwtUtil jwtUtil, PasswordEncoder passwordEncoder,
                       UserFactoryRegistry userFactoryRegistry) {
        this.userRepository = userRepository;
        this.learnerRepository = learnerRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.userFactoryRegistry = userFactoryRegistry;
    }

    public AuthResponse authenticate(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        return new AuthResponse(token, user.getId(), user.getRole());
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Factory Method Pattern: delegate user creation to the appropriate factory
        String primaryRole = request.getRoles().get(0);
        User user = userFactoryRegistry.createUser(primaryRole);

        user.setFullName(request.getFirstName() + " " + request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getId(), saved.getRole());
        return new AuthResponse(token, saved.getId(), saved.getRole());
    }

    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toProfileResponse(user);
    }

    public UserProfileResponse updateUserProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getLicenseNumber() != null) user.setLicenseNumber(req.getLicenseNumber());
        if (req.getLicenseIssueDate() != null) user.setLicenseIssueDate(req.getLicenseIssueDate());
        if (req.getLicenseRegion() != null) user.setLicenseRegion(req.getLicenseRegion());

        User saved = userRepository.save(user);
        return toProfileResponse(saved);
    }

    /**
     * Adds funds to a learner's balance. Amount must be positive.
     */
    public UserProfileResponse addBalance(Long userId, double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        Learner learner = learnerRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Learner not found"));
        learner.setBalance(learner.getBalance() + amount);
        Learner saved = learnerRepository.save(learner);
        return toProfileResponse(saved);
    }

    private UserProfileResponse toProfileResponse(User user) {
        Double balance = null;
        if (user instanceof Learner learner) {
            balance = learner.getBalance();
        }
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getLicenseNumber(),
                user.getLicenseIssueDate(),
                user.getLicenseRegion(),
                user.getRole(),
                balance
        );
    }

}
