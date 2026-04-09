package com.example.backend.application.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BookingDtoTest {

    // --- BookingRequest ---

    @Test
    void bookingRequestGettersAndSetters() {
        BookingRequest req = new BookingRequest();
        req.setCarId(1L);
        req.setInstructorId(2L);
        req.setUserId(3L);
        req.setDate("2026-04-10");
        req.setStartTime("10:00");
        req.setDuration(2);
        req.setPricingStrategy("WEEKEND");

        assertEquals(1L, req.getCarId());
        assertEquals(2L, req.getInstructorId());
        assertEquals(3L, req.getUserId());
        assertEquals("2026-04-10", req.getDate());
        assertEquals("10:00", req.getStartTime());
        assertEquals(2, req.getDuration());
        assertEquals("WEEKEND", req.getPricingStrategy());
    }

    // --- BookingResponse ---

    @Test
    void bookingResponseGettersAndSetters() {
        BookingResponse res = new BookingResponse();
        res.setId(1L);
        res.setCarId(2L);
        res.setCarName("Toyota");
        res.setInstructorId(3L);
        res.setInstructorName("Jane");
        res.setUserId(4L);
        res.setDate("2026-04-10");
        res.setStartTime("10:00");
        res.setDuration(2);
        res.setTotalCost(100.0);
        res.setStatus("CONFIRMED");
        res.setLearnerName("John");

        assertEquals(1L, res.getId());
        assertEquals(2L, res.getCarId());
        assertEquals("Toyota", res.getCarName());
        assertEquals(3L, res.getInstructorId());
        assertEquals("Jane", res.getInstructorName());
        assertEquals(4L, res.getUserId());
        assertEquals("2026-04-10", res.getDate());
        assertEquals("10:00", res.getStartTime());
        assertEquals(2, res.getDuration());
        assertEquals(100.0, res.getTotalCost());
        assertEquals("CONFIRMED", res.getStatus());
        assertEquals("John", res.getLearnerName());
    }

    // --- FinishBookingRequest ---

    @Test
    void finishBookingRequestGettersAndSetters() {
        FinishBookingRequest req = new FinishBookingRequest();
        req.setLatitude(45.5);
        req.setLongitude(-73.6);
        req.setLocation("Downtown");
        req.setRating(5);

        assertEquals(45.5, req.getLatitude());
        assertEquals(-73.6, req.getLongitude());
        assertEquals("Downtown", req.getLocation());
        assertEquals(5, req.getRating());
    }

    // --- AnalyticsResponseDTO ---

    @Test
    void analyticsResponseDtoConstructorAndGetters() {
        CarUtilizationDTO util = new CarUtilizationDTO(1L, "Toyota", 5, 20L, 11.9, 500.0);
        AnalyticsResponseDTO dto = new AnalyticsResponseDTO(List.of(util), 12345L);

        assertEquals(1, dto.getCarUtilizations().size());
        assertEquals(12345L, dto.getTimestamp());
    }

    @Test
    void analyticsResponseDtoSetters() {
        AnalyticsResponseDTO dto = new AnalyticsResponseDTO();
        dto.setCarUtilizations(List.of());
        dto.setTimestamp(99999L);

        assertTrue(dto.getCarUtilizations().isEmpty());
        assertEquals(99999L, dto.getTimestamp());
    }

    // --- CarUtilizationDTO ---

    @Test
    void carUtilizationDtoConstructorAndGetters() {
        CarUtilizationDTO dto = new CarUtilizationDTO(1L, "Honda", 10, 50L, 29.76, 1000.0);

        assertEquals(1L, dto.getCarId());
        assertEquals("Honda", dto.getMakeModel());
        assertEquals(10, dto.getTotalBookings());
        assertEquals(50L, dto.getTotalBookingHours());
        assertEquals(29.76, dto.getUtilizationPercentage());
        assertEquals(1000.0, dto.getTotalRevenue());
    }

    @Test
    void carUtilizationDtoSetters() {
        CarUtilizationDTO dto = new CarUtilizationDTO();
        dto.setCarId(2L);
        dto.setMakeModel("BMW");
        dto.setTotalBookings(5);
        dto.setTotalBookingHours(25L);
        dto.setUtilizationPercentage(14.88);
        dto.setTotalRevenue(750.0);

        assertEquals(2L, dto.getCarId());
        assertEquals("BMW", dto.getMakeModel());
    }

    // --- DashboardAnalyticsDTO ---

    @Test
    void dashboardAnalyticsDtoConstructorAndGetters() {
        var stats = new java.util.HashMap<String, Object>();
        stats.put("key", "value");
        var charts = new java.util.HashMap<String, java.util.Map<String, Number>>();

        DashboardAnalyticsDTO dto = new DashboardAnalyticsDTO(stats, charts);

        assertEquals("value", dto.getStats().get("key"));
        assertNotNull(dto.getCharts());
    }

    @Test
    void dashboardAnalyticsDtoSetters() {
        DashboardAnalyticsDTO dto = new DashboardAnalyticsDTO();
        dto.setStats(new java.util.HashMap<>());
        dto.setCharts(new java.util.HashMap<>());

        assertNotNull(dto.getStats());
        assertNotNull(dto.getCharts());
    }

    // --- InstructorDto ---

    @Test
    void instructorDtoConstructorAndGetters() {
        InstructorDto dto = new InstructorDto(1L, "Jane", 50.0, 10.0, 4.5, 45.5, -73.6);

        assertEquals(1L, dto.getId());
        assertEquals("Jane", dto.getFullName());
        assertEquals(50.0, dto.getHourlyRate());
        assertEquals(10.0, dto.getTravelRadius());
        assertEquals(4.5, dto.getRating());
        assertEquals(45.5, dto.getLatitude());
        assertEquals(-73.6, dto.getLongitude());
    }

    @Test
    void instructorDtoSetters() {
        InstructorDto dto = new InstructorDto();
        dto.setId(2L);
        dto.setFullName("Bob");
        dto.setHourlyRate(60.0);
        dto.setTravelRadius(15.0);
        dto.setRating(3.8);
        dto.setLatitude(40.0);
        dto.setLongitude(-74.0);

        assertEquals(2L, dto.getId());
        assertEquals("Bob", dto.getFullName());
    }

    // --- TransportMode enum ---

    @Test
    void transportModeHasAllValues() {
        assertEquals(4, TransportMode.values().length);
        assertNotNull(TransportMode.DRIVING);
        assertNotNull(TransportMode.BICYCLE);
        assertNotNull(TransportMode.WALK);
        assertNotNull(TransportMode.BUS);
    }

    // --- ParkingSpot record ---

    @Test
    void parkingSpotRecord() {
        ParkingSpot spot = new ParkingSpot("Lot A", 45.5, -73.6);
        assertEquals("Lot A", spot.name());
        assertEquals(45.5, spot.lat());
        assertEquals(-73.6, spot.lon());
    }

    // --- RouteResult record ---

    @Test
    void routeResultRecord() {
        RouteResult result = new RouteResult(
                List.of(new double[]{45.5, -73.6}),
                10.5,
                15,
                TransportMode.DRIVING,
                List.of()
        );
        assertEquals(10.5, result.distanceKm());
        assertEquals(15, result.durationMin());
        assertEquals(TransportMode.DRIVING, result.mode());
        assertEquals(1, result.polyline().size());
    }

    // --- JourneyLeg record ---

    @Test
    void journeyLegFullConstructor() {
        JourneyLeg leg = new JourneyLeg("TRANSIT", "80", "bus", "Stop A", "Stop B", 15,
                List.of(new double[]{45.5, -73.6}), "Take bus 80", 2.5, List.of("Board at Stop A"));

        assertEquals("TRANSIT", leg.type());
        assertEquals("80", leg.lineLabel());
        assertEquals("bus", leg.transportMode());
        assertEquals(15, leg.durationMin());
        assertEquals("Take bus 80", leg.instruction());
        assertEquals(2.5, leg.distanceKm());
        assertEquals(1, leg.subSteps().size());
    }

    @Test
    void journeyLegCompactConstructor() {
        JourneyLeg leg = new JourneyLeg("WALK", null, null, null, null, 5,
                List.of(new double[]{45.5, -73.6}));

        assertEquals("WALK", leg.type());
        assertEquals(5, leg.durationMin());
        assertNull(leg.instruction());
        assertNull(leg.distanceKm());
        assertTrue(leg.subSteps().isEmpty());
    }

    @Test
    void journeyLegMidConstructor() {
        JourneyLeg leg = new JourneyLeg("STEP", null, null, null, null, 3,
                List.of(new double[]{45.5, -73.6}), "Turn right", 0.5);

        assertEquals("STEP", leg.type());
        assertEquals("Turn right", leg.instruction());
        assertEquals(0.5, leg.distanceKm());
    }
}
