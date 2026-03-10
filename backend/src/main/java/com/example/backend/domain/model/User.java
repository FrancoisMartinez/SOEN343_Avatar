package com.example.backend.domain.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;
    private String licenseNumber;
    private java.time.LocalDate licenseIssueDate;
    private String licenseRegion;
}
