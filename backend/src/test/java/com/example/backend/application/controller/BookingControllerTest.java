package com.example.backend.application.controller;

import com.example.backend.domain.service.BookingService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(BookingController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApiRequestMetricsStore apiRequestMetricsStore;

    @MockitoBean
    private BookingService bookingService;

    @Test
    void contextLoads() {
    }
}
