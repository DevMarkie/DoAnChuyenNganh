package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.GradeAuditLogResponse;
import com.sms.entity.GradeAuditLog;
import com.sms.entity.Student;
import com.sms.repository.GradeAuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GradeAuditLogControllerTest {

    @Mock
    private GradeAuditLogRepository gradeAuditLogRepository;

    @InjectMocks
    private GradeAuditLogController gradeAuditLogController;

    private GradeAuditLog auditLog;

    @BeforeEach
    void setUp() {
        Student student = new Student();
        student.setId(10L);
        student.setStudentCode("SV2026001");
        student.setFullName("Nguyen Van A");

        auditLog = GradeAuditLog.builder()
                .id(1L)
                .student(student)
                .component("CC1")
                .oldScore(BigDecimal.valueOf(8.0))
                .newScore(BigDecimal.valueOf(9.0))
                .reason("Cập nhật điểm chuyên cần")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void searchAuditLogs_ReturnsPagedResults() {
        Page<GradeAuditLog> page = new PageImpl<>(List.of(auditLog));
        when(gradeAuditLogRepository.searchLogs(eq("SV2026001"), eq("CC1"), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<GradeAuditLogResponse>>> response =
                gradeAuditLogController.searchAuditLogs("SV2026001", "CC1", null, null, null, 0, 20);

        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getTotalElements());
        assertEquals("SV2026001", response.getBody().getData().getContent().get(0).getStudentCode());
        assertEquals("CC1", response.getBody().getData().getContent().get(0).getComponent());
    }
}
