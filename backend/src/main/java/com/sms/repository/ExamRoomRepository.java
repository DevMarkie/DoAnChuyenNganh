package com.sms.repository;

import com.sms.entity.ExamRoom;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface ExamRoomRepository extends JpaRepository<ExamRoom, Long> {

    @Override
    @EntityGraph(attributePaths = {"examSession", "examSession.subject", "examSession.semester"})
    @NonNull List<ExamRoom> findAll();

    @Override
    @EntityGraph(attributePaths = {"examSession", "examSession.subject", "examSession.semester"})
    @NonNull Optional<ExamRoom> findById(@NonNull Long id);

    @EntityGraph(attributePaths = {"examSession", "examSession.subject", "examSession.semester"})
    List<ExamRoom> findByExamSessionId(Long examSessionId);

    Optional<ExamRoom> findByExamSessionIdAndRoomCode(Long examSessionId, String roomCode);
}
