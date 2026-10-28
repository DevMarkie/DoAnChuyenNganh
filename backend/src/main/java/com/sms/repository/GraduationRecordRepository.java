package com.sms.repository;

import com.sms.entity.GraduationRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GraduationRecordRepository extends JpaRepository<GraduationRecord, Long> {
    Optional<GraduationRecord> findByStudentId(Long studentId);
    Page<GraduationRecord> findByCohortIdAndOfficialStatus(Integer cohortId, String officialStatus, Pageable pageable);
    Page<GraduationRecord> findByCohortId(Integer cohortId, Pageable pageable);
}
