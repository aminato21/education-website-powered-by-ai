package com.orientation.repository;

import com.orientation.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByUserId(Long userId);

    List<Subject> findByUserIdOrderByYearAscNameAsc(Long userId);

    List<Subject> findByYear(int year);

    List<Subject> findAllByOrderByYearAscNameAsc();
}
