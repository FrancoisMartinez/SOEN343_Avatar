package com.example.backend.application.controller;

import com.example.backend.application.dto.InstructorDto;
import com.example.backend.application.dto.WeeklyAvailabilityResponse;
import com.example.backend.domain.service.AvailabilityService;
import com.example.backend.domain.service.InstructorService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InstructorController.class)
@AutoConfigureMockMvc(addFilters = false)
class InstructorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InstructorService instructorService;

    @MockitoBean
    private AvailabilityService availabilityService;

    @MockitoBean
    private ApiRequestMetricsStore apiRequestMetricsStore;

    @Test
    void searchInstructorsReturnsResults() throws Exception {
        InstructorDto dto = new InstructorDto(1L, "Jane Doe", 50.0, 10.0, 4.5, 45.5, -73.6);
        when(instructorService.searchInstructors(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/instructors/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Jane Doe"))
                .andExpect(jsonPath("$[0].hourlyRate").value(50.0));
    }

    @Test
    void searchInstructorsWithFilters() throws Exception {
        when(instructorService.searchInstructors(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/instructors/search")
                        .param("minPrice", "30")
                        .param("maxPrice", "80")
                        .param("dayOfWeek", "MONDAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getInstructorAvailability() throws Exception {
        WeeklyAvailabilityResponse response = new WeeklyAvailabilityResponse();
        response.setSlots(List.of());
        when(availabilityService.getWeeklyInstructorAvailability(1L)).thenReturn(response);

        mockMvc.perform(get("/api/instructors/1/availability"))
                .andExpect(status().isOk());
    }

    @Test
    void replaceInstructorAvailability() throws Exception {
        WeeklyAvailabilityResponse response = new WeeklyAvailabilityResponse();
        response.setSlots(List.of());
        when(availabilityService.replaceWeeklyInstructorAvailability(eq(1L), any())).thenReturn(response);

        mockMvc.perform(put("/api/instructors/1/availability")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slots\":[]}"))
                .andExpect(status().isOk());
    }
}
