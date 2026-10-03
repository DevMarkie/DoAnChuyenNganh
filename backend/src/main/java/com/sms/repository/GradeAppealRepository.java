package com.sms.repository;

import com.sms.entity.GradeAppeal;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GradeAppealRepository extends JpaRepository<GradeAppeal, Long> {
    @Query("SELECT a FROM GradeAppeal a JOIN FETCH a.enrollment e JOIN FETCH e.student " +
            "JOIN FETCH e.section cs JOIN FETCH cs.subject JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH a.reviewer WHERE a.student.id = :studentId ORDER BY a.createdAt DESC")
    List<GradeAppeal> findByStudentIdWithDetails(@Param("studentId") Long studentId);

    @Query("SELECT a FROM GradeAppeal a JOIN FETCH a.enrollment e JOIN FETCH e.student " +
            "JOIN FETCH e.section cs JOIN FETCH cs.subject JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH a.reviewer ORDER BY a.createdAt DESC")
    List<GradeAppeal> findAllWithDetails();

    long countByStudentIdAndEnrollmentSectionSubjectIdAndStatus(
            Long studentId, Integer subjectId, GradeAppeal.AppealStatus status);
}
