package com.example.backend.infrastructure.repository;

import com.example.backend.domain.model.DrivingRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DrivingRouteRepository extends JpaRepository<DrivingRoute, Long> {
}
