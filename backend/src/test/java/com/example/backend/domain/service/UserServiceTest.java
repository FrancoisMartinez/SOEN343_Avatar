package com.example.backend.domain.service;

import com.example.backend.application.dto.AuthResponse;
import com.example.backend.application.dto.RegisterRequest;
import com.example.backend.domain.model.Instructor;
import com.example.backend.domain.model.Learner;
import com.example.backend.domain.model.User;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

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
}
