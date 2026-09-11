package com.sms.repository;

import com.sms.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SemesterRepository extends JpaRepository<Semester, Integer> {
    Optional<Semester> findBySemesterCode(String semesterCode);
    boolean existsBySemesterCode(String semesterCode);
    Optional<Semester> findByIsCurrentTrue();
    List<Semester> findByStatus(Semester.SemesterStatus status);
    List<Semester> findAllByOrderByStartDateDesc();
}
