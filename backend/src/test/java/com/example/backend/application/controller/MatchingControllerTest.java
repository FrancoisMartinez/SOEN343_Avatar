package com.example.backend.application.controller;

import com.example.backend.application.dto.MatchingRequest;
import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.service.MatchingService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MatchingController.class)
@AutoConfigureMockMvc(addFilters = false)
class MatchingControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @MockitoBean
  private MatchingService matchingService;

  @MockitoBean
  private ApiRequestMetricsStore apiRequestMetricsStore;

  @Test
  void autoMatch_validRequest_returns200WithResults() throws Exception {
    MatchingRequest request =
        new MatchingRequest(1L, "2026-04-08", "14:30", 2, 45.5, -73.5, "Automatic");

    MatchResult result = new MatchResult(
        1L,
        "Toyota",
        "Automatic",
        "Downtown",
        45.505,
        -73.495,
        50.0,
        100.0,
        95.0,
        80.0,
        100.0,
        88.0,
        2.5
    );

    when(matchingService.autoMatch(any(MatchingRequest.class))).thenReturn(List.of(result));

    mockMvc.perform(post("/api/matchings/auto")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].carId").value(1))
        .andExpect(jsonPath("$[0].makeModel").value("Toyota"))
        .andExpect(jsonPath("$[0].compositeScore").isNumber());
  }

  @Test
  void autoMatch_unknownLearner_returns400WithErrorMessage() throws Exception {
    MatchingRequest request =
        new MatchingRequest(99L, "2026-04-08", "14:30", 2, 45.5, -73.5, "Automatic");

    when(matchingService.autoMatch(any(MatchingRequest.class)))
        .thenThrow(new IllegalArgumentException("Learner not found"));

    mockMvc.perform(post("/api/matchings/auto")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Learner not found"));
  }

  @Test
  void autoMatch_emptyResults_returns200WithEmptyArray() throws Exception {
    MatchingRequest request =
        new MatchingRequest(1L, "2026-04-08", "14:30", 2, 45.5, -73.5, "Automatic");

    when(matchingService.autoMatch(any(MatchingRequest.class))).thenReturn(new ArrayList<>());

    mockMvc.perform(post("/api/matchings/auto")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(0));
  }
}
