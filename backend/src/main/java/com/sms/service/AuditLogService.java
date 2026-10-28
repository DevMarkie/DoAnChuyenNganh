package com.sms.service;

import com.sms.entity.AuditLog;
import com.sms.entity.User;
import com.sms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog record(User user, String username, String role, String action, String module, String ipAddress, String details) {
        AuditLog entry = AuditLog.builder()
                .user(user)
                .username(username != null ? username : (user != null ? user.getUsername() : "ANONYMOUS"))
                .role(role != null ? role : (user != null && user.getRole() != null ? user.getRole().getName() : "NONE"))
                .action(action)
                .module(module)
                .ipAddress(ipAddress)
                .details(details)
                .build();
        return auditLogRepository.save(entry);
    }

    public Page<AuditLog> getLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> getLogsByModule(String module, Pageable pageable) {
        return auditLogRepository.findByModuleOrderByCreatedAtDesc(module, pageable);
    }

    public Page<AuditLog> getLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
    }

    public Page<AuditLog> getLogsByUsername(String username, Pageable pageable) {
        return auditLogRepository.findByUsernameOrderByCreatedAtDesc(username, pageable);
    }
}
