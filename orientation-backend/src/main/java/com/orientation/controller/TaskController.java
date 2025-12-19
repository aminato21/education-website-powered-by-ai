package com.orientation.controller;

import com.orientation.model.Task;
import com.orientation.model.SubTask;
import com.orientation.model.enums.TaskStatus;
import com.orientation.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/{id}")
    public Task getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        return taskRepository.findById(id).map(task -> {
            TaskStatus oldStatus = task.getStatus();
            TaskStatus newStatus = updatedTask.getStatus();

            // Calculate minimum from subtasks
            double subTaskSum = task.getSubTasks().stream().mapToDouble(SubTask::getEstimatedHours).sum();
            double newEstHours = Math.max(updatedTask.getEstimatedHours(), subTaskSum);
            if (newEstHours < 1)
                newEstHours = 1;

            task.setTitle(updatedTask.getTitle());
            task.setDescription(updatedTask.getDescription());
            task.setPriority(updatedTask.getPriority());
            task.setStatus(newStatus);
            task.setEstimatedHours(newEstHours);
            task.setActualHours(updatedTask.getActualHours());
            task.setDueDate(updatedTask.getDueDate());

            // Set completedAt when status changes to DONE
            if (newStatus == TaskStatus.DONE && oldStatus != TaskStatus.DONE) {
                task.setCompletedAt(LocalDate.now());
            } else if (newStatus != TaskStatus.DONE) {
                task.setCompletedAt(null); // Clear if no longer done
            }

            return taskRepository.save(task);
        }).orElseThrow(() -> new RuntimeException("Task not found"));
    }

    @PostMapping("/{id}/subtasks")
    public Task addSubTask(@PathVariable Long id, @RequestBody SubTask subTask) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        subTask.setParentTask(task);
        if (subTask.getStatus() == null)
            subTask.setStatus(TaskStatus.TODO);

        task.getSubTasks().add(subTask);

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
            TaskStatus oldStatus = existing.getStatus();
            TaskStatus newStatus = subTaskUpdates.getStatus();

            existing.setStatus(newStatus);

            // Set completedAt on subtask
            if (newStatus == TaskStatus.DONE && oldStatus != TaskStatus.DONE) {
                existing.setCompletedAt(LocalDate.now());
            } else if (newStatus != TaskStatus.DONE) {
                existing.setCompletedAt(null);
            }

            // Transition Parent to IN_PROGRESS if it was TODO and subtask is now active
            if ((newStatus == TaskStatus.DONE || newStatus == TaskStatus.IN_PROGRESS)
                    && task.getStatus() == TaskStatus.TODO) {
                task.setStatus(TaskStatus.IN_PROGRESS);
            }
        }

        taskRepository.save(task);
        return task;
    }

    // ===== ANALYTICS ENDPOINTS =====

    // Original: Total completed hours (all time)
    @GetMapping("/analytics/hours")
    public Double getTotalStudyHours() {
        Double taskHours = taskRepository.getTotalTaskHours();
        Double subTaskHours = taskRepository.getTotalSubTaskHours();
        return taskHours + subTaskHours;
    }

    // Rolling 7-day hours
    @GetMapping("/analytics/hours/week")
    public Double getWeeklyStudyHours() {
        LocalDate weekAgo = LocalDate.now().minusDays(7);
        List<Task> allTasks = taskRepository.findAll();

        double taskHours = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCompletedAt() != null
                        && !t.getCompletedAt().isBefore(weekAgo))
                .mapToDouble(Task::getEstimatedHours)
                .sum();

        double subTaskHours = allTasks.stream()
                .flatMap(t -> t.getSubTasks().stream())
                .filter(st -> st.getStatus() == TaskStatus.DONE && st.getCompletedAt() != null
                        && !st.getCompletedAt().isBefore(weekAgo))
                .mapToDouble(SubTask::getEstimatedHours)
                .sum();

        return taskHours + subTaskHours;
    }

    // Count of tasks completed in rolling 7 days
    @GetMapping("/analytics/completed/week")
    public Integer getWeeklyCompletedCount() {
        LocalDate weekAgo = LocalDate.now().minusDays(7);
        List<Task> allTasks = taskRepository.findAll();

        long taskCount = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCompletedAt() != null
                        && !t.getCompletedAt().isBefore(weekAgo))
                .count();

        return (int) taskCount;
    }

    // Weekly history (past 8 weeks)
    @GetMapping("/analytics/hours/history")
    public List<Map<String, Object>> getWeeklyHistory() {
        List<Task> allTasks = taskRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        LocalDate today = LocalDate.now();

        for (int i = 0; i < 8; i++) {
            LocalDate weekEnd = today.minusDays(i * 7);
            LocalDate weekStart = weekEnd.minusDays(6);

            double taskHours = allTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCompletedAt() != null)
                    .filter(t -> !t.getCompletedAt().isBefore(weekStart) && !t.getCompletedAt().isAfter(weekEnd))
                    .mapToDouble(Task::getEstimatedHours)
                    .sum();

            double subTaskHours = allTasks.stream()
                    .flatMap(t -> t.getSubTasks().stream())
                    .filter(st -> st.getStatus() == TaskStatus.DONE && st.getCompletedAt() != null)
                    .filter(st -> !st.getCompletedAt().isBefore(weekStart) && !st.getCompletedAt().isAfter(weekEnd))
                    .mapToDouble(SubTask::getEstimatedHours)
                    .sum();

            Map<String, Object> weekData = new HashMap<>();
            weekData.put("weekStart", weekStart.toString());
            weekData.put("weekEnd", weekEnd.toString());
            weekData.put("hours", taskHours + subTaskHours);
            weekData.put("label", String.format("%s - %s",
                    weekStart.getMonth().toString().substring(0, 3) + " " + weekStart.getDayOfMonth(),
                    weekEnd.getMonth().toString().substring(0, 3) + " " + weekEnd.getDayOfMonth()));

            result.add(weekData);
        }

        Collections.reverse(result); // Oldest first
        return result;
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }
}
