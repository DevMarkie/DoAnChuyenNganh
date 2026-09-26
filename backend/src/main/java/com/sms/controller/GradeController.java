package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.GradeRequest;
import com.sms.entity.Grade;
import com.sms.security.UserPrincipal;
import com.sms.service.ExcelExportService;
import com.sms.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;
    private final ExcelExportService excelExportService;

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<List<Grade>>> getBySection(@PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.success(gradeService.findBySection(sectionId)));
    }

    /**
     * Xuất bảng điểm lớp học phần ra file Excel (.xlsx)
     */
    @GetMapping("/section/{sectionId}/export")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<byte[]> exportGradeSheet(@PathVariable Long sectionId) throws IOException {
        byte[] excelData = excelExportService.exportGradeSheet(sectionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bang_diem_" + sectionId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Grade>> saveGrade(@AuthenticationPrincipal UserPrincipal user,
                                                        @Valid @RequestBody GradeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm thành công",
                gradeService.saveGrade(user.getId(), request)));
    }

    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Void>> saveGrades(@AuthenticationPrincipal UserPrincipal user,
                                                        @Valid @RequestBody List<@Valid GradeRequest> requests) {
        gradeService.saveGrades(user.getId(), requests);
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm hàng loạt thành công"));
    }
}
