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

@RestController
@RequestMapping("/api/matchings")
public class MatchingController {

  private static final Logger log = LoggerFactory.getLogger(MatchingController.class);

  private final MatchingService matchingService;

  public MatchingController(MatchingService matchingService) {
    this.matchingService = matchingService;
  }

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
