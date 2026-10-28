package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "backup_histories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BackupHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size_bytes", nullable = false)
    @Builder.Default
    private Long fileSizeBytes = 0L;

    @Column(name = "record_count")
    @Builder.Default
    private Long recordCount = 0L;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SUCCESS";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
