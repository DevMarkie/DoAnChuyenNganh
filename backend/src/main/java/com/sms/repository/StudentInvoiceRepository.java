package com.sms.repository;

import com.sms.entity.StudentInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentInvoiceRepository extends JpaRepository<StudentInvoice, Long> {
    boolean existsByStudentIdAndSectionId(Long studentId, Long sectionId);
}
