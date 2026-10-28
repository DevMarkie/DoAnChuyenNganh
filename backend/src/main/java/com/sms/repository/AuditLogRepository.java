package com.sms.repository;

import com.sms.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByModuleOrderByCreatedAtDesc(String module, Pageable pageable);
    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);
    Page<AuditLog> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
    Page<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
}
