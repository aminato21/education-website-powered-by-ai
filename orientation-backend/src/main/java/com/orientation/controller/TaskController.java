package com.orientation.controller;

import com.orientation.model.Task;
import com.orientation.model.SubTask;
import com.orientation.model.enums.TaskStatus;
import com.orientation.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.orientation.model.enums.TaskPriority;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        // Sort by priority or due date ideally
        return taskRepository.findAll();
    }

    @GetMapping("/{id}")
    public Task getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        // Apply auto-priority escalation on create
        applyAutoPriority(task);
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        return taskRepository.findById(id).map(task -> {
            // Calculate minimum from subtasks
            double subTaskSum = task.getSubTasks().stream().mapToDouble(SubTask::getEstimatedHours).sum();
            double newEstHours = Math.max(updatedTask.getEstimatedHours(), subTaskSum);
            if (newEstHours < 1)
                newEstHours = 1; // Minimum 1 hour

            task.setTitle(updatedTask.getTitle());
            task.setDescription(updatedTask.getDescription());
            task.setPriority(updatedTask.getPriority());
            task.setStatus(updatedTask.getStatus());
            task.setEstimatedHours(newEstHours);
            task.setActualHours(updatedTask.getActualHours());
            task.setDueDate(updatedTask.getDueDate());

            // Apply auto-priority escalation
            applyAutoPriority(task);

            return taskRepository.save(task);
        }).orElseThrow(() -> new RuntimeException("Task not found"));
    }

    // Auto-escalate priority based on due date
    private void applyAutoPriority(Task task) {
        if (task.getDueDate() == null)
            return;

        long daysUntilDue = ChronoUnit.DAYS.between(LocalDate.now(), task.getDueDate());

        // <= 1 day: force HIGH
        if (daysUntilDue <= 1 && task.getPriority() != TaskPriority.HIGH) {
            task.setPriority(TaskPriority.HIGH);
        }
        // <= 3 days and LOW: bump to MEDIUM
        else if (daysUntilDue <= 3 && task.getPriority() == TaskPriority.LOW) {
            task.setPriority(TaskPriority.MEDIUM);
        }
    }

    @PostMapping("/{id}/subtasks")
    public Task addSubTask(@PathVariable Long id, @RequestBody SubTask subTask) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        subTask.setParentTask(task);
        if (subTask.getStatus() == null)
            subTask.setStatus(TaskStatus.TODO);

        task.getSubTasks().add(subTask);

        // Ensure Parent Est Hours is at least the sum of Subtasks
        double totalSubEst = task.getSubTasks().stream().mapToDouble(SubTask::getEstimatedHours).sum();
        if (totalSubEst > task.getEstimatedHours()) {
            task.setEstimatedHours(totalSubEst);
        }

        return taskRepository.save(task);
    }

    @PatchMapping("/{taskId}/subtasks/{subId}")
    public Task updateSubTask(@PathVariable Long taskId, @PathVariable Long subId,
            @RequestBody SubTask subTaskUpdates) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task not found"));

        SubTask existing = task.getSubTasks().stream()
                .filter(st -> st.getId().equals(subId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("SubTask not found"));

        if (subTaskUpdates.getStatus() != null) {
            existing.setStatus(subTaskUpdates.getStatus());
            // Transition Parent to IN_PROGRESS if it was TODO and a subtask is marked DONE
            if (subTaskUpdates.getStatus() == TaskStatus.DONE && task.getStatus() == TaskStatus.TODO) {
                task.setStatus(TaskStatus.IN_PROGRESS);
            }
        }

        // No explicit priority update as field is gone

        taskRepository.save(task);
        return task;
    }

    @GetMapping("/analytics/hours")
    public Double getTotalStudyHours() {
        Double taskHours = taskRepository.getTotalTaskHours();
        Double subTaskHours = taskRepository.getTotalSubTaskHours();
        return taskHours + subTaskHours;
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }
}
