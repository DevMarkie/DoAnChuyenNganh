package com.sms.repository;

import com.sms.entity.GradeAppeal;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface GradeAppealRepository extends JpaRepository<GradeAppeal, Long> {

    @Query("SELECT a FROM GradeAppeal a " +
            "JOIN FETCH a.enrollment e " +
            "JOIN FETCH e.student s " +
            "JOIN FETCH e.section cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.lecturer " +
            "LEFT JOIN FETCH a.reviewer " +
            "LEFT JOIN FETCH a.assignedLecturer " +
            "LEFT JOIN FETCH a.headReviewer " +
            "LEFT JOIN FETCH a.appliedByUser " +
            "WHERE a.id = :id")
    Optional<GradeAppeal> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT a FROM GradeAppeal a " +
            "JOIN FETCH a.enrollment e " +
            "JOIN FETCH e.student s " +
            "JOIN FETCH e.section cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.lecturer " +
            "LEFT JOIN FETCH a.reviewer " +
            "LEFT JOIN FETCH a.assignedLecturer " +
            "LEFT JOIN FETCH a.headReviewer " +
            "LEFT JOIN FETCH a.appliedByUser " +
            "WHERE a.student.id = :studentId ORDER BY a.createdAt DESC")
    List<GradeAppeal> findByStudentIdWithDetails(@Param("studentId") Long studentId);

    @Query("SELECT a FROM GradeAppeal a " +
            "JOIN FETCH a.enrollment e " +
            "JOIN FETCH e.student s " +
            "JOIN FETCH e.section cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.lecturer " +
            "LEFT JOIN FETCH a.reviewer " +
            "LEFT JOIN FETCH a.assignedLecturer " +
            "LEFT JOIN FETCH a.headReviewer " +
            "LEFT JOIN FETCH a.appliedByUser " +
            "ORDER BY a.createdAt DESC")
    List<GradeAppeal> findAllWithDetails();

    @Query("SELECT a FROM GradeAppeal a " +
            "JOIN FETCH a.enrollment e " +
            "JOIN FETCH e.student s " +
            "JOIN FETCH e.section cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.lecturer " +
            "LEFT JOIN FETCH a.reviewer " +
            "LEFT JOIN FETCH a.assignedLecturer " +
            "LEFT JOIN FETCH a.headReviewer " +
            "LEFT JOIN FETCH a.appliedByUser " +
            "WHERE a.assignedLecturer.id = :lecturerId ORDER BY a.createdAt DESC")
    List<GradeAppeal> findByAssignedLecturerIdWithDetails(@Param("lecturerId") Long lecturerId);

    @Query("SELECT a FROM GradeAppeal a " +
            "JOIN FETCH a.enrollment e " +
            "JOIN FETCH e.student s " +
            "JOIN FETCH e.section cs " +
            "JOIN FETCH cs.subject sub " +
            "LEFT JOIN FETCH sub.department d " +
            "JOIN FETCH cs.semester " +
            "LEFT JOIN FETCH cs.lecturer " +
            "LEFT JOIN FETCH a.reviewer " +
            "LEFT JOIN FETCH a.assignedLecturer " +
            "LEFT JOIN FETCH a.headReviewer " +
            "LEFT JOIN FETCH a.appliedByUser " +
            "WHERE d.id IN :departmentIds ORDER BY a.createdAt DESC")
    List<GradeAppeal> findByDepartmentIdsWithDetails(@Param("departmentIds") Collection<Integer> departmentIds);

    long countByStudentIdAndEnrollmentSectionSubjectIdAndStatusIn(
            Long studentId, Integer subjectId, Collection<GradeAppeal.AppealStatus> statuses);

    long countByStudentIdAndEnrollmentSectionSubjectIdAndStatus(
            Long studentId, Integer subjectId, GradeAppeal.AppealStatus status);
}
