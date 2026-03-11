package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CarTest {

    @Test
    void testCreation() {
        Car car = new Car();
        assertNotNull(car);
    }
}
