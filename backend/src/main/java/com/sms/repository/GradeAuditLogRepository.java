package com.sms.repository;

import com.sms.entity.GradeAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface GradeAuditLogRepository extends JpaRepository<GradeAuditLog, Long> {

    @EntityGraph(attributePaths = {"grade", "examRoom", "changedBy", "ticket", "student"})
    List<GradeAuditLog> findByGradeIdOrderByCreatedAtDesc(Long gradeId);

    @EntityGraph(attributePaths = {"grade", "examRoom", "changedBy", "ticket", "student"})
    List<GradeAuditLog> findByExamRoomIdOrderByCreatedAtDesc(Long examRoomId);

    @EntityGraph(attributePaths = {"grade", "examRoom", "changedBy", "ticket", "student"})
    List<GradeAuditLog> findByTicketIdOrderByCreatedAtDesc(Long ticketId);

    @EntityGraph(attributePaths = {"grade", "examRoom", "changedBy", "ticket", "student"})
    List<GradeAuditLog> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"grade", "examRoom", "changedBy", "ticket", "student"})
    @Query("SELECT l FROM GradeAuditLog l WHERE l.grade.enrollment.section.id = :sectionId ORDER BY l.createdAt DESC")
    List<GradeAuditLog> findBySectionIdOrderByCreatedAtDesc(@Param("sectionId") Long sectionId);

    @EntityGraph(attributePaths = {"grade", "grade.enrollment", "grade.enrollment.section", "grade.enrollment.section.subject", "examRoom", "changedBy", "ticket", "student"})
    @Query("SELECT l FROM GradeAuditLog l WHERE " +
           "(:studentCode IS NULL OR LOWER(l.student.studentCode) LIKE LOWER(CONCAT('%', :studentCode, '%'))) AND " +
           "(:component IS NULL OR l.component = :component) AND " +
           "(:sectionId IS NULL OR l.grade.enrollment.section.id = :sectionId) AND " +
           "(:startDate IS NULL OR l.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR l.createdAt <= :endDate) " +
           "ORDER BY l.createdAt DESC")
    Page<GradeAuditLog> searchLogs(
            @Param("studentCode") String studentCode,
            @Param("component") String component,
            @Param("sectionId") Long sectionId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
