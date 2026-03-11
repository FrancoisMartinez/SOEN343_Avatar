package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LearnerTest {

    @Test
    void testCreation() {
        Learner learner = new Learner();
        assertNotNull(learner);
    }
}
