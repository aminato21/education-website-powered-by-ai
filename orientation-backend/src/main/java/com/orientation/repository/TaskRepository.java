package com.orientation.repository;

import com.orientation.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.estimatedHours), 0) FROM Task t WHERE t.status = 'DONE'")
    Double getTotalTaskHours();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(st.estimatedHours), 0) FROM SubTask st WHERE st.status = 'DONE'")
    Double getTotalSubTaskHours();
}
