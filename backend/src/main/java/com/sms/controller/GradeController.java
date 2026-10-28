package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.GradeRequest;
import com.sms.dto.response.GradeImportRow;
import com.sms.entity.Grade;
import com.sms.security.UserPrincipal;
import com.sms.service.ExcelExportService;
import com.sms.service.ExcelImportService;
import com.sms.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;
    private final ExcelExportService excelExportService;
    private final ExcelImportService excelImportService;

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<Grade>>> getBySection(@AuthenticationPrincipal UserPrincipal user,
                                                                 @PathVariable Long sectionId) {
        gradeService.assertCanViewSection(user.getId(), sectionId);
        return ResponseEntity.ok(ApiResponse.success(gradeService.findBySection(sectionId)));
    }

    /**
     * BR-Grade09: Xem lịch sử nhật ký kiểm toán sửa điểm của toàn bộ lớp học phần
     */
    @GetMapping("/section/{sectionId}/audit-logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<com.sms.dto.response.GradeAuditLogResponse>>> getSectionAuditLogs(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId) {
        gradeService.assertCanViewSection(user.getId(), sectionId);
        List<com.sms.dto.response.GradeAuditLogResponse> logs = gradeService.getSectionAuditLogs(sectionId)
                .stream()
                .map(com.sms.dto.response.GradeAuditLogResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    /**
     * BR-Grade09: Xem lịch sử nhật ký kiểm toán sửa điểm của một đầu điểm cụ thể
     */
    @GetMapping("/{gradeId}/audit-logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<com.sms.dto.response.GradeAuditLogResponse>>> getGradeAuditLogs(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long gradeId) {
        List<com.sms.dto.response.GradeAuditLogResponse> logs = gradeService.getGradeAuditLogs(gradeId)
                .stream()
                .map(com.sms.dto.response.GradeAuditLogResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    /**
     * Xuất bảng điểm lớp học phần ra file Excel (.xlsx)
     */
    @GetMapping("/section/{sectionId}/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<byte[]> exportGradeSheet(@AuthenticationPrincipal UserPrincipal user,
                                                   @PathVariable Long sectionId) throws IOException {
        gradeService.assertCanViewSection(user.getId(), sectionId);
        byte[] excelData = excelExportService.exportGradeSheet(sectionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bang_diem_" + sectionId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    /**
     * Task 4: Tải file Excel MẪU đã điền sẵn roster (Mã ĐK + Mã SV + Họ tên) để GV nhập điểm.
     */
    @GetMapping("/section/{sectionId}/import-template")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<byte[]> downloadImportTemplate(@AuthenticationPrincipal UserPrincipal user,
                                                         @PathVariable Long sectionId) throws IOException {
        gradeService.assertCanViewSection(user.getId(), sectionId);
        byte[] excelData = excelImportService.generateImportTemplate(sectionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mau_nhap_diem_" + sectionId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    /**
     * Task 4: Đọc file GV tải lên và trả về bảng XEM TRƯỚC (preview). KHÔNG lưu —
     * FE hiển thị để đối chiếu; chỉ các dòng hợp lệ mới gửi lại qua PUT /batch.
     */
    @PostMapping(value = "/section/{sectionId}/import-preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<GradeImportRow>>> importPreview(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId,
            @RequestParam("file") MultipartFile file) {
        gradeService.assertCanViewSection(user.getId(), sectionId);
        List<GradeImportRow> preview = excelImportService.parseGradeImport(sectionId, file);
        return ResponseEntity.ok(ApiResponse.success("Đọc file xem trước thành công", preview));
    }

    /**
     * Lưu các dòng hợp lệ sau khi giảng viên đã kiểm tra preview.
     */
    @PutMapping("/section/{sectionId}/import-commit")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<Void>> importCommit(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId,
            @Valid @RequestBody List<@Valid GradeRequest> requests) {
        gradeService.assertCanViewSection(user.getId(), sectionId);
        gradeService.saveImportedGrades(user.getId(), sectionId, requests);
        return ResponseEntity.ok(ApiResponse.success("Nhập điểm từ Excel thành công"));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<Grade>> saveGrade(@AuthenticationPrincipal UserPrincipal user,
                                                        @Valid @RequestBody GradeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm thành công",
                gradeService.saveGrade(user.getId(), request)));
    }

    @PutMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<Void>> saveGrades(@AuthenticationPrincipal UserPrincipal user,
                                                        @Valid @RequestBody List<@Valid GradeRequest> requests) {
        gradeService.saveGrades(user.getId(), requests);
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm hàng loạt thành công"));
    }

    /**
     * Giảng viên bấm nút "Nộp bảng điểm chính thức về Phòng Đào tạo" (khóa sổ điểm)
     */
    @PostMapping("/section/{sectionId}/submit-official")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<ApiResponse<Void>> submitOfficial(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId) {
        gradeService.submitSectionGrades(sectionId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã nộp bảng điểm chính thức thành công về Phòng Đào tạo!"));
    }

    /**
     * Giám sát tiến độ và trạng thái nộp điểm toàn trường dành cho Phòng Đào tạo / Giáo vụ
     */
    @GetMapping("/admin/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<com.sms.dto.response.SectionGradeOverviewDto>>> getAdminOverview(
            @RequestParam(required = false) Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(gradeService.getSectionsGradeOverview(semesterId)));
    }

    /**
     * Phòng Đào tạo bấm nút "Phát hành điểm" để sinh viên toàn trường xem được điểm
     */
    @PostMapping("/section/{sectionId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> publishSection(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId) {
        gradeService.publishSectionGrades(sectionId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã chính thức phát hành bảng điểm học phần cho sinh viên!"));
    }

    /**
     * Phòng Đào tạo trả về yêu cầu giảng viên chỉnh sửa điểm kèm lý do
     */
    @PostMapping("/section/{sectionId}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> returnSection(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId,
            @RequestBody(required = false) com.sms.dto.request.GradeReturnRequest request) {
        String reason = (request != null && request.getReason() != null) ? request.getReason() : "Phòng Đào tạo yêu cầu chỉnh sửa lại bảng điểm";
        gradeService.returnSectionGrades(sectionId, user.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Đã trả về bảng điểm thành công để giảng viên cập nhật"));
    }

    /**
     * Phòng Đào tạo mở khóa / trả về để giảng viên chỉnh sửa điểm (tương thích ngược)
     */
    @PostMapping("/section/{sectionId}/unpublish")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Void>> unpublishSection(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId,
            @RequestParam(required = false, defaultValue = "Phòng Đào tạo mở khóa điều chỉnh") String reason) {
        gradeService.unpublishSectionGrades(sectionId, user.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Đã mở khóa bảng điểm thành công để giảng viên cập nhật"));
    }
}
