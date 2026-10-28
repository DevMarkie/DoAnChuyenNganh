package com.sms.repository;

import com.sms.entity.ExamSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {

    @Override
    @EntityGraph(attributePaths = {"semester", "subject"})
    @NonNull List<ExamSession> findAll();

    @Override
    @EntityGraph(attributePaths = {"semester", "subject"})
    @NonNull Optional<ExamSession> findById(@NonNull Long id);

    @EntityGraph(attributePaths = {"semester", "subject"})
    List<ExamSession> findBySemesterId(Integer semesterId);

    @EntityGraph(attributePaths = {"semester", "subject"})
    List<ExamSession> findBySemesterIdAndSubjectId(Integer semesterId, Integer subjectId);
}
