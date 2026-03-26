package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Learner extends User {
    private String experienceLevel;
    private String preferences;
    private int age;

    @Column(nullable = false)
    private double balance = 0.0;

    @OneToMany(mappedBy = "learner")
    private List<Booking> bookings;
    @OneToOne
    private TransitRoute transitRoute;

    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }
}
