package com.sms.repository;

import com.sms.entity.ClassEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import java.util.List;
import java.util.Optional;

public interface ClassRepository extends JpaRepository<ClassEntity, Integer> {
    @EntityGraph(attributePaths = {"department"})
    Optional<ClassEntity> findByCode(String code);

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"department"})
    List<ClassEntity> findByDepartmentId(Integer departmentId);

    @EntityGraph(attributePaths = {"department"})
    List<ClassEntity> findByIsActiveTrue();

    @EntityGraph(attributePaths = {"department"})
    List<ClassEntity> findByAcademicYear(String academicYear);

    @EntityGraph(attributePaths = {"department"})
    List<ClassEntity> findByNameContainingIgnoreCase(String name);

    @EntityGraph(attributePaths = {"department"})
    @NonNull List<ClassEntity> findAll();

    @EntityGraph(attributePaths = {"department"})
    @NonNull Optional<ClassEntity> findById(@NonNull Integer id);
}
