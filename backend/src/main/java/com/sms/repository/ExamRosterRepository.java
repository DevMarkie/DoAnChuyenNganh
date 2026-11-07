package com.sms.repository;

import com.sms.entity.ExamRoster;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface ExamRosterRepository extends JpaRepository<ExamRoster, Long> {

    @Override
    @EntityGraph(attributePaths = {"examRoom", "enrollment", "student", "student.classEntity", "scoredBy"})
    @NonNull List<ExamRoster> findAll();

    @Override
    @EntityGraph(attributePaths = {"examRoom", "enrollment", "student", "student.classEntity", "scoredBy"})
    @NonNull Optional<ExamRoster> findById(@NonNull Long id);

    @EntityGraph(attributePaths = {"examRoom", "enrollment", "student", "student.classEntity", "scoredBy"})
    List<ExamRoster> findByExamRoomIdOrderBySbdAsc(Long examRoomId);

    @EntityGraph(attributePaths = {"examRoom", "enrollment", "student", "student.classEntity", "scoredBy"})
    Optional<ExamRoster> findByExamRoomIdAndSbd(Long examRoomId, String sbd);

    @EntityGraph(attributePaths = {"examRoom", "enrollment", "student", "student.classEntity", "scoredBy"})
    Optional<ExamRoster> findByExamRoomIdAndStudentStudentCode(Long examRoomId, String studentCode);

    Optional<ExamRoster> findByEnrollmentId(Long enrollmentId);

    @EntityGraph(attributePaths = {"examRoom", "examRoom.proctor1", "examRoom.proctor2", "examRoom.examSession", "examRoom.examSession.subject", "examRoom.examSession.semester", "enrollment"})
    List<ExamRoster> findByStudentId(Long studentId);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM ExamRoster r " +
           "JOIN FETCH r.examRoom rm " +
           "JOIN FETCH rm.examSession s " +
           "JOIN FETCH s.subject sub " +
           "JOIN FETCH s.semester sem " +
           "JOIN FETCH r.enrollment e " +
           "WHERE r.student.id = :studentId AND sem.id = :semesterId " +
           "ORDER BY s.examDate ASC, s.startTime ASC")
    List<ExamRoster> findByStudentIdAndSemesterId(@org.springframework.data.repository.query.Param("studentId") Long studentId,
                                                 @org.springframework.data.repository.query.Param("semesterId") Integer semesterId);

    boolean existsByExamRoomExamSessionIdAndEnrollmentId(Long examSessionId, Long enrollmentId);

    long countByExamRoomId(Long examRoomId);

    void deleteByExamRoomId(Long examRoomId);
}
