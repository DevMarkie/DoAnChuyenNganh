package com.sms.repository;

import com.sms.entity.ConductScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConductScoreRepository extends JpaRepository<ConductScore, Long> {
    List<ConductScore> findByStudentIdOrderBySemesterIdDesc(Long studentId);
    Optional<ConductScore> findByStudentIdAndSemesterId(Long studentId, Integer semesterId);
    Page<ConductScore> findBySemesterId(Integer semesterId, Pageable pageable);
}
