package com.sms.repository;

import com.sms.entity.CurriculumBlockSubject;
import com.sms.entity.CurriculumBlockSubjectId;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CurriculumBlockSubjectRepository extends JpaRepository<CurriculumBlockSubject, CurriculumBlockSubjectId> {
    @Query("SELECT bs FROM CurriculumBlockSubject bs JOIN FETCH bs.subject s " +
            "WHERE bs.blockId = :blockId ORDER BY s.subjectCode")
    List<CurriculumBlockSubject> findByBlockIdWithSubject(@Param("blockId") Long blockId);

    @Query("SELECT CASE WHEN COUNT(bs) > 0 THEN true ELSE false END FROM CurriculumBlockSubject bs " +
            "JOIN bs.block b WHERE b.program.id = :programId AND bs.subjectId = :subjectId")
    boolean existsByProgramIdAndSubjectId(@Param("programId") Long programId, @Param("subjectId") Integer subjectId);
}
