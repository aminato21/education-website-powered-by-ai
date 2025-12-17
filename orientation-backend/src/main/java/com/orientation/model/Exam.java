package com.orientation.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // e.g. "Quiz 1", "Midterm", "Final"

    private String type; // "Quiz", "Midterm", "Final", "Assignment"

    private LocalDate date;

    private double grade; // Score obtained (e.g. 15)

    private double maxGrade; // Maximum possible (e.g. 20)

    @ManyToOne
    @JoinColumn(name = "subject_id")
    @JsonBackReference
    private Subject subject;
}
