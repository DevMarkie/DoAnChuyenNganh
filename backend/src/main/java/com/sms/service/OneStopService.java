package com.sms.service;

import com.sms.entity.Student;
import com.sms.entity.StudentServiceRequest;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.StudentRepository;
import com.sms.repository.StudentServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OneStopService {

    private final StudentServiceRequestRepository requestRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public StudentServiceRequest submitRequest(Long studentId, String requestType, Integer quantity,
                                              String purpose, String pickupMethod) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên: " + studentId));

        String verificationCode = UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();

        StudentServiceRequest request = StudentServiceRequest.builder()
                .student(student)
                .requestType(requestType)
                .quantity(quantity != null && quantity > 0 ? quantity : 1)
                .purpose(purpose)
                .verificationCode(verificationCode)
                .pickupMethod(pickupMethod != null ? pickupMethod : "ONLINE_PDF")
                .status("PENDING")
                .build();

        return requestRepository.save(request);
    }

    public List<StudentServiceRequest> getStudentRequests(Long studentId) {
        return requestRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    public Page<StudentServiceRequest> getRequests(String status, Pageable pageable) {
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            return requestRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        }
        return requestRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional
    public StudentServiceRequest processRequest(Long requestId, User staffUser, String status, String note) {
        StudentServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu dịch vụ: " + requestId));

        request.setStatus(status.toUpperCase());
        request.setProcessedBy(staffUser);
        request.setAdminNote(note);
        if ("COMPLETED".equalsIgnoreCase(status)) {
            request.setCompletedAt(LocalDateTime.now());
        }

        return requestRepository.save(request);
    }

    public StudentServiceRequest verifyByCode(String code) {
        return requestRepository.findByVerificationCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Mã xác thực không hợp lệ hoặc không tồn tại"));
    }
}
