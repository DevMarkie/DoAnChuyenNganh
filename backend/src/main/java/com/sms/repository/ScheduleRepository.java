package com.sms.repository;

import com.sms.entity.Schedule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    @Override
    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    List<Schedule> findAll();

    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    List<Schedule> findBySectionId(Long sectionId);

    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    List<Schedule> findBySectionSemesterId(Long semesterId);

    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    List<Schedule> findByClassEntityId(Integer classId);

    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    @Query("SELECT s FROM Schedule s WHERE s.section.lecturer.id = :lecturerId ORDER BY s.dayOfWeek, s.startPeriod")
    List<Schedule> findByLecturerId(@Param("lecturerId") Long lecturerId);

    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    @Query("SELECT s FROM Schedule s WHERE s.section.lecturer.id = :lecturerId AND s.section.semester.id = :semesterId ORDER BY s.dayOfWeek, s.startPeriod")
    List<Schedule> findByLecturerIdAndSemesterId(@Param("lecturerId") Long lecturerId, @Param("semesterId") Long semesterId);

    /**
     * Lấy toàn bộ lịch học của một sinh viên:
     * 1. Thuộc các lớp học phần sinh viên đã đăng ký (status = ENROLLED hoặc COMPLETED)
     * 2. Hoặc lịch xếp chung cho lớp sinh hoạt của sinh viên
     */
    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    @Query("""
        SELECT DISTINCT s FROM Schedule s
        WHERE s.section.id IN (
            SELECT e.section.id FROM Enrollment e
            WHERE e.student.id = :studentId AND e.status IN ('ENROLLED', 'COMPLETED')
        )
        OR (s.classEntity.id = :classId)
        ORDER BY s.dayOfWeek, s.startPeriod
    """)
    List<Schedule> findSchedulesForStudent(@Param("studentId") Long studentId, @Param("classId") Integer classId);

    /**
     * Lấy lịch học của sinh viên theo học kỳ cụ thể
     */
    @EntityGraph(attributePaths = {"section", "section.subject", "section.lecturer", "section.semester", "classEntity"})
    @Query("""
        SELECT DISTINCT s FROM Schedule s
        WHERE (s.section.id IN (
            SELECT e.section.id FROM Enrollment e
            WHERE e.student.id = :studentId AND e.status IN ('ENROLLED', 'COMPLETED')
        ) OR s.classEntity.id = :classId)
        AND s.section.semester.id = :semesterId
        ORDER BY s.dayOfWeek, s.startPeriod
    """)
    List<Schedule> findSchedulesForStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("classId") Integer classId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Kiểm tra trùng phòng học
     */
    @Query("""
        SELECT s FROM Schedule s
        WHERE s.room = :room
        AND s.dayOfWeek = :dayOfWeek
        AND s.startPeriod <= :endPeriod
        AND s.endPeriod >= :startPeriod
        AND s.startDate <= :endDate
        AND s.endDate >= :startDate
        AND (:excludeId IS NULL OR s.id != :excludeId)
    """)
    List<Schedule> findRoomConflicts(
            @Param("room") String room,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("startPeriod") Integer startPeriod,
            @Param("endPeriod") Integer endPeriod,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId
    );

    /**
     * Kiểm tra trùng giảng viên
     */
    @Query("""
        SELECT s FROM Schedule s
        WHERE s.section.lecturer.id = :lecturerId
        AND s.dayOfWeek = :dayOfWeek
        AND s.startPeriod <= :endPeriod
        AND s.endPeriod >= :startPeriod
        AND s.startDate <= :endDate
        AND s.endDate >= :startDate
        AND (:excludeId IS NULL OR s.id != :excludeId)
    """)
    List<Schedule> findLecturerConflicts(
            @Param("lecturerId") Long lecturerId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("startPeriod") Integer startPeriod,
            @Param("endPeriod") Integer endPeriod,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId
    );
}
