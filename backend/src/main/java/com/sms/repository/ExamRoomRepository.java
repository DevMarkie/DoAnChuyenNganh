package com.sms.repository;

import com.sms.entity.ExamRoom;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ExamRoomRepository extends JpaRepository<ExamRoom, Long> {

    @Override
    @EntityGraph(attributePaths = {"examSession", "examSession.subject", "examSession.semester", "proctor1", "proctor2"})
    @NonNull List<ExamRoom> findAll();

    @Override
    @EntityGraph(attributePaths = {"examSession", "examSession.subject", "examSession.semester", "proctor1", "proctor2"})
    @NonNull Optional<ExamRoom> findById(@NonNull Long id);

    @EntityGraph(attributePaths = {"examSession", "examSession.subject", "examSession.semester", "proctor1", "proctor2"})
    List<ExamRoom> findByExamSessionId(Long examSessionId);

    @Query("SELECT r.examSession.id, COUNT(r) FROM ExamRoom r WHERE r.examSession.id IN :sessionIds GROUP BY r.examSession.id")
    List<Object[]> countRoomsBySessionIds(@Param("sessionIds") Collection<Long> sessionIds);

    Optional<ExamRoom> findByExamSessionIdAndRoomCode(Long examSessionId, String roomCode);

    @EntityGraph(attributePaths = {"examSession", "examSession.subject", "examSession.semester", "proctor1", "proctor2"})
    List<ExamRoom> findByProctor1IdOrProctor2Id(Long proctor1Id, Long proctor2Id);
}
