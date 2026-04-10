package com.example.backend.application.controller;

import com.example.backend.application.dto.MatchResult;
import com.example.backend.domain.service.MatchingService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MatchingController.class)
@AutoConfigureMockMvc(addFilters = false)
class MatchingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApiRequestMetricsStore apiRequestMetricsStore;

    @MockitoBean
    private MatchingService matchingService;

    @Test
    void autoMatchReturnsResults() throws Exception {
        MatchResult result = new MatchResult(1L, "Toyota", "AUTOMATIC", "Downtown", 45.5, -73.6, 50.0,
                1L, "Jane", 40.0, 4.5, 45.5, -73.6, 90.0, 95.0, 80.0, 100.0, 91.0, 0.5);

        when(matchingService.autoMatch(any())).thenReturn(List.of(result));

        String body = """
                {
                  "learnerId": 1,
                  "learnerLat": 45.5,
                  "learnerLng": -73.6
                }
                """;

        mockMvc.perform(post("/api/matchings/auto")
                .contentType("application/json")
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].carId").value(1))
                .andExpect(jsonPath("$[0].instructorId").value(1));
    }

    @Test
    void autoMatchReturnsBadRequestOnValidationError() throws Exception {
        when(matchingService.autoMatch(any()))
                .thenThrow(new IllegalArgumentException("learnerId is required"));

        String body = """
                {
                  "learnerLat": 45.5,
                  "learnerLng": -73.6
                }
                """;

        mockMvc.perform(post("/api/matchings/auto")
                .contentType("application/json")
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("learnerId is required"));
    }

    @Test
    void autoMatchReturnsServerErrorOnRuntimeException() throws Exception {
        when(matchingService.autoMatch(any()))
                .thenThrow(new RuntimeException("Unexpected error"));

        String body = """
                {
                  "learnerId": 1,
                  "learnerLat": 45.5,
                  "learnerLng": -73.6
                }
                """;

        mockMvc.perform(post("/api/matchings/auto")
                .contentType("application/json")
                .content(body))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to process auto-match request"));
    }
}
