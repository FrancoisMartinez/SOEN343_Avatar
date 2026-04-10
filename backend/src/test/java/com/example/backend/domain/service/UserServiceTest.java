package com.example.backend.domain.service;

import com.example.backend.application.dto.AuthResponse;
import com.example.backend.application.dto.RegisterRequest;
import com.example.backend.domain.model.Instructor;
import com.example.backend.domain.model.Learner;
import com.example.backend.domain.model.User;
import com.example.backend.domain.service.factory.UserFactoryRegistry;
import com.example.backend.infrastructure.repository.LearnerRepository;
import com.example.backend.infrastructure.repository.UserRepository;
import com.example.backend.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private LearnerRepository learnerRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserFactoryRegistry userFactoryRegistry;

    @InjectMocks
    private UserService userService;

    @Test
    void authenticateReturnsTokenWhenCredentialsAreValid() {
        Learner user = new Learner();
        user.setId(10L);
        user.setPassword("encoded-password");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plain-password", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateToken(10L, "LEARNER")).thenReturn("jwt-token");

        AuthResponse response = userService.authenticate("john@example.com", "plain-password");

        assertEquals("jwt-token", response.getToken());
        assertEquals(10L, response.getUserId());
        assertEquals("LEARNER", response.getRole());
    }

    @Test
    void registerCreatesInstructorWhenRoleIsInstructor() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");
        request.setRoles(List.of("INSTRUCTOR"));

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(userFactoryRegistry.createUser("INSTRUCTOR")).thenReturn(new Instructor());
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(7L);
            return saved;
        });
        when(jwtUtil.generateToken(7L, "INSTRUCTOR")).thenReturn("jwt-token");

        AuthResponse response = userService.register(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals(7L, response.getUserId());
        assertEquals("INSTRUCTOR", response.getRole());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertTrue(savedUser instanceof Instructor);
        assertEquals("Jane Doe", savedUser.getFullName());
        assertEquals("jane@example.com", savedUser.getEmail());
        assertEquals("encoded-password", savedUser.getPassword());
    }

    @Test
    void registerThrowsWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setRoles(List.of("LEARNER"));

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.register(request));

        assertEquals("Email already registered", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void authenticateThrowsWhenPasswordDoesNotMatch() {
        Learner user = new Learner();
        user.setPassword("encoded-password");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(eq("wrong-password"), eq("encoded-password"))).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.authenticate("john@example.com", "wrong-password"));

        assertEquals("Invalid credentials", ex.getMessage());
    }

    @Test
    void authenticateThrowsWhenUserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.authenticate("unknown@example.com", "password"));
        assertEquals("Invalid credentials", ex.getMessage());
    }

    // --- getUserProfile ---

    @Test
    void getUserProfileReturnsLearnerProfile() {
        Learner learner = new Learner();
        learner.setId(1L);
        learner.setFullName("Alice");
        learner.setEmail("alice@example.com");
        learner.setBalance(150.0);

        when(userRepository.findById(1L)).thenReturn(Optional.of(learner));

        com.example.backend.application.dto.UserProfileResponse response = userService.getUserProfile(1L);

        assertEquals(1L, response.getId());
        assertEquals("Alice", response.getFullName());
        assertEquals("alice@example.com", response.getEmail());
        assertEquals("LEARNER", response.getRole());
        assertEquals(150.0, response.getBalance());
        assertNull(response.getHourlyRate());
    }

    @Test
    void getUserProfileReturnsInstructorProfile() {
        Instructor instructor = new Instructor();
        instructor.setId(2L);
        instructor.setFullName("Bob");
        instructor.setEmail("bob@example.com");
        instructor.setHourlyRate(60.0);
        instructor.setLatitude(45.5);
        instructor.setLongitude(-73.6);

        when(userRepository.findById(2L)).thenReturn(Optional.of(instructor));

        com.example.backend.application.dto.UserProfileResponse response = userService.getUserProfile(2L);

        assertEquals(2L, response.getId());
        assertEquals("INSTRUCTOR", response.getRole());
        assertEquals(60.0, response.getHourlyRate());
        assertEquals(45.5, response.getLatitude());
        assertEquals(-73.6, response.getLongitude());
        assertNull(response.getBalance());
    }

    @Test
    void getUserProfileThrowsWhenNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> userService.getUserProfile(999L));
    }

    // --- updateUserProfile ---

    @Test
    void updateUserProfileUpdatesBasicFields() {
        Learner learner = new Learner();
        learner.setId(1L);
        learner.setFullName("Old Name");
        learner.setEmail("old@example.com");

        com.example.backend.application.dto.UpdateProfileRequest req = new com.example.backend.application.dto.UpdateProfileRequest();
        req.setFullName("New Name");
        req.setEmail("new@example.com");
        req.setLicenseNumber("LIC123");
        req.setLicenseRegion("QC");

        when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        com.example.backend.application.dto.UserProfileResponse response = userService.updateUserProfile(1L, req);

        assertEquals("New Name", response.getFullName());
        assertEquals("new@example.com", response.getEmail());
    }

    @Test
    void updateUserProfileUpdatesInstructorSpecificFields() {
        Instructor instructor = new Instructor();
        instructor.setId(2L);
        instructor.setFullName("Bob");
        instructor.setEmail("bob@example.com");
        instructor.setHourlyRate(50.0);

        com.example.backend.application.dto.UpdateProfileRequest req = new com.example.backend.application.dto.UpdateProfileRequest();
        req.setHourlyRate(75.0);
        req.setLatitude(46.0);
        req.setLongitude(-74.0);

        when(userRepository.findById(2L)).thenReturn(Optional.of(instructor));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        com.example.backend.application.dto.UserProfileResponse response = userService.updateUserProfile(2L, req);

        assertEquals(75.0, response.getHourlyRate());
        assertEquals(46.0, response.getLatitude());
        assertEquals(-74.0, response.getLongitude());
    }

    @Test
    void updateUserProfileThrowsWhenNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        com.example.backend.application.dto.UpdateProfileRequest req = new com.example.backend.application.dto.UpdateProfileRequest();
        assertThrows(RuntimeException.class, () -> userService.updateUserProfile(999L, req));
    }

    @Test
    void updateUserProfileSkipsNullFields() {
        Learner learner = new Learner();
        learner.setId(1L);
        learner.setFullName("Original");
        learner.setEmail("orig@example.com");

        com.example.backend.application.dto.UpdateProfileRequest req = new com.example.backend.application.dto.UpdateProfileRequest();
        // All fields null - should not update anything

        when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        com.example.backend.application.dto.UserProfileResponse response = userService.updateUserProfile(1L, req);
        assertEquals("Original", response.getFullName());
    }

    // --- addBalance ---

    @Test
    void addBalanceIncreasesLearnerBalance() {
        Learner learner = new Learner();
        learner.setId(1L);
        learner.setFullName("Alice");
        learner.setEmail("alice@example.com");
        learner.setBalance(100.0);

        when(learnerRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(learnerRepository.save(any(Learner.class))).thenAnswer(i -> i.getArgument(0));

        com.example.backend.application.dto.UserProfileResponse response = userService.addBalance(1L, 50.0);
        assertEquals(150.0, response.getBalance());
    }

    @Test
    void addBalanceThrowsWhenAmountIsZero() {
        assertThrows(IllegalArgumentException.class, () -> userService.addBalance(1L, 0));
    }

    @Test
    void addBalanceThrowsWhenAmountIsNegative() {
        assertThrows(IllegalArgumentException.class, () -> userService.addBalance(1L, -10.0));
    }

    @Test
    void addBalanceThrowsWhenLearnerNotFound() {
        when(learnerRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> userService.addBalance(999L, 50.0));
    }

    // --- register learner ---

    @Test
    void registerCreatesLearnerWhenRoleIsLearner() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail("john@example.com");
        request.setPassword("pass123");
        request.setRoles(List.of("LEARNER"));

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userFactoryRegistry.createUser("LEARNER")).thenReturn(new Learner());
        when(passwordEncoder.encode("pass123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User saved = i.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(jwtUtil.generateToken(1L, "LEARNER")).thenReturn("token");

        AuthResponse response = userService.register(request);
        assertEquals("LEARNER", response.getRole());
        assertEquals("token", response.getToken());
    }
}
