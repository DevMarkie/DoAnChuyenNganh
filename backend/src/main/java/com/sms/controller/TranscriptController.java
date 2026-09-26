package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.TranscriptResponse;
import com.sms.security.UserPrincipal;
import com.sms.service.StudentService;
import com.sms.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transcript")
@RequiredArgsConstructor
public class TranscriptController {

    private final TranscriptService transcriptService;
    private final StudentService studentService;

    /**
     * Sinh viên xem bảng điểm của mình (BR-08)
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<TranscriptResponse>> getMyTranscript(
            @AuthenticationPrincipal UserPrincipal user) {
        var student = studentService.findByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(transcriptService.getTranscript(student.getId())));
    }

    /**
     * Admin xem bảng điểm bất kỳ sinh viên
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TranscriptResponse>> getStudentTranscript(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(transcriptService.getTranscript(studentId)));
    }
}
