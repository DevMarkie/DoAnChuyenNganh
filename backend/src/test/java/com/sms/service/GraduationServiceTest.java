package com.sms.service;

import com.sms.dto.response.GraduationEligibilityResponse;
import com.sms.entity.ClassEntity;
import com.sms.entity.Cohort;
import com.sms.entity.GraduationRecord;
import com.sms.entity.Student;
import com.sms.entity.User;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CohortRepository;
import com.sms.repository.GraduationRecordRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.IncorrectResultSizeDataAccessException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GraduationServiceTest {

    @Mock
    private GraduationRecordRepository graduationRecordRepository;

    @Mock
    private CurriculumService curriculumService;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private CohortRepository cohortRepository;

    @Mock
    private TuitionService tuitionService;

    @InjectMocks
    private GraduationService graduationService;

    private Cohort cohort;
    private ClassEntity classEntity;
    private Student student;
    private User staffUser;

    @BeforeEach
    void setUp() {
        cohort = new Cohort();
        cohort.setId(1);
        cohort.setName("K16");

        classEntity = new ClassEntity();
        classEntity.setId(10);
        classEntity.setName("CNPM01");
        classEntity.setCohort(cohort);

        student = new Student();
        student.setId(100L);
        student.setStudentCode("SV2026-001");
        student.setFullName("Nguyễn Văn A");
        student.setStatus(Student.StudentStatus.ACTIVE);
        student.setClassEntity(classEntity);
        student.setFinancialHold(false);

        staffUser = new User();
        staffUser.setId(1L);
        staffUser.setUsername("daotao");
    }

    @Nested
    @DisplayName("1. assessCohortCandidates - Thẩm định điều kiện chuẩn đầu ra tốt nghiệp")
    class AssessCohortCandidatesTests {

        @Test
        @DisplayName("Sinh viên hoàn thành CTĐT, đủ tín chỉ, CPA >= 2.0, không nợ học phí và đủ 4 chứng chỉ -> QUALIFIED")
        void testAssess_AllRequirementsMet_Qualified() {
            when(cohortRepository.findById(1)).thenReturn(Optional.of(cohort));
            when(studentRepository.findAll()).thenReturn(List.of(student));

            GraduationEligibilityResponse eligibility = GraduationEligibilityResponse.builder()
                    .studentId(100L)
                    .studentCode("SV2026-001")
                    .studentName("Nguyễn Văn A")
                    .eligible(true)
                    .completedCredits(135)
                    .requiredCredits(135)
                    .cumulativeGpa(BigDecimal.valueOf(3.45))
                    .unsatisfiedReasons(Collections.emptyList())
                    .build();

            when(curriculumService.checkGraduationEligibility(100L)).thenReturn(eligibility);
            when(tuitionService.isTuitionOverdue(100L)).thenReturn(false);

            GraduationRecord existingRecord = GraduationRecord.builder()
                    .id(50L)
                    .student(student)
                    .cohort(cohort)
                    .physicalEducationPassed(true)
                    .defenseEducationPassed(true)
                    .englishCertificateStatus(true)
                    .itCertificateStatus(true)
                    .build();

            when(graduationRecordRepository.findByStudentId(100L)).thenReturn(Optional.of(existingRecord));
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));

            List<GraduationRecord> results = graduationService.assessCohortCandidates(1);

            assertThat(results).hasSize(1);
            GraduationRecord record = results.get(0);
            assertThat(record.getSystemRecommendation()).isEqualTo("QUALIFIED");
            assertThat(record.getNote()).contains("Đủ điều kiện tốt nghiệp");
            assertThat(record.getTotalCreditsAccumulated()).isEqualTo(135);
            assertThat(record.getCumulativeGpa()).isEqualTo(BigDecimal.valueOf(3.45));
            assertThat(record.getTuitionCleared()).isTrue();
            assertThat(record.getPhysicalEducationPassed()).isTrue();
            assertThat(record.getDefenseEducationPassed()).isTrue();
            assertThat(record.getEnglishCertificateStatus()).isTrue();
            assertThat(record.getItCertificateStatus()).isTrue();
        }

        @Test
        @DisplayName("Nợ học phí (Tuition Overdue) -> DISQUALIFIED và nêu rõ lý do")
        void testAssess_TuitionDebt_Disqualified() {
            when(cohortRepository.findById(1)).thenReturn(Optional.of(cohort));
            when(studentRepository.findAll()).thenReturn(List.of(student));

            GraduationEligibilityResponse eligibility = GraduationEligibilityResponse.builder()
                    .studentId(100L)
                    .eligible(false)
                    .completedCredits(135)
                    .requiredCredits(135)
                    .cumulativeGpa(BigDecimal.valueOf(3.20))
                    .unsatisfiedReasons(List.of("Chưa hoàn thành công nợ học phí"))
                    .build();

            when(curriculumService.checkGraduationEligibility(100L)).thenReturn(eligibility);
            lenient().when(tuitionService.isTuitionOverdue(100L)).thenReturn(true);
            when(graduationRecordRepository.findByStudentId(100L)).thenReturn(Optional.empty());
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));

            List<GraduationRecord> results = graduationService.assessCohortCandidates(1);

            assertThat(results).hasSize(1);
            GraduationRecord record = results.get(0);
            assertThat(record.getSystemRecommendation()).isEqualTo("DISQUALIFIED");
            assertThat(record.getTuitionCleared()).isFalse();
            assertThat(record.getNote()).contains("Chưa hoàn thành công nợ học phí");
        }

        @Test
        @DisplayName("Thiếu Chứng chỉ Tin học (IT Certificate) -> DISQUALIFIED")
        void testAssess_MissingITCertificate_Disqualified() {
            when(cohortRepository.findById(1)).thenReturn(Optional.of(cohort));
            when(studentRepository.findAll()).thenReturn(List.of(student));

            GraduationEligibilityResponse eligibility = GraduationEligibilityResponse.builder()
                    .studentId(100L)
                    .eligible(true)
                    .completedCredits(135)
                    .requiredCredits(135)
                    .cumulativeGpa(BigDecimal.valueOf(3.50))
                    .unsatisfiedReasons(Collections.emptyList())
                    .build();

            when(curriculumService.checkGraduationEligibility(100L)).thenReturn(eligibility);
            when(tuitionService.isTuitionOverdue(100L)).thenReturn(false);

            GraduationRecord recordMissingIT = GraduationRecord.builder()
                    .id(51L)
                    .student(student)
                    .cohort(cohort)
                    .physicalEducationPassed(true)
                    .defenseEducationPassed(true)
                    .englishCertificateStatus(true)
                    .itCertificateStatus(false) // Thiếu chứng chỉ tin học
                    .build();

            when(graduationRecordRepository.findByStudentId(100L)).thenReturn(Optional.of(recordMissingIT));
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));

            List<GraduationRecord> results = graduationService.assessCohortCandidates(1);

            assertThat(results).hasSize(1);
            GraduationRecord record = results.get(0);
            assertThat(record.getSystemRecommendation()).isEqualTo("DISQUALIFIED");
            assertThat(record.getNote()).contains("Chứng chỉ Tin học");
        }

        @Test
        @DisplayName("Thiếu Chứng chỉ Ngoại ngữ (English Certificate) -> DISQUALIFIED")
        void testAssess_MissingEnglishCertificate_Disqualified() {
            when(cohortRepository.findById(1)).thenReturn(Optional.of(cohort));
            when(studentRepository.findAll()).thenReturn(List.of(student));

            GraduationEligibilityResponse eligibility = GraduationEligibilityResponse.builder()
                    .studentId(100L)
                    .eligible(true)
                    .completedCredits(135)
                    .requiredCredits(135)
                    .cumulativeGpa(BigDecimal.valueOf(3.10))
                    .unsatisfiedReasons(Collections.emptyList())
                    .build();

            when(curriculumService.checkGraduationEligibility(100L)).thenReturn(eligibility);
            when(tuitionService.isTuitionOverdue(100L)).thenReturn(false);

            GraduationRecord recordMissingEng = GraduationRecord.builder()
                    .id(52L)
                    .student(student)
                    .cohort(cohort)
                    .physicalEducationPassed(true)
                    .defenseEducationPassed(true)
                    .englishCertificateStatus(false) // Thiếu ngoại ngữ
                    .itCertificateStatus(true)
                    .build();

            when(graduationRecordRepository.findByStudentId(100L)).thenReturn(Optional.of(recordMissingEng));
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));

            List<GraduationRecord> results = graduationService.assessCohortCandidates(1);

            assertThat(results).hasSize(1);
            GraduationRecord record = results.get(0);
            assertThat(record.getSystemRecommendation()).isEqualTo("DISQUALIFIED");
            assertThat(record.getNote()).contains("Chứng chỉ Ngoại ngữ");
        }

        @Test
        @DisplayName("Chưa hoàn thành chuẩn GDTC hoặc GDQP -> DISQUALIFIED")
        void testAssess_MissingPhysicalOrDefenseEducation_Disqualified() {
            when(cohortRepository.findById(1)).thenReturn(Optional.of(cohort));
            when(studentRepository.findAll()).thenReturn(List.of(student));

            GraduationEligibilityResponse eligibility = GraduationEligibilityResponse.builder()
                    .studentId(100L)
                    .eligible(true)
                    .completedCredits(135)
                    .requiredCredits(135)
                    .cumulativeGpa(BigDecimal.valueOf(3.25))
                    .unsatisfiedReasons(Collections.emptyList())
                    .build();

            when(curriculumService.checkGraduationEligibility(100L)).thenReturn(eligibility);
            when(tuitionService.isTuitionOverdue(100L)).thenReturn(false);

            GraduationRecord recordMissingPEandDef = GraduationRecord.builder()
                    .id(53L)
                    .student(student)
                    .cohort(cohort)
                    .physicalEducationPassed(false) // Thiếu GDTC
                    .defenseEducationPassed(false)  // Thiếu GDQP
                    .englishCertificateStatus(true)
                    .itCertificateStatus(true)
                    .build();

            when(graduationRecordRepository.findByStudentId(100L)).thenReturn(Optional.of(recordMissingPEandDef));
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));

            List<GraduationRecord> results = graduationService.assessCohortCandidates(1);

            assertThat(results).hasSize(1);
            GraduationRecord record = results.get(0);
            assertThat(record.getSystemRecommendation()).isEqualTo("DISQUALIFIED");
            assertThat(record.getNote()).contains("GDTC");
            assertThat(record.getNote()).contains("GDQP");
        }

        @Test
        @DisplayName("Không tìm thấy khóa tuyển sinh -> Ném ResourceNotFoundException")
        void testAssess_CohortNotFound_ThrowsException() {
            when(cohortRepository.findById(999)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> graduationService.assessCohortCandidates(999));
        }

        @Test
        @DisplayName("Dữ liệu cũ bị trùng hồ sơ -> dùng bản ghi mới nhất, không làm gián đoạn xét cả khóa")
        void testAssess_DuplicateLegacyRecords_UsesLatestRecord() {
            when(cohortRepository.findById(1)).thenReturn(Optional.of(cohort));
            when(studentRepository.findAll()).thenReturn(List.of(student));

            GraduationEligibilityResponse eligibility = GraduationEligibilityResponse.builder()
                    .studentId(100L)
                    .eligible(true)
                    .completedCredits(135)
                    .requiredCredits(135)
                    .cumulativeGpa(BigDecimal.valueOf(3.50))
                    .unsatisfiedReasons(Collections.emptyList())
                    .build();
            when(curriculumService.checkGraduationEligibility(100L)).thenReturn(eligibility);
            when(tuitionService.isTuitionOverdue(100L)).thenReturn(false);
            when(graduationRecordRepository.findByStudentId(100L))
                    .thenThrow(new IncorrectResultSizeDataAccessException(2));

            GraduationRecord latestRecord = GraduationRecord.builder()
                    .id(99L)
                    .student(student)
                    .cohort(cohort)
                    .physicalEducationPassed(true)
                    .defenseEducationPassed(true)
                    .englishCertificateStatus(true)
                    .itCertificateStatus(true)
                    .build();
            when(graduationRecordRepository.findFirstByStudentIdOrderByUpdatedAtDescIdDesc(100L))
                    .thenReturn(Optional.of(latestRecord));
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));

            List<GraduationRecord> results = graduationService.assessCohortCandidates(1);

            assertThat(results).containsExactly(latestRecord);
            assertThat(latestRecord.getSystemRecommendation()).isEqualTo("QUALIFIED");
            verify(graduationRecordRepository).findFirstByStudentIdOrderByUpdatedAtDescIdDesc(100L);
        }
    }

    @Nested
    @DisplayName("2. approveGraduation & batchApprove - Phê duyệt hồ sơ tốt nghiệp")
    class ApproveGraduationTests {

        @Test
        @DisplayName("approveGraduation: Chuyển officialStatus sang APPROVED, cấp số quyết định và đổi trạng thái sinh viên sang GRADUATED")
        void testApproveGraduation_Success() {
            GraduationRecord record = GraduationRecord.builder()
                    .id(10L)
                    .student(student)
                    .cohort(cohort)
                    .officialStatus("PENDING")
                    .systemRecommendation("QUALIFIED")
                    .build();

            when(graduationRecordRepository.findById(10L)).thenReturn(Optional.of(record));
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            GraduationRecord approved = graduationService.approveGraduation(10L, staffUser, "QD-2026/DH-CNPM");

            assertThat(approved.getOfficialStatus()).isEqualTo("APPROVED");
            assertThat(approved.getGraduationDecisionNo()).isEqualTo("QD-2026/DH-CNPM");
            assertThat(approved.getDecisionDate()).isEqualTo(LocalDate.now());
            assertThat(approved.getAssessedBy()).isEqualTo(staffUser);

            // Kiểm tra trạng thái sinh viên được cập nhật chính xác sang GRADUATED
            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.GRADUATED);
            verify(studentRepository).save(student);
            verify(graduationRecordRepository).save(record);
        }

        @Test
        @DisplayName("approveGraduation: Không tìm thấy hồ sơ -> Ném ResourceNotFoundException")
        void testApproveGraduation_RecordNotFound_ThrowsException() {
            when(graduationRecordRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> graduationService.approveGraduation(999L, staffUser, "QD-01"));
        }

        @Test
        @DisplayName("batchApprove: Chỉ duyệt các hồ sơ QUALIFIED và chưa APPROVED")
        void testBatchApprove_OnlyApprovesQualifiedRecords() {
            GraduationRecord qualifiedRecord = GraduationRecord.builder()
                    .id(1L)
                    .student(student)
                    .cohort(cohort)
                    .systemRecommendation("QUALIFIED")
                    .officialStatus("PENDING")
                    .build();

            Student student2 = new Student();
            student2.setId(200L);
            student2.setStatus(Student.StudentStatus.ACTIVE);

            GraduationRecord disqualifiedRecord = GraduationRecord.builder()
                    .id(2L)
                    .student(student2)
                    .cohort(cohort)
                    .systemRecommendation("DISQUALIFIED")
                    .officialStatus("PENDING")
                    .build();

            Page<GraduationRecord> page = new PageImpl<>(List.of(qualifiedRecord, disqualifiedRecord));
            when(graduationRecordRepository.findByCohortId(eq(1), any(Pageable.class))).thenReturn(page);
            when(graduationRecordRepository.findById(1L)).thenReturn(Optional.of(qualifiedRecord));
            when(graduationRecordRepository.save(any(GraduationRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            List<GraduationRecord> approvedList = graduationService.batchApprove(1, staffUser, "QD-BATCH-2026");

            assertThat(approvedList).hasSize(1);
            assertThat(approvedList.get(0).getId()).isEqualTo(1L);
            assertThat(approvedList.get(0).getOfficialStatus()).isEqualTo("APPROVED");
            verify(studentRepository, times(1)).save(student);
            verify(studentRepository, never()).save(student2);
        }
    }

    @Nested
    @DisplayName("3. getGraduationRecords - Tra cứu & Phân trang hồ sơ xét tốt nghiệp")
    class QueryGraduationRecordsTests {

        @Test
        @DisplayName("Tra cứu theo Khóa và Trạng thái chính thức (officialStatus)")
        void testGetGraduationRecords_ByCohortAndStatus() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<GraduationRecord> mockPage = new PageImpl<>(List.of(new GraduationRecord()));
            when(graduationRecordRepository.findByCohortIdAndOfficialStatus(1, "APPROVED", pageable))
                    .thenReturn(mockPage);

            Page<GraduationRecord> result = graduationService.getGraduationRecords(1, "APPROVED", pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(graduationRecordRepository).findByCohortIdAndOfficialStatus(1, "APPROVED", pageable);
        }

        @Test
        @DisplayName("Tra cứu theo Khóa học (tất cả trạng thái)")
        void testGetGraduationRecords_ByCohortOnly() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<GraduationRecord> mockPage = new PageImpl<>(List.of(new GraduationRecord()));
            when(graduationRecordRepository.findByCohortId(1, pageable)).thenReturn(mockPage);

            Page<GraduationRecord> result = graduationService.getGraduationRecords(1, "ALL", pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(graduationRecordRepository).findByCohortId(1, pageable);
        }
    }
}
