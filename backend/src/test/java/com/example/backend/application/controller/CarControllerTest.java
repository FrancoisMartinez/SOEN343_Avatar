package com.example.backend.application.controller;

import com.example.backend.application.dto.CarDto;
import com.example.backend.application.dto.CarRequest;
import com.example.backend.domain.service.CarService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CarControllerTest {

    @Test
    void listCarsReturnsOkWithCars() {
        CarService carService = mock(CarService.class);
        CarController controller = new CarController(carService);
        List<CarDto> cars = List.of(new CarDto(1L, "Civic", "AUTO", "Montreal", 45.0, -73.0, true, 40.0));

        when(carService.getCarsByProvider(2L)).thenReturn(cars);

        ResponseEntity<List<CarDto>> response = controller.listCars(2L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void createCarReturnsNotFoundWhenServiceThrows() {
        CarService carService = mock(CarService.class);
        CarController controller = new CarController(carService);
        CarRequest request = new CarRequest();

        when(carService.createCar(2L, request)).thenThrow(new RuntimeException("provider not found"));

        ResponseEntity<?> response = controller.createCar(2L, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}