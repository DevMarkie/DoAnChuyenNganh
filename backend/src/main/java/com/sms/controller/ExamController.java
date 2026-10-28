package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.AutoAssignExamRoomsRequest;
import com.sms.dto.request.ExamGradeCommitRequest;
import com.sms.dto.request.ExamRoomRequest;
import com.sms.dto.request.ExamSessionRequest;
import com.sms.dto.response.ExamGradeImportRow;
import com.sms.dto.response.ExamRoomResponse;
import com.sms.dto.response.ExamRosterResponse;
import com.sms.dto.response.ExamSessionResponse;
import com.sms.entity.GradeAuditLog;
import com.sms.security.UserPrincipal;
import com.sms.service.ExcelExportService;
import com.sms.service.ExcelImportService;
import com.sms.service.ExamService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final ExcelExportService excelExportService;
    private final ExcelImportService excelImportService;

    // ==========================================
    // EXAM SESSIONS
    // ==========================================

    @PostMapping("/exam-sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<ExamSessionResponse>> createSession(@Valid @RequestBody ExamSessionRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Tạo ca thi thành công", examService.createSession(req)));
    }

    @GetMapping("/exam-sessions/semester/{semesterId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<ExamSessionResponse>>> getSessionsBySemester(@PathVariable Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(examService.getSessionsBySemester(semesterId)));
    }

    @GetMapping("/exam-sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS', 'LECTURER')")
    public ResponseEntity<ApiResponse<ExamSessionResponse>> getSessionById(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(examService.getSessionById(sessionId)));
    }

    @DeleteMapping("/exam-sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long sessionId) {
        examService.deleteSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Xóa ca thi thành công"));
    }

    // ==========================================
    // EXAM ROOMS & AUTO ASSIGNMENT
    // ==========================================

    @PostMapping("/exam-sessions/{sessionId}/rooms")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<ExamRoomResponse>> createRoom(
            @PathVariable Long sessionId,
            @Valid @RequestBody ExamRoomRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Tạo phòng thi thành công", examService.createRoom(sessionId, req)));
    }

    @GetMapping("/exam-sessions/{sessionId}/rooms")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<ExamRoomResponse>>> getRoomsBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(examService.getRoomsBySession(sessionId)));
    }

    @GetMapping("/exam-rooms/{roomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS', 'LECTURER')")
    public ResponseEntity<ApiResponse<ExamRoomResponse>> getRoomById(@PathVariable Long roomId) {
        return ResponseEntity.ok(ApiResponse.success(examService.getRoomById(roomId)));
    }

    @DeleteMapping("/exam-rooms/{roomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long roomId) {
        examService.deleteRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success("Xóa phòng thi thành công"));
    }

    @PostMapping("/exam-sessions/{sessionId}/auto-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<List<ExamRoomResponse>>> autoAssign(
            @PathVariable Long sessionId,
            @RequestBody(required = false) AutoAssignExamRoomsRequest req) {
        AutoAssignExamRoomsRequest actualReq = req != null ? req : new AutoAssignExamRoomsRequest();
        List<ExamRoomResponse> rooms = examService.autoAssignRooms(sessionId, actualReq);
        return ResponseEntity.ok(ApiResponse.success("Tự động phân phòng thi và cấp Số báo danh thành công", rooms));
    }

    // ==========================================
    // ROSTER & EXCEL IMPORT / EXPORT
    // ==========================================

    @GetMapping("/exam-rooms/{roomId}/roster")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<ExamRosterResponse>>> getRosterByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(ApiResponse.success(examService.getRosterByRoom(roomId)));
    }

    @GetMapping("/exam-rooms/{roomId}/export-template")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS', 'LECTURER')")
    public ResponseEntity<byte[]> exportTemplate(@PathVariable Long roomId) throws IOException {
        byte[] excelData = excelExportService.exportExamRoomRoster(roomId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=phong_thi_" + roomId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @PostMapping(value = "/exam-rooms/{roomId}/import-preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<List<ExamGradeImportRow>>> importPreview(
            @PathVariable Long roomId,
            @RequestParam("file") MultipartFile file) {
        List<ExamGradeImportRow> preview = excelImportService.parseExamGradeImport(roomId, file);
        return ResponseEntity.ok(ApiResponse.success("Đối soát bảng điểm phòng thi thành công", preview));
    }

    @PostMapping("/exam-rooms/{roomId}/import-commit")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Void>> importCommit(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId,
            @Valid @RequestBody ExamGradeCommitRequest req) {
        examService.commitExamGrades(user.getId(), roomId, req);
        return ResponseEntity.ok(ApiResponse.success("Nạp điểm thi thành công, đã tự động khóa sổ bảng điểm"));
    }

    @GetMapping("/exam-rooms/{roomId}/audit-logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINATION_OFFICER', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<List<com.sms.dto.response.GradeAuditLogResponse>>> getAuditLogs(@PathVariable Long roomId) {
        List<com.sms.dto.response.GradeAuditLogResponse> logs = examService.getAuditLogsByRoom(roomId)
                .stream()
                .map(com.sms.dto.response.GradeAuditLogResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
