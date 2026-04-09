package com.example.backend.application.controller;

import com.example.backend.application.dto.CarDto;
import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.service.CarService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.DayOfWeek;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CarSearchController.class)
@AutoConfigureMockMvc(addFilters = false)
class CarSearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CarService carService;

    @MockitoBean
    private AvailabilitySlotRepository availabilitySlotRepository;

    @MockitoBean
    private ApiRequestMetricsStore apiRequestMetricsStore;

    @Test
    void searchCarsReturnsResults() throws Exception {
        CarDto dto = new CarDto(1L, "Toyota Corolla", "AUTOMATIC", "Montreal", 45.5, -73.6, true, 50.0);
        when(carService.searchCars(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/cars/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].makeModel").value("Toyota Corolla"));
    }

    @Test
    void searchCarsWithFilters() throws Exception {
        when(carService.searchCars(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/cars/search")
                        .param("transmissionType", "AUTOMATIC")
                        .param("minPrice", "20")
                        .param("maxPrice", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getCarAvailability() throws Exception {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setId(1L);
        slot.setDayOfWeek(DayOfWeek.MONDAY);
        slot.setStartMinute(480);
        slot.setEndMinute(1080);
        slot.setAvailable(true);

        when(availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(1L))
                .thenReturn(List.of(slot));

        mockMvc.perform(get("/api/cars/1/availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carId").value(1))
                .andExpect(jsonPath("$.slots[0].dayOfWeek").value("MONDAY"))
                .andExpect(jsonPath("$.slots[0].startTime").value("08:00"))
                .andExpect(jsonPath("$.slots[0].endTime").value("18:00"));
    }
}
