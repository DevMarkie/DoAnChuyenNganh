package com.sms.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.sms.entity.AttendanceRecord;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySessionId(Long sessionId);
    
    @Query("SELECT COUNT(ar) FROM AttendanceRecord ar WHERE ar.enrollment.id = :enrollmentId AND ar.isPresent = false")
    int countAbsencesByEnrollmentId(Long enrollmentId);
}
