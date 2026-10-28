package com.sms.repository;

import com.sms.entity.StudentTrainingPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentTrainingPointRepository extends JpaRepository<StudentTrainingPoint, Long> {

    Optional<StudentTrainingPoint> findByStudentIdAndSemesterId(Long studentId, Integer semesterId);

    @Query("SELECT stp FROM StudentTrainingPoint stp " +
           "JOIN FETCH stp.student s " +
           "JOIN FETCH stp.semester sem " +
           "WHERE (:studentId IS NULL OR s.id = :studentId) " +
           "AND (:semesterId IS NULL OR sem.id = :semesterId) " +
           "ORDER BY sem.startDate DESC, stp.score DESC")
    List<StudentTrainingPoint> search(
            @Param("studentId") Long studentId,
            @Param("semesterId") Integer semesterId
    );

    List<StudentTrainingPoint> findByStudentIdOrderBySemesterStartDateDesc(Long studentId);
}
