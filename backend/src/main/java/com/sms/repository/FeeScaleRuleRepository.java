package com.sms.repository;

import com.sms.entity.FeeScaleRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeeScaleRuleRepository extends JpaRepository<FeeScaleRule, Long> {
    Optional<FeeScaleRule> findFirstByMinStudentsLessThanEqualAndMaxStudentsGreaterThanEqual(
            Integer count, Integer sameCount);
}
