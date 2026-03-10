package com.example.backend.infrastructure.repository;

import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.beans.factory.annotation.Autowired;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class DrivingRouteRepositoryTest {

    @Autowired
    private DrivingRouteRepository drivingRouteRepository;

    @Test
    void contextLoads() {
        assertNotNull(drivingRouteRepository);
    }
}
