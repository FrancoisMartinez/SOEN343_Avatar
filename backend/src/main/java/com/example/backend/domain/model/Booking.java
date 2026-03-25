package com.example.backend.domain.model;

import jakarta.persistence.*;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public java.time.LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(java.time.LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public java.time.LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(java.time.LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public Learner getLearner() {
        return learner;
    }

    public void setLearner(Learner learner) {
        this.learner = learner;
    }

    public Instructor getInstructor() {
        return instructor;
    }

    public void setInstructor(Instructor instructor) {
        this.instructor = instructor;
    }

    public Car getCar() {
        return car;
    }

    public void setCar(Car car) {
        this.car = car;
    }

    public DrivingRoute getDrivingRoute() {
        return drivingRoute;
    }

    public void setDrivingRoute(DrivingRoute drivingRoute) {
        this.drivingRoute = drivingRoute;
    }
}
