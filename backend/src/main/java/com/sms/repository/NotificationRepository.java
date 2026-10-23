package com.sms.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sms.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

    List<Notification> findTop30ByStudentIdOrderByCreatedAtDesc(Long studentId);

    long countByStudentIdAndIsReadFalse(Long studentId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.student.id = :studentId AND n.isRead = false")
    void markAllAsRead(@Param("studentId") Long studentId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.student.id = :studentId")
    int markAsRead(@Param("id") Long id, @Param("studentId") Long studentId);
}
