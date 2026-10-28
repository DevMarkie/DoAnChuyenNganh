package com.sms.repository;

import com.sms.entity.StudentAchievementDiscipline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAchievementDisciplineRepository extends JpaRepository<StudentAchievementDiscipline, Long> {

    @Query("SELECT sad FROM StudentAchievementDiscipline sad " +
           "JOIN FETCH sad.student s " +
           "LEFT JOIN FETCH sad.semester sem " +
           "WHERE (:studentId IS NULL OR s.id = :studentId) " +
           "AND (:type IS NULL OR sad.type = :type) " +
           "AND (:semesterId IS NULL OR sem.id = :semesterId) " +
           "ORDER BY sad.issueDate DESC")
    List<StudentAchievementDiscipline> search(
            @Param("studentId") Long studentId,
            @Param("type") StudentAchievementDiscipline.RecordType type,
            @Param("semesterId") Integer semesterId
    );

    List<StudentAchievementDiscipline> findByStudentIdOrderByIssueDateDesc(Long studentId);
}
