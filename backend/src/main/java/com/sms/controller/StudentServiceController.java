package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.GraduationEligibilityResponse;
import com.sms.entity.AcademicException;
import com.sms.entity.ConductScore;
import com.sms.entity.Student;
import com.sms.entity.StudentServiceRequest;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.ConductScoreRepository;
import com.sms.repository.StudentRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.AcademicExceptionService;
import com.sms.service.CurriculumService;
import com.sms.service.OneStopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentServiceController {

    private final AcademicExceptionService exceptionService;
    private final OneStopService oneStopService;
    private final ConductScoreRepository conductScoreRepository;
    private final StudentRepository studentRepository;
    private final CurriculumService curriculumService;

    private Student getStudentByUser(UserPrincipal user) {
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sinh viên tương ứng với tài khoản"));
    }

    // --- NGOẠI LỆ HỌC VỤ ---

    @PostMapping("/exceptions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AcademicException>> submitException(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody Map<String, Object> body) {
        Student student = getStudentByUser(user);
        String type = (String) body.get("exceptionType");
        Long sectionId = body.get("courseSectionId") != null ? Long.valueOf(body.get("courseSectionId").toString()) : null;
        Integer subjectId = body.get("subjectId") != null ? Integer.valueOf(body.get("subjectId").toString()) : null;
        Integer semesterId = body.get("semesterId") != null ? Integer.valueOf(body.get("semesterId").toString()) : null;
        String reason = (String) body.get("reason");
        String attachmentUrl = (String) body.get("attachmentUrl");

        AcademicException created = exceptionService.submitRequest(student.getId(), type, sectionId, subjectId, semesterId, reason, attachmentUrl);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi đơn ngoại lệ học vụ thành công", created));
    }

    @GetMapping("/exceptions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<AcademicException>>> getMyExceptions(
            @AuthenticationPrincipal UserPrincipal user) {
        Student student = getStudentByUser(user);
        return ResponseEntity.ok(ApiResponse.success(exceptionService.getStudentExceptions(student.getId())));
    }

    // --- DỊCH VỤ SINH VIÊN 1 CỬA ---

    @PostMapping("/service-requests")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentServiceRequest>> submitServiceRequest(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody Map<String, Object> body) {
        Student student = getStudentByUser(user);
        String requestType = (String) body.get("requestType");
        Integer quantity = body.get("quantity") != null ? Integer.valueOf(body.get("quantity").toString()) : 1;
        String purpose = (String) body.get("purpose");
        String pickupMethod = (String) body.get("pickupMethod");

        StudentServiceRequest created = oneStopService.submitRequest(student.getId(), requestType, quantity, purpose, pickupMethod);
        return ResponseEntity.ok(ApiResponse.success("Đã nộp yêu cầu dịch vụ sinh viên thành công", created));
    }

    @GetMapping("/service-requests")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentServiceRequest>>> getMyServiceRequests(
            @AuthenticationPrincipal UserPrincipal user) {
        Student student = getStudentByUser(user);
        return ResponseEntity.ok(ApiResponse.success(oneStopService.getStudentRequests(student.getId())));
    }

    // --- ĐIỂM RÈN LUYỆN ---

    @GetMapping("/conduct-scores")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ConductScore>>> getMyConductScores(
            @AuthenticationPrincipal UserPrincipal user) {
        Student student = getStudentByUser(user);
        return ResponseEntity.ok(ApiResponse.success(conductScoreRepository.findByStudentIdOrderBySemesterIdDesc(student.getId())));
    }

    // --- TRẠNG THÁI XÉT TỐT NGHIỆP CÁ NHÂN ---

    @GetMapping("/graduation-status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<GraduationEligibilityResponse>> getGraduationStatus(
            @AuthenticationPrincipal UserPrincipal user) {
        Student student = getStudentByUser(user);
        return ResponseEntity.ok(ApiResponse.success(curriculumService.checkGraduationEligibility(student.getId())));
    }
}
