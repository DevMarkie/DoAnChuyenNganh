package com.sms.repository;

import com.sms.entity.AcademicSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicSummaryRepository extends JpaRepository<AcademicSummary, Long> {
    Optional<AcademicSummary> findByStudentIdAndSemesterId(Long studentId, Integer semesterId);
    Optional<AcademicSummary> findTopByStudentIdOrderBySemesterIdDesc(Long studentId);
    List<AcademicSummary> findBySemesterId(Integer semesterId);
    List<AcademicSummary> findByWarningLevelGreaterThan(int warningLevel);
}
