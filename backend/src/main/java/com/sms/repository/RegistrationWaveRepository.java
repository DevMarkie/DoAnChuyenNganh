package com.sms.repository;

import com.sms.entity.RegistrationWave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RegistrationWaveRepository extends JpaRepository<RegistrationWave, Long> {

    List<RegistrationWave> findBySemesterIdOrderByStartTimeAsc(Integer semesterId);

    List<RegistrationWave> findBySemesterIdAndIsActiveTrueOrderByStartTimeAsc(Integer semesterId);

    boolean existsBySemesterIdAndIsActiveTrue(Integer semesterId);

    @Query("SELECT COUNT(rw) > 0 FROM RegistrationWave rw " +
           "WHERE rw.semester.id = :semesterId AND rw.isActive = true " +
           "AND rw.major.id = :majorId")
    boolean hasWavesForMajor(@Param("semesterId") Integer semesterId, @Param("majorId") Integer majorId);

    @Query("SELECT rw FROM RegistrationWave rw " +
           "LEFT JOIN FETCH rw.cohort " +
           "LEFT JOIN FETCH rw.department " +
           "LEFT JOIN FETCH rw.major " +
           "WHERE rw.semester.id = :semesterId AND rw.isActive = true " +
           "AND rw.major.id = :majorId " +
           "AND :now BETWEEN rw.startTime AND rw.endTime " +
           "AND (rw.cohort IS NULL OR rw.cohort.id = :cohortId)")
    List<RegistrationWave> findActiveWavesByMajor(@Param("semesterId") Integer semesterId,
                                                 @Param("cohortId") Integer cohortId,
                                                 @Param("majorId") Integer majorId,
                                                 @Param("now") LocalDateTime now);

    @Query("SELECT rw FROM RegistrationWave rw " +
           "LEFT JOIN FETCH rw.cohort " +
           "LEFT JOIN FETCH rw.department " +
           "LEFT JOIN FETCH rw.major " +
           "WHERE rw.semester.id = :semesterId AND rw.isActive = true " +
           "AND :now BETWEEN rw.startTime AND rw.endTime " +
           "AND (rw.cohort IS NULL OR rw.cohort.id = :cohortId) " +
           "AND (rw.department IS NULL OR rw.department.id = :departmentId) " +
           "AND (rw.major IS NULL OR rw.major.id = :majorId)")
    List<RegistrationWave> findEligibleActiveWaves(@Param("semesterId") Integer semesterId,
                                                  @Param("cohortId") Integer cohortId,
                                                  @Param("departmentId") Integer departmentId,
                                                  @Param("majorId") Integer majorId,
                                                  @Param("now") LocalDateTime now);

    @Query("SELECT rw FROM RegistrationWave rw " +
           "LEFT JOIN FETCH rw.cohort " +
           "LEFT JOIN FETCH rw.department " +
           "LEFT JOIN FETCH rw.major " +
           "WHERE rw.semester.id = :semesterId AND rw.isActive = true " +
           "AND (rw.cohort IS NULL OR rw.cohort.id = :cohortId) " +
           "AND (rw.department IS NULL OR rw.department.id = :departmentId) " +
           "AND (rw.major IS NULL OR rw.major.id = :majorId) " +
           "ORDER BY rw.startTime ASC")
    List<RegistrationWave> findWavesForStudent(@Param("semesterId") Integer semesterId,
                                              @Param("cohortId") Integer cohortId,
                                              @Param("departmentId") Integer departmentId,
                                              @Param("majorId") Integer majorId);

    @Query("SELECT rw FROM RegistrationWave rw " +
           "LEFT JOIN FETCH rw.cohort " +
           "LEFT JOIN FETCH rw.department " +
           "LEFT JOIN FETCH rw.major " +
           "WHERE rw.semester.id = :semesterId AND rw.isActive = true " +
           "AND rw.major.id = :majorId " +
           "ORDER BY rw.startTime ASC")
    List<RegistrationWave> findWavesByMajorOrderByStartTimeAsc(@Param("semesterId") Integer semesterId,
                                                              @Param("majorId") Integer majorId);
}
