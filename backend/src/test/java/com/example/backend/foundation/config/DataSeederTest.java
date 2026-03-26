package com.example.backend.foundation.config;

import com.example.backend.infrastructure.repository.CarRepository;
import com.example.backend.infrastructure.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DataSeederTest {

    @Test
    void seedUsersCreatesUsersWhenRepositoryIsEmpty() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        CarRepository carRepository = mock(CarRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        DataSeeder dataSeeder = new DataSeeder();

        when(userRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        CommandLineRunner runner = dataSeeder.seedUsersAndCars(userRepository, carRepository, passwordEncoder);
        runner.run();

        verify(userRepository, times(3)).save(any());
        verify(carRepository, times(1)).saveAll(any());
        verify(passwordEncoder, times(3)).encode("password123");
    }

    @Test
    void seedUsersDoesNothingWhenRepositoryHasData() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        CarRepository carRepository = mock(CarRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        DataSeeder dataSeeder = new DataSeeder();

        when(userRepository.count()).thenReturn(1L);

        CommandLineRunner runner = dataSeeder.seedUsersAndCars(userRepository, carRepository, passwordEncoder);
        runner.run();

        verify(userRepository, never()).save(any());
        verify(carRepository, never()).saveAll(any());
        verify(passwordEncoder, never()).encode(anyString());
    }
}