package com.example.backend.infrastructure.repository;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UserRepositoryTest {

    @Test
    void repositoryDeclaresCustomMethods() throws NoSuchMethodException {
        Method findByEmail = UserRepository.class.getMethod("findByEmail", String.class);
        Method existsByEmail = UserRepository.class.getMethod("existsByEmail", String.class);

        assertEquals(Optional.class, findByEmail.getReturnType());
        assertEquals(boolean.class, existsByEmail.getReturnType());
    }
}