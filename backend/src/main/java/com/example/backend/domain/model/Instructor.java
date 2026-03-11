package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Instructor extends User {
    private int yearsLicensed;
    private double travelRadius;
    private double rating;
    private double hourlyRate;

    @OneToMany(mappedBy = "instructor")
    private List<Booking> bookings;
    @OneToOne
    private TransitRoute transitRoute;
}
