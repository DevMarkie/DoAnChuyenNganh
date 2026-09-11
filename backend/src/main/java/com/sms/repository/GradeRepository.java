package com.sms.repository;

import com.sms.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    Optional<Grade> findByEnrollmentId(Long enrollmentId);

    @Query("SELECT g FROM Grade g " +
           "JOIN FETCH g.enrollment e " +
           "JOIN FETCH e.student " +
           "WHERE e.section.id = :sectionId")
    List<Grade> findBySectionId(@Param("sectionId") Long sectionId);

    @Query("SELECT g FROM Grade g " +
           "JOIN FETCH g.enrollment e " +
           "JOIN FETCH e.section cs " +
           "JOIN FETCH cs.subject " +
           "JOIN FETCH cs.semester " +
           "WHERE e.student.id = :studentId AND g.isFinalized = true")
    List<Grade> findFinalizedByStudentId(@Param("studentId") Long studentId);
}
