package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Learner extends User {
    private String experienceLevel;
    private String preferences;
    private int age;

    @OneToMany(mappedBy = "learner")
    private List<Booking> bookings;
    @OneToOne
    private TransitRoute transitRoute;
}
