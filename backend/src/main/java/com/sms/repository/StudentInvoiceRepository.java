package com.sms.repository;

import com.sms.entity.StudentInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentInvoiceRepository extends JpaRepository<StudentInvoice, Long> {

    @Query("SELECT i FROM StudentInvoice i " +
           "JOIN FETCH i.student s " +
           "JOIN FETCH i.section cs " +
           "JOIN FETCH cs.subject sub " +
           "WHERE s.id = :studentId AND cs.semester.id = :semesterId")
    List<StudentInvoice> findByStudentIdAndSemesterId(@Param("studentId") Long studentId,
                                                      @Param("semesterId") Integer semesterId);

    @Query("SELECT i FROM StudentInvoice i " +
           "JOIN FETCH i.student s " +
           "JOIN FETCH i.section cs " +
           "JOIN FETCH cs.subject sub " +
           "WHERE s.id = :studentId")
    List<StudentInvoice> findByStudentId(@Param("studentId") Long studentId);

    List<StudentInvoice> findByStudentIdAndStatus(Long studentId, StudentInvoice.InvoiceStatus status);

    Optional<StudentInvoice> findByStudentIdAndSectionId(Long studentId, Long sectionId);

    @Query("SELECT i FROM StudentInvoice i " +
           "JOIN FETCH i.student s " +
           "LEFT JOIN FETCH s.classEntity c " +
           "JOIN FETCH i.section cs " +
           "JOIN FETCH cs.subject sub " +
           "WHERE cs.semester.id = :semesterId " +
           "AND i.status = com.sms.entity.StudentInvoice$InvoiceStatus.UNPAID")
    List<StudentInvoice> findUnpaidBySemesterId(@Param("semesterId") Integer semesterId);

    @Query("SELECT i FROM StudentInvoice i " +
           "JOIN FETCH i.student s " +
           "JOIN FETCH i.section cs " +
           "WHERE i.id IN :ids")
    List<StudentInvoice> findByIdInWithDetails(@Param("ids") List<Long> ids);

    @Query("SELECT i FROM StudentInvoice i " +
           "JOIN FETCH i.student s " +
           "LEFT JOIN FETCH s.classEntity c " +
           "LEFT JOIN FETCH c.department d " +
           "JOIN FETCH i.section cs " +
           "JOIN FETCH cs.subject sub " +
           "WHERE cs.semester.id = :semesterId")
    List<StudentInvoice> findBySemesterIdWithDetails(@Param("semesterId") Integer semesterId);

    @Query("SELECT i FROM StudentInvoice i " +
           "JOIN FETCH i.student s " +
           "LEFT JOIN FETCH s.user u " +
           "JOIN FETCH i.section cs " +
           "JOIN FETCH cs.semester sem " +
           "WHERE i.status = :status")
    List<StudentInvoice> findByStatusWithDetails(@Param("status") StudentInvoice.InvoiceStatus status);
}
