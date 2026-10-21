package com.sms.repository;

import com.sms.entity.Cohort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CohortRepository extends JpaRepository<Cohort, Integer> {
    Optional<Cohort> findByCode(String code);
}
