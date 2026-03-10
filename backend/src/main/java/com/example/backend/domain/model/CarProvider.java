package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class CarProvider extends User {
    private String contactInfo;

    @OneToMany(mappedBy = "provider")
    private List<Car> cars;

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public List<Car> getCars() {
        return cars;
    }

    public void setCars(List<Car> cars) {
        this.cars = cars;
    }
}
