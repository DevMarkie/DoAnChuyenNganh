package com.sms.repository;

import com.sms.entity.Major;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MajorRepository extends JpaRepository<Major, Integer> {
    Optional<Major> findByCode(String code);
    List<Major> findByDepartmentId(Integer departmentId);
}
