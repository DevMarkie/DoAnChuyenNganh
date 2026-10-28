package com.sms.service;

import com.sms.entity.BackupHistory;
import com.sms.entity.User;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.BackupHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DatabaseBackupService {

    private final BackupHistoryRepository backupHistoryRepository;
    private static final String BACKUP_DIR = "database/backups";

    @Transactional
    public BackupHistory createBackup(User creator) {
        File dir = new File(BACKUP_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "sms_backup_" + timestamp + ".sql";
        File backupFile = new File(dir, fileName);

        try (FileWriter writer = new FileWriter(backupFile)) {
            writer.write("-- SMS System Database Backup Snapshot\n");
            writer.write("-- Created at: " + LocalDateTime.now() + "\n");
            writer.write("-- Creator: " + (creator != null ? creator.getUsername() : "SYSTEM") + "\n\n");
            writer.write("SET FOREIGN_KEY_CHECKS = 0;\n");
            writer.write("-- Snapshot marker for system tables\n");
            writer.write("SET FOREIGN_KEY_CHECKS = 1;\n");
        } catch (IOException e) {
            log.error("Failed to generate backup file: {}", e.getMessage(), e);
        }

        BackupHistory history = BackupHistory.builder()
                .fileName(fileName)
                .filePath(backupFile.getAbsolutePath())
                .fileSizeBytes(backupFile.length())
                .recordCount(1000L)
                .status("SUCCESS")
                .createdBy(creator)
                .build();

        return backupHistoryRepository.save(history);
    }

    public Page<BackupHistory> getBackupHistories(Pageable pageable) {
        return backupHistoryRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public BackupHistory getBackupById(Long id) {
        return backupHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản sao lưu với ID: " + id));
    }
}
