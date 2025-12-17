package com.orientation.model;

import com.orientation.model.enums.TaskPriority;
import com.orientation.model.enums.TaskStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskPriority priority;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    // Estimated total time for the parent task
    private double estimatedHours;
    
    // Actual time spent (aggregated usually, or logged directly)
    private double actualHours;

    private LocalDate dueDate;
    
    // Creation date for sorting
    private LocalDate createdAt;

    @OneToMany(mappedBy = "parentTask", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<SubTask> subTasks = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDate.now();
        if (this.status == null) this.status = TaskStatus.TODO;
        if (this.priority == null) this.priority = TaskPriority.MEDIUM;
    }
}
