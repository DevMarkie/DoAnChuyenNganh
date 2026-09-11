package com.sms.repository;

import com.sms.entity.Student;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    @Override
    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    List<Student> findAll();

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    Optional<Student> findByStudentCode(String studentCode);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    Optional<Student> findByUserId(Long userId);

    boolean existsByStudentCode(String studentCode);
    boolean existsByEmail(String email);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    List<Student> findByClassEntityId(Integer classId);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    List<Student> findByStatus(Student.StudentStatus status);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    @Query("SELECT s FROM Student s WHERE " +
           "LOWER(s.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Student> search(@Param("keyword") String keyword);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.status = :status")
    long countByStatus(@Param("status") Student.StudentStatus status);

    @Query("SELECT s.classEntity.department.id, COUNT(s) FROM Student s WHERE s.status = 'ACTIVE' GROUP BY s.classEntity.department.id")
    List<Object[]> countByDepartment();
}
