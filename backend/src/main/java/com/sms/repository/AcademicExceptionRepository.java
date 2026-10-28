package com.sms.repository;

import com.sms.entity.AcademicException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicExceptionRepository extends JpaRepository<AcademicException, Long> {
    List<AcademicException> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    Page<AcademicException> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<AcademicException> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
