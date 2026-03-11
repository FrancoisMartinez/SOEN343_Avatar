package com.example.backend.infrastructure.repository;

import com.example.backend.domain.model.TransitRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransitRouteRepository extends JpaRepository<TransitRoute, Long> {
}
