package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class TransitRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transitMode;
    private java.time.LocalDateTime departureTime;
    private String arrivalLocation;
    private int walkingDistance;

    @OneToOne(mappedBy = "transitRoute")
    private Learner learner;
    @OneToOne(mappedBy = "transitRoute")
    private Instructor instructor;
}
