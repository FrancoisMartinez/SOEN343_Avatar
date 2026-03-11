package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Car {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String makeModel;
    private String transmissionType;
    private String location;
    private boolean isAvailable;
    private String accessibilityFeatures;
    private double hourlyRate;

    @ManyToOne
    private CarProvider provider;
    @OneToMany(mappedBy = "car")
    private List<Booking> bookings;
}
