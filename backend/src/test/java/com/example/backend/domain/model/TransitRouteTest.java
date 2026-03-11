package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class TransitRouteTest {

    @Test
    void testCreation() {
        TransitRoute transitroute = new TransitRoute();
        assertNotNull(transitroute);
    }
}
