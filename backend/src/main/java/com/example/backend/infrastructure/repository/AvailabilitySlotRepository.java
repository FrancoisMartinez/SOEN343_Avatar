package com.example.backend.infrastructure.repository;

import com.example.backend.domain.model.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByCarIdOrderByDayOfWeekAscStartMinuteAsc(Long carId);

    @Modifying
    @Transactional
    void deleteByCarId(Long carId);

    List<AvailabilitySlot> findByInstructorIdOrderByDayOfWeekAscStartMinuteAsc(Long instructorId);

    @Modifying
    @Transactional
    void deleteByInstructorId(Long instructorId);
}

