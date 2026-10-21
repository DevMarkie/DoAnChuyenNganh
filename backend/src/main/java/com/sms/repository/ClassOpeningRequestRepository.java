package com.sms.repository;

import com.sms.entity.ClassOpeningRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;

public interface ClassOpeningRequestRepository extends JpaRepository<ClassOpeningRequest, Long> {
    boolean existsByStudentIdAndSubjectIdAndSemesterId(Long studentId, Integer subjectId, Integer semesterId);
    List<ClassOpeningRequest> findBySubjectIdAndSemesterId(Integer subjectId, Integer semesterId);
    List<ClassOpeningRequest> findBySubjectIdAndSemesterIdAndStatus(
            Integer subjectId, Integer semesterId, ClassOpeningRequest.RequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ClassOpeningRequest r WHERE r.subject.id = :subjectId " +
            "AND r.semester.id = :semesterId AND r.status = :status")
    List<ClassOpeningRequest> findPendingForUpdate(
            @Param("subjectId") Integer subjectId,
            @Param("semesterId") Integer semesterId,
            @Param("status") ClassOpeningRequest.RequestStatus status);
    List<ClassOpeningRequest> findBySemesterIdAndStatus(Integer semesterId, ClassOpeningRequest.RequestStatus status);
}
