package com.example.backend.application.controller;

import com.example.backend.application.dto.UpdateProfileRequest;
import com.example.backend.application.dto.UserProfileResponse;
import com.example.backend.domain.service.UserService;
import com.example.backend.infrastructure.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            return ResponseEntity.ok(userService.getUserProfile(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UpdateProfileRequest request) {
        try {
            Long userId = extractUserId(authHeader);
            return ResponseEntity.ok(userService.updateUserProfile(userId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/me/balance")
    public ResponseEntity<?> addBalance(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Double> body) {
        try {
            Long userId = extractUserId(authHeader);
            Double amount = body.get("amount");
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            return ResponseEntity.ok(userService.addBalance(userId, amount));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        Claims claims = jwtUtil.validateToken(token);
        return Long.parseLong(claims.getSubject());
    }
}
