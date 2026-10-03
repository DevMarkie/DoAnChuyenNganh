package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.AcademicWarningResponse;
import com.sms.dto.response.TranscriptResponse;
import com.sms.service.StudentService;
import com.sms.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/academic-warnings")
@RequiredArgsConstructor
public class AcademicWarningController {

    private final StudentService studentService;
    private final TranscriptService transcriptService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AcademicWarningResponse>>> getWarnings(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) Integer majorId) {
        List<AcademicWarningResponse> warnings = studentService.findAll().stream()
                .filter(student -> majorId == null
                        || (student.getClassEntity() != null && student.getClassEntity().getMajor() != null
                        && majorId.equals(student.getClassEntity().getMajor().getId())))
                .map(student -> transcriptService.getTranscript(student.getId()))
                .filter(transcript -> transcript.getWarningLevel() > 0)
                .filter(transcript -> level == null || transcript.getWarningLevel() == level)
                .map(transcript -> toWarningResponse(transcript, semesterId))
                .filter(response -> response != null)
                .sorted(Comparator.comparing(AcademicWarningResponse::getWarningLevel).reversed()
                        .thenComparing(AcademicWarningResponse::getStudentCode))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(warnings));
    }

    private AcademicWarningResponse toWarningResponse(TranscriptResponse transcript, Integer semesterId) {
        TranscriptResponse.SemesterGrade latest = transcript.getSemesters().stream()
                .max(Comparator.comparing(TranscriptResponse.SemesterGrade::getSemesterId))
                .orElse(null);
        if (semesterId != null && transcript.getSemesters().stream()
                .noneMatch(semester -> semesterId.equals(semester.getSemesterId()))) {
            return null;
        }
        return AcademicWarningResponse.builder()
                .studentId(transcript.getStudentId())
                .studentCode(transcript.getStudentCode())
                .studentName(transcript.getStudentName())
                .className(transcript.getClassName())
                .cumulativeGpa(transcript.getCumulativeGpa())
                .academicStanding(transcript.getAcademicStanding())
                .semesterId(latest == null ? null : latest.getSemesterId())
                .semesterName(latest == null ? null : latest.getSemesterName())
                .semesterGpa(latest == null ? null : latest.getSemesterGpa())
                .warningLevel(transcript.getWarningLevel())
                .warningNotice(transcript.getWarningNotice())
                .build();
    }
}
