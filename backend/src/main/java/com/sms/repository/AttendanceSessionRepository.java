package com.sms.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sms.entity.AttendanceSession;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findBySectionIdOrderBySessionDateDesc(Long sectionId);
    Optional<AttendanceSession> findBySectionIdAndSessionDate(Long sectionId, LocalDate sessionDate);
    List<AttendanceSession> findByAttendanceKeywordAndStatus(String attendanceKeyword, String status);
    List<AttendanceSession> findByAttendanceKeywordAndStatusAndSessionDate(String attendanceKeyword, String status, LocalDate sessionDate);
    List<AttendanceSession> findBySectionIdInAndSessionDate(List<Long> sectionIds, LocalDate sessionDate);
}
