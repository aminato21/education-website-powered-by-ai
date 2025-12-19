package com.orientation.controller;

import com.orientation.model.Subject;
import com.orientation.model.Exam;
import com.orientation.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = "*")
public class GradeController {

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

    // ===== SUBJECTS =====

    @GetMapping("/subjects")
    public List<Subject> getAllSubjects(HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null)
            return List.of();
        return subjectRepository.findByUserIdOrderByYearAscNameAsc(userId);
    }

    @GetMapping("/subjects/year/{year}")
    public List<Subject> getSubjectsByYear(@PathVariable int year, HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null)
            return List.of();
        return subjectRepository.findByUserId(userId).stream()
                .filter(s -> s.getYear() == year)
                .collect(Collectors.toList());
    }

    @PostMapping("/subjects")
    public Subject createSubject(@RequestBody Subject subject, HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null)
            return null;
        subject.setUserId(userId);
        return subjectRepository.save(subject);
    }

    @PutMapping("/subjects/{id}")
    public Subject updateSubject(@PathVariable Long id, @RequestBody Subject updated, HttpServletRequest request) {
        Long userId = getUserId(request);
        return subjectRepository.findById(id).map(subject -> {
            if (userId == null || !userId.equals(subject.getUserId()))
                return null;
            subject.setSubjectKey(updated.getSubjectKey());
            subject.setName(updated.getName());
            subject.setYear(updated.getYear());
            subject.setTeacher(updated.getTeacher());
            subject.setAbsenceDays(updated.getAbsenceDays());
            return subjectRepository.save(subject);
        }).orElseThrow(() -> new RuntimeException("Subject not found"));
    }

    @DeleteMapping("/subjects/{id}")
    public void deleteSubject(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserId(request);
        subjectRepository.findById(id).ifPresent(subject -> {
            if (userId != null && userId.equals(subject.getUserId())) {
                subjectRepository.deleteById(id);
            }
        });
    }

    // ===== EXAMS =====

    @PostMapping("/subjects/{subjectId}/exams")
    public Subject addExam(@PathVariable Long subjectId, @RequestBody Exam exam) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        exam.setSubject(subject);
        subject.getExams().add(exam);
        return subjectRepository.save(subject);
    }

    @PutMapping("/subjects/{subjectId}/exams/{examId}")
    public Subject updateExam(@PathVariable Long subjectId, @PathVariable Long examId, @RequestBody Exam updated) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Exam exam = subject.getExams().stream()
                .filter(e -> e.getId().equals(examId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        exam.setName(updated.getName());
        exam.setType(updated.getType());
        exam.setDate(updated.getDate());
        exam.setGrade(updated.getGrade());
        exam.setMaxGrade(updated.getMaxGrade());

        return subjectRepository.save(subject);
    }

    @DeleteMapping("/subjects/{subjectId}/exams/{examId}")
    public Subject deleteExam(@PathVariable Long subjectId, @PathVariable Long examId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        subject.getExams().removeIf(e -> e.getId().equals(examId));
        return subjectRepository.save(subject);
    }

    // ===== ANALYTICS =====

    @GetMapping("/analytics/year-averages")
    public Map<Integer, Double> getYearAverages(HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null)
            return Map.of();
        List<Subject> subjects = subjectRepository.findByUserId(userId);

        return subjects.stream()
                .filter(s -> s.getAverage() != null)
                .collect(Collectors.groupingBy(
                        Subject::getYear,
                        Collectors.averagingDouble(Subject::getAverage)));
    }

    @GetMapping("/analytics/year/{year}/ml-data")
    public Map<String, Object> getYearMLData(@PathVariable int year, HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null)
            return Map.of();
        List<Subject> subjects = subjectRepository.findByUserId(userId).stream()
                .filter(s -> s.getYear() == year)
                .collect(Collectors.toList());

        Map<String, Object> result = new java.util.HashMap<>();

        Map<String, Double> subjectAverages = subjects.stream()
                .filter(s -> s.getAverage() != null && Subject.ML_SUBJECTS.contains(s.getSubjectKey()))
                .collect(Collectors.toMap(
                        Subject::getSubjectKey,
                        Subject::getAverage,
                        (a, b) -> a));
        result.put("subjectAverages", subjectAverages);

        int totalAbsences = subjects.stream().mapToInt(Subject::getAbsenceDays).sum();
        result.put("totalAbsences", totalAbsences);

        return result;
    }
}
