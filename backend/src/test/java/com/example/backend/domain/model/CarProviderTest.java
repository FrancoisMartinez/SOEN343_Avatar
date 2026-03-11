package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CarProviderTest {

    @Test
    void testCreation() {
        CarProvider carprovider = new CarProvider();
        assertNotNull(carprovider);
    }
}
