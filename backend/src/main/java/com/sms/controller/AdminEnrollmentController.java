package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.entity.Enrollment;
import com.sms.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
public class AdminEnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<Enrollment>> assignStudent(
            @RequestParam Long studentId,
            @RequestParam Long sectionId
    ) {
        Enrollment res = enrollmentService.adminAssign(studentId, sectionId);
        return ResponseEntity.ok(ApiResponse.success("Xếp lớp học phần cho sinh viên thành công", res));
    }

    @PostMapping("/batch-assign-class")
    public ResponseEntity<ApiResponse<List<Enrollment>>> batchAssignClass(
            @RequestParam Integer classId,
            @RequestParam Long sectionId
    ) {
        List<Enrollment> list = enrollmentService.adminBatchAssignClass(classId, sectionId);
        return ResponseEntity.ok(ApiResponse.success("Đã xếp lớp học phần thành công cho " + list.size() + " sinh viên của lớp", list));
    }
}
