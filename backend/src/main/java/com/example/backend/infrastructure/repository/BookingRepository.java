package com.example.backend.infrastructure.repository;

import com.example.backend.domain.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
	List<Booking> findByCarId(Long carId);
}
