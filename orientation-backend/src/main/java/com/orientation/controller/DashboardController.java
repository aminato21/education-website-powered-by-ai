package com.orientation.controller;

import com.orientation.model.Task;
import com.orientation.model.Subject;
import com.orientation.model.Exam;
import com.orientation.model.enums.TaskStatus;
import com.orientation.repository.TaskRepository;
import com.orientation.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    private Long getUserId(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isEmpty())
            return null;
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping("/summary")
    public Map<String, Object> getDashboardSummary(HttpServletRequest request) {
        Long userId = getUserId(request);
        Map<String, Object> summary = new HashMap<>();

        if (userId == null)
            return summary;

        List<Task> tasks = taskRepository.findByUserId(userId);
        List<Subject> subjects = subjectRepository.findByUserId(userId);

        double taskHours = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .mapToDouble(Task::getEstimatedHours).sum();
        double subTaskHours = tasks.stream()
                .flatMap(t -> t.getSubTasks().stream())
                .filter(st -> st.getStatus() == TaskStatus.DONE)
                .mapToDouble(st -> st.getEstimatedHours()).sum();
        summary.put("weeklyHours", taskHours + subTaskHours);

        Map<Integer, Double> yearAverages = subjects.stream()
                .filter(s -> s.getAverage() != null)
                .collect(Collectors.groupingBy(
                        Subject::getYear,
                        Collectors.averagingDouble(Subject::getAverage)));
        summary.put("yearAverages", yearAverages);

        Map<String, Map<Integer, Double>> subjectComparison = subjects.stream()
                .filter(s -> s.getAverage() != null && s.getSubjectKey() != null)
                .collect(Collectors.groupingBy(
                        Subject::getSubjectKey,
                        Collectors.toMap(Subject::getYear, Subject::getAverage, (a, b) -> a)));
        summary.put("subjectComparison", subjectComparison);

        return summary;
    }

    @GetMapping("/upcoming")
    public Map<String, Object> getUpcoming(HttpServletRequest request) {
        Long userId = getUserId(request);
        Map<String, Object> result = new HashMap<>();
        if (userId == null)
            return result;

        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);

        List<Task> allTasks = taskRepository.findByUserId(userId);

        List<Map<String, Object>> upcomingTasks = allTasks.stream()
                .filter(t -> t.getDueDate() != null &&
                        !t.getDueDate().isBefore(today) &&
                        !t.getDueDate().isAfter(nextWeek) &&
                        t.getStatus() != TaskStatus.DONE)
                .sorted((a, b) -> {
                    int priorityA = getPriorityOrder(a.getPriority().name());
                    int priorityB = getPriorityOrder(b.getPriority().name());
                    if (priorityA != priorityB)
                        return priorityA - priorityB;
                    return a.getDueDate().compareTo(b.getDueDate());
                })
                .map(this::taskToMap)
                .collect(Collectors.toList());

        result.put("tasks", upcomingTasks);

        List<Subject> subjects = subjectRepository.findByUserId(userId);
        List<Map<String, Object>> upcomingExams = subjects.stream()
                .flatMap(s -> s.getExams().stream().map(e -> {
                    Map<String, Object> exam = new HashMap<>();
                    exam.put("subjectName", s.getName());
                    exam.put("examName", e.getName());
                    exam.put("date", e.getDate());
                    exam.put("type", e.getType());
                    return exam;
                }))
                .filter(e -> {
                    LocalDate date = (LocalDate) e.get("date");
                    return date != null && !date.isBefore(today) && !date.isAfter(nextWeek);
                })
                .sorted((a, b) -> ((LocalDate) a.get("date")).compareTo((LocalDate) b.get("date")))
                .collect(Collectors.toList());

        result.put("exams", upcomingExams);

        return result;
    }

    @GetMapping("/calendar")
    public List<Map<String, Object>> getCalendarEvents(
            @RequestParam int year,
            @RequestParam int month,
            HttpServletRequest request) {

        Long userId = getUserId(request);
        if (userId == null)
            return List.of();

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);

        List<Map<String, Object>> events = new ArrayList<>();

        List<Task> tasks = taskRepository.findByUserId(userId);
        for (Task t : tasks) {
            if (t.getDueDate() != null &&
                    !t.getDueDate().isBefore(start) &&
                    !t.getDueDate().isAfter(end)) {
                Map<String, Object> event = new HashMap<>();
                event.put("type", "task");
                event.put("date", t.getDueDate());
                event.put("title", t.getTitle());
                event.put("priority", t.getPriority());
                event.put("status", t.getStatus());
                event.put("taskId", t.getId());
                events.add(event);
            }

            if (t.getSubTasks() != null) {
                for (var st : t.getSubTasks()) {
                    if (st.getDueDate() != null &&
                            !st.getDueDate().isBefore(start) &&
                            !st.getDueDate().isAfter(end)) {
                        Map<String, Object> event = new HashMap<>();
                        event.put("type", "subtask");
                        event.put("date", st.getDueDate());
                        event.put("title", "↳ " + st.getTitle());
                        event.put("priority", st.getPriority());
                        event.put("status", st.getStatus());
                        event.put("parentTaskId", t.getId());
                        events.add(event);
                    }
                }
            }
        }

        List<Subject> subjects = subjectRepository.findByUserId(userId);
        for (Subject s : subjects) {
            for (Exam e : s.getExams()) {
                if (e.getDate() != null &&
                        !e.getDate().isBefore(start) &&
                        !e.getDate().isAfter(end)) {
                    Map<String, Object> event = new HashMap<>();
                    event.put("type", "exam");
                    event.put("date", e.getDate());
                    event.put("title", s.getName() + ": " + e.getName());
                    event.put("examType", e.getType());
                    events.add(event);
                }
            }
        }

        return events;
    }

    private int getPriorityOrder(String priority) {
        switch (priority) {
            case "HIGH":
                return 1;
            case "MEDIUM":
                return 2;
            case "LOW":
                return 3;
            default:
                return 4;
        }
    }

    private Map<String, Object> taskToMap(Task t) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", t.getId());
        map.put("title", t.getTitle());
        map.put("dueDate", t.getDueDate());
        map.put("priority", t.getPriority());
        map.put("status", t.getStatus());
        map.put("estimatedHours", t.getEstimatedHours());
        return map;
    }
}
