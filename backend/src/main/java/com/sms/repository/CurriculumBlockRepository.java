package com.sms.repository;

import com.sms.entity.CurriculumBlock;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CurriculumBlockRepository extends JpaRepository<CurriculumBlock, Long> {
    @Query("SELECT b FROM CurriculumBlock b WHERE b.program.id = :programId ORDER BY b.displayOrder, b.id")
    List<CurriculumBlock> findByProgramIdOrdered(@Param("programId") Long programId);

    @Query("SELECT b FROM CurriculumBlock b WHERE b.program.id IN :programIds ORDER BY b.displayOrder, b.id")
    List<CurriculumBlock> findByProgramIdInOrdered(@Param("programIds") java.util.Collection<Long> programIds);
}
