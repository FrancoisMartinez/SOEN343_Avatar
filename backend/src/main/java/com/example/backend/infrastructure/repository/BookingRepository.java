package com.example.backend.infrastructure.repository;

import com.example.backend.domain.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /** Find all bookings for a specific car on a given date (excluding cancelled) */
    @Query("SELECT b FROM Booking b WHERE b.car.id = :carId AND b.date = :date AND b.status <> 'CANCELLED'")
    List<Booking> findActiveBookingsByCarAndDate(@Param("carId") Long carId, @Param("date") LocalDate date);

    /** Find all bookings for a learner, ordered by date descending */
    List<Booking> findByLearnerIdOrderByDateDesc(Long learnerId);

    List<Booking> findByCarId(Long carId);

    /** Find all bookings for cars owned by a specific provider, ordered by date descending */
    @Query("SELECT b FROM Booking b WHERE b.car.provider.id = :providerId ORDER BY b.date DESC")
    List<Booking> findByProviderIdOrderByDateDesc(@Param("providerId") Long providerId);
}
