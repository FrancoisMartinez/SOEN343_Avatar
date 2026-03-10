package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime endTime;
    private String status;
    private String pickupLocation;

    @ManyToOne
    private Learner learner;
    @ManyToOne
    private Instructor instructor;
    @ManyToOne
    private Car car;
    @OneToOne
    private DrivingRoute drivingRoute;
}
