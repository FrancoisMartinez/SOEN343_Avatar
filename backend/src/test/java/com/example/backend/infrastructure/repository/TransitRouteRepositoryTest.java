package com.example.backend.infrastructure.repository;

import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.beans.factory.annotation.Autowired;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class TransitRouteRepositoryTest {

    @Autowired
    private TransitRouteRepository transitRouteRepository;

    @Test
    void contextLoads() {
        assertNotNull(transitRouteRepository);
    }
}
