package com.sms.repository;

import com.sms.entity.GraduationRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GraduationRecordRepository extends JpaRepository<GraduationRecord, Long> {
    Optional<GraduationRecord> findByStudentId(Long studentId);

    /**
     * Recovery lookup for legacy databases that contain duplicate graduation
     * records.  The database migration enforces one record per student, but
     * selecting a deterministic record here keeps the assessment flow
     * available while an existing installation is being repaired.
     */
    Optional<GraduationRecord> findFirstByStudentIdOrderByUpdatedAtDescIdDesc(Long studentId);

    @Query(value = "SELECT gr FROM GraduationRecord gr " +
                   "LEFT JOIN FETCH gr.student s " +
                   "LEFT JOIN FETCH s.classEntity " +
                   "LEFT JOIN FETCH gr.cohort " +
                   "WHERE gr.cohort.id = :cohortId AND gr.officialStatus = :officialStatus",
           countQuery = "SELECT count(gr) FROM GraduationRecord gr WHERE gr.cohort.id = :cohortId AND gr.officialStatus = :officialStatus")
    Page<GraduationRecord> findByCohortIdAndOfficialStatus(@Param("cohortId") Integer cohortId, @Param("officialStatus") String officialStatus, Pageable pageable);

    @Query(value = "SELECT gr FROM GraduationRecord gr " +
                   "LEFT JOIN FETCH gr.student s " +
                   "LEFT JOIN FETCH s.classEntity " +
                   "LEFT JOIN FETCH gr.cohort " +
                   "WHERE gr.cohort.id = :cohortId",
           countQuery = "SELECT count(gr) FROM GraduationRecord gr WHERE gr.cohort.id = :cohortId")
    Page<GraduationRecord> findByCohortId(@Param("cohortId") Integer cohortId, Pageable pageable);

    @Query(value = "SELECT gr FROM GraduationRecord gr " +
                   "LEFT JOIN FETCH gr.student s " +
                   "LEFT JOIN FETCH s.classEntity " +
                   "LEFT JOIN FETCH gr.cohort",
           countQuery = "SELECT count(gr) FROM GraduationRecord gr")
    Page<GraduationRecord> findAll(Pageable pageable);
}
