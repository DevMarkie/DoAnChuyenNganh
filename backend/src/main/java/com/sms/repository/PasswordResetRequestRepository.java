package com.sms.repository;

import com.sms.entity.PasswordResetRequest;
import com.sms.entity.PasswordResetRequest.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {

    List<PasswordResetRequest> findAllByOrderByCreatedAtDesc();

    List<PasswordResetRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    long countByStatus(RequestStatus status);

    boolean existsByUserIdAndStatus(Long userId, RequestStatus status);
}
