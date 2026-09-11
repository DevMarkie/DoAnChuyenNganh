package com.sms.repository;

import com.sms.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    Optional<Department> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByName(String name);
    List<Department> findByIsActiveTrue();
    List<Department> findByNameContainingIgnoreCase(String name);
}
