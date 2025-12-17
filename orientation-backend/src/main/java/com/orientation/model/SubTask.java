package com.orientation.model;

import com.orientation.model.enums.TaskStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subtasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    private String description;

    @Enumerated(EnumType.STRING)
    private com.orientation.model.enums.TaskPriority priority;

    private java.time.LocalDate dueDate;

    // Time spent specifically on this sub-task
    private double completedHours;

    // Estimated time for this sub-task
    private double estimatedHours;

    @ManyToOne
    @JoinColumn(name = "task_id")
    @JsonBackReference // Prevent infinite recursion
    private Task parentTask;
}
