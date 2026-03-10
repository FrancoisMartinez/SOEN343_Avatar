package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DrivingRouteTest {

    @Test
    void testCreation() {
        DrivingRoute drivingroute = new DrivingRoute();
        assertNotNull(drivingroute);
    }
}
