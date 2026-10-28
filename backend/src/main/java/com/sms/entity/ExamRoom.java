package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "exam_rooms")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ExamRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private ExamSession examSession;

    @Column(name = "room_code", nullable = false, length = 50)
    private String roomCode;

    @Column(name = "room_location", length = 100)
    private String roomLocation;

    @Column(name = "capacity", nullable = false)
    @Builder.Default
    private Integer capacity = 40;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ExamRoomStatus status = ExamRoomStatus.SCHEDULED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
