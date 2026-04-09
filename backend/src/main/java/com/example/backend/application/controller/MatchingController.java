package com.example.backend.application.controller;

import com.example.backend.application.dto.MatchingRequest;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.service.MatchingService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Auto-matching endpoint for finding ranked cars based on learner location and preferences.
 *
 * SECURITY NOTE: This endpoint currently has no authentication requirement due to the
 * application's SecurityConfig using .anyRequest().permitAll(). In production, this endpoint
 * MUST be secured with one of the following:
 *
 * 1. Require valid JWT authentication via Spring Security
 * 2. Extract authenticated user identity from JWT principal
 * 3. Override the request's learnerId with the authenticated user's ID
 *
 * The current implementation accepts learnerId from the request body without verification,
 * which allows callers to infer other users' financial data via scoring responses.
 * See TODO-AUTH-001 in SecurityConfig.
 */
@RestController
@RequestMapping("/api/matchings")
public class MatchingController {

  private static final Logger log = LoggerFactory.getLogger(MatchingController.class);

  private final MatchingService matchingService;

  public MatchingController(MatchingService matchingService) {
    this.matchingService = matchingService;
  }

  /**
   * Find and rank available cars matching learner's location and preferences.
   *
   * @param request Auto-match request (date, time, location, transmission preference)
   * @return Ranked list of MatchResult objects sorted by composite score (best first)
   */
  @PostMapping("/auto")
  public ResponseEntity<?> autoMatch(@Valid @RequestBody MatchingRequest request) {
    try {
      List<MatchResult> results = matchingService.autoMatch(request);
      return ResponseEntity.ok(results);
    } catch (IllegalArgumentException e) {
      log.warn("Auto-match validation failed: {}", e.getMessage());
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (RuntimeException e) {
      log.error("Unexpected error in auto-match", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to process auto-match request"));
    }
  }
}
