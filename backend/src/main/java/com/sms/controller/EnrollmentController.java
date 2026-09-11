package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.EnrollmentRequest;
import com.sms.entity.Enrollment;
import com.sms.security.UserPrincipal;
import com.sms.service.EnrollmentService;
import com.sms.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final StudentService studentService;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Enrollment>>> getMyEnrollments(@AuthenticationPrincipal UserPrincipal user) {
        var student = studentService.findByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.findByStudent(student.getId())));
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<ApiResponse<List<Enrollment>>> getBySection(@PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.findBySection(sectionId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Enrollment>> enroll(@AuthenticationPrincipal UserPrincipal user,
                                                          @Valid @RequestBody EnrollmentRequest request) {
        Enrollment enrollment = enrollmentService.enroll(user.getId(), request.getSectionId());
        return ResponseEntity.ok(ApiResponse.success("Đăng ký học phần thành công", enrollment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancel(@AuthenticationPrincipal UserPrincipal user,
                                                     @PathVariable Long id) {
        enrollmentService.cancelEnrollment(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Hủy đăng ký thành công"));
    }
}
