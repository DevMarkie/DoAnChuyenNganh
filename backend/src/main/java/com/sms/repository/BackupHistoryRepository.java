package com.sms.repository;

import com.sms.entity.BackupHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BackupHistoryRepository extends JpaRepository<BackupHistory, Long> {
    Page<BackupHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
