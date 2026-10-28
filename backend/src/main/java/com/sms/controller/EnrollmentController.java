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
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<Enrollment>>> getMyEnrollments(@AuthenticationPrincipal UserPrincipal user) {
        var student = studentService.findByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.findByStudent(student.getId())));
    }

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_AFFAIRS','LECTURER','STUDENT')")
    public ResponseEntity<ApiResponse<List<Enrollment>>> getBySection(@AuthenticationPrincipal UserPrincipal user,
                                                                      @PathVariable Long sectionId) {
        enrollmentService.assertCanViewSection(user.getId(), sectionId);
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.findBySection(sectionId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Enrollment>> enroll(@AuthenticationPrincipal UserPrincipal user,
                                                          @Valid @RequestBody EnrollmentRequest request) {
        Enrollment enrollment = enrollmentService.enroll(user.getId(), request.getSectionId());
        return ResponseEntity.ok(ApiResponse.success("Đăng ký học phần thành công", enrollment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> cancel(@AuthenticationPrincipal UserPrincipal user,
                                                     @PathVariable Long id) {
        enrollmentService.cancelEnrollment(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Hủy đăng ký thành công"));
    }

    /**
     * Cán bộ Đào tạo xử lý ngoại lệ: thêm sinh viên vào lớp học phần thủ công
     */
    @PostMapping("/override")
    @PreAuthorize("hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Enrollment>> enrollOverride(
            @RequestParam Long studentId,
            @RequestParam Long sectionId) {
        Enrollment enrollment = enrollmentService.enrollOverride(studentId, sectionId);
        return ResponseEntity.ok(ApiResponse.success("Xử lý ngoại lệ ghi danh sinh viên thành công", enrollment));
    }

    /**
     * Cán bộ Đào tạo xử lý ngoại lệ: hủy ghi danh sinh viên ngoài đợt đăng ký
     */
    @DeleteMapping("/{id}/override")
    @PreAuthorize("hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Void>> cancelOverride(@PathVariable Long id) {
        enrollmentService.cancelEnrollmentOverride(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy đăng ký ngoại lệ thành công"));
    }

    /**
     * Quản trị viên can thiệp tay trạng thái ghi danh
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Enrollment>> adminUpdateStatus(
            @PathVariable Long id,
            @RequestParam Enrollment.EnrollmentStatus status) {
        Enrollment updated = enrollmentService.adminUpdateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái ghi danh thành công", updated));
    }
}
