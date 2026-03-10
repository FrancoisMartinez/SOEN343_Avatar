package com.example.backend.infrastructure.repository;

import com.example.backend.domain.model.CarProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CarProviderRepository extends JpaRepository<CarProvider, Long> {
}
