package com.example.backend.application.controller;

import com.example.backend.application.dto.BookingResponse;
import com.example.backend.domain.service.BookingService;
import com.example.backend.foundation.analytics.ApiRequestMetricsStore;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApiRequestMetricsStore apiRequestMetricsStore;

    @MockitoBean
    private BookingService bookingService;

    private BookingResponse createResponse() {
        BookingResponse res = new BookingResponse();
        res.setId(1L);
        res.setCarId(1L);
        res.setCarName("Toyota");
        res.setUserId(1L);
        res.setLearnerName("John");
        res.setDate("2027-06-15");
        res.setStartTime("10:00");
        res.setDuration(2);
        res.setTotalCost(100.0);
        res.setStatus("CONFIRMED");
        return res;
    }

    @Test
    void createBookingReturnsOk() throws Exception {
        when(bookingService.createBooking(any())).thenReturn(createResponse());

        String body = """
                {
                  "carId": 1,
                  "userId": 1,
                  "date": "2027-06-15",
                  "startTime": "10:00",
                  "duration": 2
                }
                """;

        mockMvc.perform(post("/api/bookings")
                .contentType("application/json")
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void createBookingReturnsBadRequestOnError() throws Exception {
        when(bookingService.createBooking(any()))
                .thenThrow(new IllegalArgumentException("Duration must be between 1 and 12 hours"));

        String body = """
                {
                  "carId": 1,
                  "userId": 1,
                  "date": "2027-06-15",
                  "startTime": "10:00",
                  "duration": 0
                }
                """;

        mockMvc.perform(post("/api/bookings")
                .contentType("application/json")
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void getLearnerBookingsReturnsOk() throws Exception {
        when(bookingService.getBookingsForLearner(1L)).thenReturn(List.of(createResponse()));

        mockMvc.perform(get("/api/bookings/learner/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void getProviderBookingsReturnsOk() throws Exception {
        when(bookingService.getBookingsForProvider(10L)).thenReturn(List.of(createResponse()));

        mockMvc.perform(get("/api/bookings/provider/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void getInstructorBookingsReturnsOk() throws Exception {
        when(bookingService.getBookingsForInstructor(5L)).thenReturn(List.of(createResponse()));

        mockMvc.perform(get("/api/bookings/instructor/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void confirmBookingReturnsOk() throws Exception {
        BookingResponse res = createResponse();
        res.setStatus("CONFIRMED");
        when(bookingService.confirmBooking(eq(1L), any())).thenReturn(res);

        mockMvc.perform(put("/api/bookings/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void confirmBookingReturnsBadRequestOnError() throws Exception {
        when(bookingService.confirmBooking(eq(1L), any()))
                .thenThrow(new IllegalStateException("Booking is already confirmed."));

        mockMvc.perform(put("/api/bookings/1/confirm"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancelBookingReturnsOk() throws Exception {
        BookingResponse res = createResponse();
        res.setStatus("CANCELLED");
        when(bookingService.cancelBooking(1L)).thenReturn(res);

        mockMvc.perform(put("/api/bookings/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void cancelBookingReturnsBadRequestOnError() throws Exception {
        when(bookingService.cancelBooking(1L))
                .thenThrow(new IllegalStateException("Cannot cancel"));

        mockMvc.perform(put("/api/bookings/1/cancel"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void finishBookingReturnsOk() throws Exception {
        BookingResponse res = createResponse();
        res.setStatus("FINISHED");
        when(bookingService.finishBooking(eq(1L), any())).thenReturn(res);

        String body = """
                {
                  "latitude": 45.5,
                  "longitude": -73.6,
                  "location": "New Location"
                }
                """;

        mockMvc.perform(put("/api/bookings/1/finish")
                .contentType("application/json")
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FINISHED"));
    }

    @Test
    void finishBookingReturnsBadRequestOnError() throws Exception {
        when(bookingService.finishBooking(eq(1L), any()))
                .thenThrow(new IllegalArgumentException("Insufficient balance"));

        String body = "{}";

        mockMvc.perform(put("/api/bookings/1/finish")
                .contentType("application/json")
                .content(body))
                .andExpect(status().isBadRequest());
    }
}
