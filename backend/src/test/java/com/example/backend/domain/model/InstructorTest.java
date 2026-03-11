package com.example.backend.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class InstructorTest {

    @Test
    void testCreation() {
        Instructor instructor = new Instructor();
        assertNotNull(instructor);
    }
}
