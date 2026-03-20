package com.example.backend.infrastructure.repository;

import com.example.backend.domain.model.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByCarIdOrderByDayOfWeekAscStartMinuteAsc(Long carId);

    void deleteByCarId(Long carId);
}
