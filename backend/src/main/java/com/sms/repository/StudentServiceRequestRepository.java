package com.sms.repository;

import com.sms.entity.StudentServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentServiceRequestRepository extends JpaRepository<StudentServiceRequest, Long> {
    List<StudentServiceRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    Optional<StudentServiceRequest> findByVerificationCode(String verificationCode);
    Page<StudentServiceRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<StudentServiceRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
