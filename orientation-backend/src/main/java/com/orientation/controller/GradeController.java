package com.orientation.controller;

import com.orientation.model.Subject;
import com.orientation.model.Exam;
import com.orientation.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = "*")
public class GradeController {

    @Autowired
    private SubjectRepository subjectRepository;

    // ===== SUBJECTS =====

    @GetMapping("/subjects")
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAllByOrderByYearAscNameAsc();
    }

    @GetMapping("/subjects/year/{year}")
    public List<Subject> getSubjectsByYear(@PathVariable int year) {
        return subjectRepository.findByYear(year);
    }

    @PostMapping("/subjects")
    public Subject createSubject(@RequestBody Subject subject) {
        return subjectRepository.save(subject);
    }

    @PutMapping("/subjects/{id}")
    public Subject updateSubject(@PathVariable Long id, @RequestBody Subject updated) {
        return subjectRepository.findById(id).map(subject -> {
            subject.setSubjectKey(updated.getSubjectKey());
            subject.setName(updated.getName());
            subject.setYear(updated.getYear());
            subject.setTeacher(updated.getTeacher());
            return subjectRepository.save(subject);
        }).orElseThrow(() -> new RuntimeException("Subject not found"));
    }

    @DeleteMapping("/subjects/{id}")
    public void deleteSubject(@PathVariable Long id) {
        subjectRepository.deleteById(id);
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
    public Map<Integer, Double> getYearAverages() {
        List<Subject> subjects = subjectRepository.findAll();

        return subjects.stream()
                .filter(s -> s.getAverage() != null)
                .collect(Collectors.groupingBy(
                        Subject::getYear,
                        Collectors.averagingDouble(Subject::getAverage)));
    }
}
