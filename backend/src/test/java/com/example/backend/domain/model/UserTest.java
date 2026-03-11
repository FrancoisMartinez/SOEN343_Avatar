package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    void testCreation() {
        User user = new Learner(); // User is abstract
        assertNotNull(user);
    }
}
