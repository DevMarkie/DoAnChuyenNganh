package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.AcademicWarningResponse;
import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.Student;
import com.sms.service.AcademicWarningService;
import com.sms.service.StudentService;
import com.sms.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/academic-warnings")
@RequiredArgsConstructor
public class AcademicWarningController {

    private final StudentService studentService;
    private final TranscriptService transcriptService;
    private final AcademicWarningService academicWarningService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<List<AcademicWarningResponse>>> getWarnings(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) Integer majorId) {
        List<Student> students = studentService.findAll().stream()
                .filter(student -> majorId == null
                        || (student.getClassEntity() != null && student.getClassEntity().getMajor() != null
                        && majorId.equals(student.getClassEntity().getMajor().getId())))
                .toList();
        List<AcademicWarningResponse> warnings = transcriptService.getTranscripts(students).stream()
                .filter(transcript -> transcript.getWarningLevel() > 0)
                .filter(transcript -> level == null || transcript.getWarningLevel() == level)
                .map(transcript -> toWarningResponse(transcript, semesterId))
                .filter(response -> response != null)
                .sorted(Comparator.comparing(AcademicWarningResponse::getWarningLevel).reversed()
                        .thenComparing(AcademicWarningResponse::getStudentCode))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(warnings));
    }

    @PostMapping("/scan")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> scanAcademicStanding(
            @RequestParam(required = false) Integer semesterId) {
        Map<String, Object> result = academicWarningService.scanAndApplyAcademicWarnings(semesterId);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn tất quét và xử lý quy chế học vụ tự động", result));
    }

    private AcademicWarningResponse toWarningResponse(TranscriptResponse transcript, Integer semesterId) {
        TranscriptResponse.SemesterGrade targetSemester;
        if (semesterId != null) {
            targetSemester = transcript.getSemesters().stream()
                    .filter(s -> semesterId.equals(s.getSemesterId()))
                    .findFirst()
                    .orElse(null);
            if (targetSemester == null) {
                return null;
            }
        } else {
            targetSemester = transcript.getSemesters().stream()
                    .max(Comparator.comparing(TranscriptResponse.SemesterGrade::getSemesterId))
                    .orElse(null);
        }
        String statusText = switch (transcript.getWarningLevel()) {
            case 3 -> "BUỘC THÔI HỌC";
            case 2 -> "MỨC 2";
            default -> "MỨC 1";
        };

        int maxCredits = transcript.getMaxAllowedCredits() != null 
                ? transcript.getMaxAllowedCredits()
                : (switch (transcript.getWarningLevel()) {
                    case 3 -> 0;
                    case 2 -> 10;
                    case 1 -> 14;
                    default -> 24;
                });

        return AcademicWarningResponse.builder()
                .studentId(transcript.getStudentId())
                .studentCode(transcript.getStudentCode())
                .studentName(transcript.getStudentName())
                .className(transcript.getClassName())
                .cumulativeGpa(transcript.getCumulativeGpa())
                .academicStanding(transcript.getAcademicStanding())
                .semesterId(targetSemester == null ? null : targetSemester.getSemesterId())
                .semesterName(targetSemester == null ? null : targetSemester.getSemesterName())
                .semesterGpa(targetSemester == null ? null : targetSemester.getSemesterGpa())
                .warningLevel(transcript.getWarningLevel())
                .warningStatus(statusText)
                .debtCredits(transcript.getDebtCredits())
                .warningNotice(transcript.getWarningNotice())
                .nextSemesterMaxCredits(maxCredits)
                .build();
    }
}
