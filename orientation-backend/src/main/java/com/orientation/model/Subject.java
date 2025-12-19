package com.orientation.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subject {

    // Pre-defined ML subjects (no OTHER - only fixed subjects)
    public static final Set<String> ML_SUBJECTS = Set.of(
            "MATH", "PHYSICS", "CHEMISTRY", "BIOLOGY", "ENGLISH", "GEOGRAPHY");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Key for ML mapping (e.g., "MATH", "PHYSICS")
    private String subjectKey;

    private String name; // Display name (e.g. "Mathematics", "Physics")

    private int year; // 1, 2, 3... (academic year)

    private String teacher; // optional

    private int absenceDays = 0; // Days of absence for this subject

    // User ownership
    private Long userId;

    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Exam> exams = new ArrayList<>();

    // Check if this subject counts for ML
    public boolean isMLSubject() {
        return subjectKey != null && ML_SUBJECTS.contains(subjectKey.toUpperCase());
    }

    // Calculate subject average (sum grades / sum maxGrades * 100)
    public Double getAverage() {
        if (exams == null || exams.isEmpty())
            return null;

        double totalGrade = exams.stream().mapToDouble(Exam::getGrade).sum();
        double totalMax = exams.stream().mapToDouble(Exam::getMaxGrade).sum();

        if (totalMax == 0)
            return null;
        return (totalGrade / totalMax) * 100;
    }
}
