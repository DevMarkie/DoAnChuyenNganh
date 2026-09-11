package com.sms.repository;

import com.sms.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findBySectionId(Long sectionId);
    Optional<Enrollment> findByStudentIdAndSectionId(Long studentId, Long sectionId);
    boolean existsByStudentIdAndSectionId(Long studentId, Long sectionId);

    @Query("SELECT e FROM Enrollment e " +
           "JOIN FETCH e.section cs " +
           "JOIN FETCH cs.subject " +
           "JOIN FETCH cs.semester " +
           "JOIN FETCH cs.lecturer " +
           "WHERE e.student.id = :studentId AND e.status != 'CANCELLED'")
    List<Enrollment> findActiveByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT e FROM Enrollment e " +
           "JOIN FETCH e.student s " +
           "WHERE e.section.id = :sectionId AND e.status != 'CANCELLED'")
    List<Enrollment> findActiveBySectionId(@Param("sectionId") Long sectionId);

    @Query("SELECT COALESCE(SUM(cs.subject.credits), 0) FROM Enrollment e " +
           "JOIN e.section cs " +
           "WHERE e.student.id = :studentId AND e.status = 'ENROLLED' " +
           "AND cs.semester.id = :semesterId")
    int countEnrolledCredits(@Param("studentId") Long studentId, @Param("semesterId") Integer semesterId);
}
