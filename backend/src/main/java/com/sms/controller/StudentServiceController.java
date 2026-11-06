package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.GraduationEligibilityResponse;
import com.sms.entity.ConductScore;
import com.sms.entity.Student;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.ConductScoreRepository;
import com.sms.repository.StudentRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.CurriculumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentServiceController {

    private final ConductScoreRepository conductScoreRepository;
    private final StudentRepository studentRepository;
    private final CurriculumService curriculumService;

    private Student getStudentByUser(UserPrincipal user) {
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sinh viên tương ứng với tài khoản"));
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
