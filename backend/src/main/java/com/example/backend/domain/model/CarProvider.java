package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class CarProvider extends User {
    private String contactInfo;

    @OneToMany(mappedBy = "provider")
    private List<Car> cars;
}
