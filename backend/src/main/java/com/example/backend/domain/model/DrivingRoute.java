package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class DrivingRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String pathData;
    private int estimatedTime;

    @OneToOne(mappedBy = "drivingRoute")
    private Booking booking;
}
