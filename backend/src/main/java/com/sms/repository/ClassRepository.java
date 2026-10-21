package com.sms.repository;

import com.sms.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import java.util.List;
import java.util.Optional;

public interface ClassRepository extends JpaRepository<ClassEntity, Integer> {
    Optional<ClassEntity> findByCode(String code);
    boolean existsByCode(String code);
    List<ClassEntity> findByDepartmentId(Integer departmentId);
    List<ClassEntity> findByIsActiveTrue();
    List<ClassEntity> findByAcademicYear(String academicYear);
    List<ClassEntity> findByNameContainingIgnoreCase(String name);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department"})
    @NonNull List<ClassEntity> findAll();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department"})
    @NonNull Optional<ClassEntity> findById(@NonNull Integer id);
}
