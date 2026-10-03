package com.sms.repository;

import com.sms.entity.CurriculumProgram;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface CurriculumProgramRepository extends JpaRepository<CurriculumProgram, Long> {
    @Query("SELECT p FROM CurriculumProgram p JOIN FETCH p.major m JOIN FETCH p.cohort c " +
            "WHERE m.id = :majorId AND c.id = :cohortId AND p.isActive = true")
    Optional<CurriculumProgram> findActiveByMajorAndCohort(@Param("majorId") Integer majorId, @Param("cohortId") Integer cohortId);
}
