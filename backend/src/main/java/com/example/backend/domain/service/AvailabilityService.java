package com.example.backend.domain.service;

import com.example.backend.application.dto.*;
import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.model.Car;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.*;

@Service
public class AvailabilityService {
    private final CarRepository carRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;

    public AvailabilityService(CarRepository carRepository, AvailabilitySlotRepository availabilitySlotRepository) {
        this.carRepository = carRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
    }

    public WeeklyAvailabilityResponse getWeeklyAvailability(Long providerId, Long carId) {
        Car car = getOwnedCar(providerId, carId);
        List<AvailabilitySlotDto> slots = availabilitySlotRepository.findByCarIdOrderByDayOfWeekAscStartMinuteAsc(carId)
                .stream()
                .map(this::toDto)
                .toList();

        return new WeeklyAvailabilityResponse(car.getId(), car.isAvailable(), slots);
    }

    @Transactional
    public WeeklyAvailabilityResponse replaceWeeklyAvailability(Long providerId, Long carId,
            WeeklyAvailabilityRequest request) {
        Car car = getOwnedCar(providerId, carId);

        List<SlotWindow> parsedSlots = parseAndValidateSlots(request.getSlots());

        availabilitySlotRepository.deleteByCarId(carId);
        List<AvailabilitySlot> saved = parsedSlots.stream().map(window -> {
            AvailabilitySlot slot = new AvailabilitySlot();
            slot.setCar(car);
            slot.setDayOfWeek(window.dayOfWeek());
            slot.setStartMinute(window.startMinute());
            slot.setEndMinute(window.endMinute());
            slot.setAvailable(window.available());
            return availabilitySlotRepository.save(slot);
        }).toList();

        // Keep legacy boolean in sync with schedule presence.
        car.setAvailable(saved.stream().anyMatch(AvailabilitySlot::isAvailable));
        carRepository.save(car);

        return new WeeklyAvailabilityResponse(car.getId(), car.isAvailable(),
                saved.stream().map(this::toDto).toList());
    }

    private Car getOwnedCar(Long providerId, Long carId) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new RuntimeException("Car not found"));

        if (car.getProvider() == null || !Objects.equals(car.getProvider().getId(), providerId)) {
            throw new RuntimeException("Car not found for provider");
        }

        return car;
    }

    private List<SlotWindow> parseAndValidateSlots(List<AvailabilitySlotRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        List<SlotWindow> windows = new ArrayList<>();
        for (AvailabilitySlotRequest request : requests) {
            if (request == null) {
                throw new RuntimeException("Slot request cannot be null");
            }

            DayOfWeek day = parseDay(request.getDayOfWeek());
            int startMinute = parseTimeToMinutes(request.getStartTime());
            int endMinute = parseTimeToMinutes(request.getEndTime());

            if (startMinute >= endMinute) {
                throw new RuntimeException("Slot start time must be before end time");
            }

            windows.add(new SlotWindow(day, startMinute, endMinute, request.isAvailable()));
        }

        validateNoOverlaps(windows);
        return windows;
    }

    private DayOfWeek parseDay(String dayOfWeek) {
        if (dayOfWeek == null || dayOfWeek.isBlank()) {
            throw new RuntimeException("Day of week is required");
        }
        try {
            return DayOfWeek.valueOf(dayOfWeek.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid day of week: " + dayOfWeek);
        }
    }

    private int parseTimeToMinutes(String time) {
        if (time == null || time.isBlank()) {
            throw new RuntimeException("Time value is required");
        }

        String[] parts = time.trim().split(":");
        if (parts.length != 2) {
            throw new RuntimeException("Time must be in HH:mm format");
        }

        try {
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);

            if (hour == 24 && minute == 0) {
                return 24 * 60;
            }

            if (hour < 0 || hour > 23 || (minute != 0 && minute != 30)) {
                throw new RuntimeException("Time must align to 30-minute boundaries");
            }

            return hour * 60 + minute;
        } catch (NumberFormatException ex) {
            throw new RuntimeException("Time must be in HH:mm format");
        }
    }

    private void validateNoOverlaps(List<SlotWindow> windows) {
        Map<DayOfWeek, List<SlotWindow>> byDay = windows.stream().collect(
                HashMap::new,
                (map, window) -> map.computeIfAbsent(window.dayOfWeek(), key -> new ArrayList<>()).add(window),
                HashMap::putAll);

        for (Map.Entry<DayOfWeek, List<SlotWindow>> entry : byDay.entrySet()) {
            List<SlotWindow> dayWindows = entry.getValue();
            dayWindows.sort(Comparator.comparingInt(SlotWindow::startMinute));

            for (int i = 1; i < dayWindows.size(); i++) {
                SlotWindow previous = dayWindows.get(i - 1);
                SlotWindow current = dayWindows.get(i);
                if (current.startMinute() < previous.endMinute()) {
                    throw new RuntimeException("Overlapping slots found for " + entry.getKey());
                }
            }
        }
    }

    private AvailabilitySlotDto toDto(AvailabilitySlot slot) {
        return new AvailabilitySlotDto(
                slot.getId(),
                slot.getDayOfWeek().name(),
                formatMinutes(slot.getStartMinute()),
                formatMinutes(slot.getEndMinute()),
                slot.isAvailable());
    }

    private String formatMinutes(int minutes) {
        if (minutes == 24 * 60) {
            return "24:00";
        }
        int hour = minutes / 60;
        int minute = minutes % 60;
        return String.format("%02d:%02d", hour, minute);
    }

    private record SlotWindow(DayOfWeek dayOfWeek, int startMinute, int endMinute, boolean available) {
    }
}
