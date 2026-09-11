package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.GradeRequest;
import com.sms.entity.Grade;
import com.sms.security.UserPrincipal;
import com.sms.service.GradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<ApiResponse<List<Grade>>> getBySection(@PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.success(gradeService.findBySection(sectionId)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Grade>> saveGrade(@AuthenticationPrincipal UserPrincipal user,
                                                        @RequestBody GradeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm thành công",
                gradeService.saveGrade(user.getId(), request)));
    }

    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Void>> saveGrades(@AuthenticationPrincipal UserPrincipal user,
                                                        @RequestBody List<GradeRequest> requests) {
        gradeService.saveGrades(user.getId(), requests);
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm hàng loạt thành công"));
    }
}
