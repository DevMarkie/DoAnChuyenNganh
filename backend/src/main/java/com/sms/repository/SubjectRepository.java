package com.sms.repository;

import com.sms.entity.Subject;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Integer> {
    Optional<Subject> findBySubjectCode(String subjectCode);
    boolean existsBySubjectCode(String subjectCode);

    @EntityGraph(attributePaths = {"department"})
    List<Subject> findByDepartmentId(Integer departmentId);

    @EntityGraph(attributePaths = {"department"})
    List<Subject> findByIsActiveTrue();

    @EntityGraph(attributePaths = {"department"})
    @NonNull List<Subject> findAll();

    @EntityGraph(attributePaths = {"department"})
    @NonNull Optional<Subject> findById(@NonNull Integer id);

    @Query("SELECT s FROM Subject s WHERE " +
           "LOWER(s.subjectName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.subjectCode) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Subject> search(@Param("keyword") String keyword);

    @Query("SELECT p FROM Subject s JOIN s.prerequisites p WHERE s.id = :subjectId")
    java.util.Set<Subject> findPrerequisitesBySubjectId(@Param("subjectId") Integer subjectId);
}
