package com.sms.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.sms.entity.AttendanceRecord;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySessionId(Long sessionId);
    List<AttendanceRecord> findBySessionIdIn(List<Long> sessionIds);
    Optional<AttendanceRecord> findBySessionIdAndEnrollmentId(Long sessionId, Long enrollmentId);
    
    /** Số buổi vắng của mọi enrollment trong lớp, gộp 1 truy vấn (tránh N+1 ở danh sách lớp). */
    @Query("SELECT ar.enrollment.id, COUNT(ar) FROM AttendanceRecord ar " +
           "WHERE ar.enrollment.section.id = :sectionId AND ar.isPresent = false " +
           "GROUP BY ar.enrollment.id")
    List<Object[]> countAbsencesBySectionId(Long sectionId);

    /** Số buổi vắng theo từng enrollment của một sinh viên, gộp 1 truy vấn (tránh N+1 ở trang cá nhân). */
    @Query("SELECT ar.enrollment.id, COUNT(ar) FROM AttendanceRecord ar " +
           "WHERE ar.enrollment.student.id = :studentId AND ar.isPresent = false " +
           "GROUP BY ar.enrollment.id")
    List<Object[]> countAbsencesByStudentId(Long studentId);
}
