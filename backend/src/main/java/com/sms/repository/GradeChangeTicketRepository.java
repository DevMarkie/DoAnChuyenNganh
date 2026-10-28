package com.sms.repository;

import com.sms.entity.GradeChangeTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface GradeChangeTicketRepository extends JpaRepository<GradeChangeTicket, Long> {

    @Query("SELECT t FROM GradeChangeTicket t " +
            "JOIN FETCH t.student s " +
            "LEFT JOIN FETCH s.classEntity " +
            "JOIN FETCH t.classSection cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department d " +
            "LEFT JOIN FETCH d.headLecturer hl " +
            "JOIN FETCH cs.semester sem " +
            "LEFT JOIN FETCH cs.lecturer l " +
            "LEFT JOIN FETCH t.createdBy cb " +
            "LEFT JOIN FETCH t.deptReviewer dr " +
            "LEFT JOIN FETCH t.approvedBy ab " +
            "WHERE t.id = :id")
    Optional<GradeChangeTicket> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT t FROM GradeChangeTicket t " +
            "JOIN FETCH t.student s " +
            "LEFT JOIN FETCH s.classEntity " +
            "JOIN FETCH t.classSection cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department d " +
            "LEFT JOIN FETCH d.headLecturer hl " +
            "JOIN FETCH cs.semester sem " +
            "LEFT JOIN FETCH cs.lecturer l " +
            "LEFT JOIN FETCH t.createdBy cb " +
            "LEFT JOIN FETCH t.deptReviewer dr " +
            "LEFT JOIN FETCH t.approvedBy ab " +
            "ORDER BY t.createdAt DESC")
    List<GradeChangeTicket> findAllWithDetails();

    @Query("SELECT t FROM GradeChangeTicket t " +
            "JOIN FETCH t.student s " +
            "LEFT JOIN FETCH s.classEntity " +
            "JOIN FETCH t.classSection cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department d " +
            "LEFT JOIN FETCH d.headLecturer hl " +
            "JOIN FETCH cs.semester sem " +
            "LEFT JOIN FETCH cs.lecturer l " +
            "LEFT JOIN FETCH t.createdBy cb " +
            "LEFT JOIN FETCH t.deptReviewer dr " +
            "LEFT JOIN FETCH t.approvedBy ab " +
            "WHERE t.createdBy.id = :userId " +
            "ORDER BY t.createdAt DESC")
    List<GradeChangeTicket> findByCreatedByIdWithDetails(@Param("userId") Long userId);

    @Query("SELECT t FROM GradeChangeTicket t " +
            "JOIN FETCH t.student s " +
            "LEFT JOIN FETCH s.classEntity " +
            "JOIN FETCH t.classSection cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department d " +
            "LEFT JOIN FETCH d.headLecturer hl " +
            "JOIN FETCH cs.semester sem " +
            "LEFT JOIN FETCH cs.lecturer l " +
            "LEFT JOIN FETCH t.createdBy cb " +
            "LEFT JOIN FETCH t.deptReviewer dr " +
            "LEFT JOIN FETCH t.approvedBy ab " +
            "WHERE cs.id = :sectionId " +
            "ORDER BY t.createdAt DESC")
    List<GradeChangeTicket> findBySectionIdWithDetails(@Param("sectionId") Long sectionId);

    @Query("SELECT t FROM GradeChangeTicket t " +
            "JOIN FETCH t.student s " +
            "LEFT JOIN FETCH s.classEntity " +
            "JOIN FETCH t.classSection cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department d " +
            "LEFT JOIN FETCH d.headLecturer hl " +
            "JOIN FETCH cs.semester sem " +
            "LEFT JOIN FETCH cs.lecturer l " +
            "LEFT JOIN FETCH t.createdBy cb " +
            "LEFT JOIN FETCH t.deptReviewer dr " +
            "LEFT JOIN FETCH t.approvedBy ab " +
            "WHERE s.id = :studentId " +
            "ORDER BY t.createdAt DESC")
    List<GradeChangeTicket> findByStudentIdWithDetails(@Param("studentId") Long studentId);

    boolean existsByClassSectionIdAndStudentIdAndComponentTypeAndStatusIn(
            Long classSectionId,
            Long studentId,
            GradeChangeTicket.ComponentType componentType,
            Collection<GradeChangeTicket.TicketStatus> statuses
    );
}
