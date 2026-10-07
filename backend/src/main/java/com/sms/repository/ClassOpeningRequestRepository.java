package com.sms.repository;

import com.sms.entity.ClassOpeningRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassOpeningRequestRepository extends JpaRepository<ClassOpeningRequest, Long> {
    boolean existsByStudentIdAndSubjectIdAndSemesterId(Long studentId, Integer subjectId, Integer semesterId);
    List<ClassOpeningRequest> findBySubjectIdAndSemesterId(Integer subjectId, Integer semesterId);
    List<ClassOpeningRequest> findBySemesterIdAndStatus(Integer semesterId, ClassOpeningRequest.RequestStatus status);
}
