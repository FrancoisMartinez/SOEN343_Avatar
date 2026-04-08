package com.example.backend.application.controller;

import com.example.backend.application.dto.MatchingRequest;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.service.MatchingService;
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

  private final MatchingService matchingService;

  public MatchingController(MatchingService matchingService) {
    this.matchingService = matchingService;
  }

  @PostMapping("/auto")
  public ResponseEntity<?> autoMatch(@RequestBody MatchingRequest request) {
    try {
      List<MatchResult> results = matchingService.autoMatch(request);
      return ResponseEntity.ok(results);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }
}
