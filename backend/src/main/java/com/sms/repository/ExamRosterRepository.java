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

    boolean existsByExamRoomExamSessionIdAndEnrollmentId(Long examSessionId, Long enrollmentId);

    long countByExamRoomId(Long examRoomId);

    void deleteByExamRoomId(Long examRoomId);
}
