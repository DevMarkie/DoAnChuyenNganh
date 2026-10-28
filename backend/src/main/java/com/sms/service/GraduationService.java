package com.sms.service;

import com.sms.dto.response.GraduationEligibilityResponse;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GraduationService {

    private final GraduationRecordRepository graduationRecordRepository;
    private final CurriculumService curriculumService;
    private final StudentRepository studentRepository;
    private final CohortRepository cohortRepository;

    @Transactional
    public List<GraduationRecord> assessCohortCandidates(Integer cohortId) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa tuyển sinh: " + cohortId));

        List<Student> students = studentRepository.findAll().stream()
                .filter(s -> s.getClassEntity() != null 
                        && s.getClassEntity().getCohort() != null 
                        && s.getClassEntity().getCohort().getId().equals(cohortId))
                .toList();

        List<GraduationRecord> results = new ArrayList<>();
        for (Student student : students) {
            GraduationEligibilityResponse eligibility = curriculumService.checkGraduationEligibility(student.getId());

            GraduationRecord record = graduationRecordRepository.findByStudentId(student.getId())
                    .orElseGet(() -> GraduationRecord.builder()
                            .student(student)
                            .cohort(cohort)
                            .build());

            record.setTotalCreditsAccumulated(eligibility.getCompletedCredits());
            record.setCumulativeGpa(eligibility.getCumulativeGpa() != null ? eligibility.getCumulativeGpa() : BigDecimal.ZERO);
            record.setTuitionCleared(!eligibility.getUnsatisfiedReasons().contains("Chưa hoàn thành công nợ học phí"));
            record.setPhysicalEducationPassed(true); // chuẩn đầu ra
            record.setDefenseEducationPassed(true);
            record.setEnglishCertificateStatus(true);
            record.setSystemRecommendation(eligibility.isEligible() ? "QUALIFIED" : "DISQUALIFIED");
            if (!eligibility.isEligible() && eligibility.getUnsatisfiedReasons() != null && !eligibility.getUnsatisfiedReasons().isEmpty()) {
                record.setNote(String.join("; ", eligibility.getUnsatisfiedReasons()));
            } else {
                record.setNote("Đủ điều kiện tốt nghiệp theo chuẩn Khung CTĐT");
            }

            results.add(graduationRecordRepository.save(record));
        }

        return results;
    }

    public Page<GraduationRecord> getGraduationRecords(Integer cohortId, String status, Pageable pageable) {
        if (cohortId != null && status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            return graduationRecordRepository.findByCohortIdAndOfficialStatus(cohortId, status.toUpperCase(), pageable);
        } else if (cohortId != null) {
            return graduationRecordRepository.findByCohortId(cohortId, pageable);
        }
        return graduationRecordRepository.findAll(pageable);
    }

    @Transactional
    public GraduationRecord approveGraduation(Long recordId, User staffUser, String decisionNo) {
        GraduationRecord record = graduationRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tốt nghiệp: " + recordId));

        record.setOfficialStatus("APPROVED");
        record.setAssessedBy(staffUser);
        record.setGraduationDecisionNo(decisionNo != null ? decisionNo : "QD-TN-" + LocalDate.now().getYear());
        record.setDecisionDate(LocalDate.now());

        Student student = record.getStudent();
        if (student != null) {
            student.setStatus(Student.StudentStatus.GRADUATED);
            studentRepository.save(student);
        }

        return graduationRecordRepository.save(record);
    }

    @Transactional
    public List<GraduationRecord> batchApprove(Integer cohortId, User staffUser, String decisionNo) {
        List<GraduationRecord> records = graduationRecordRepository.findByCohortId(cohortId, Pageable.unpaged()).getContent()
                .stream()
                .filter(r -> "QUALIFIED".equalsIgnoreCase(r.getSystemRecommendation()) && !"APPROVED".equalsIgnoreCase(r.getOfficialStatus()))
                .toList();

        List<GraduationRecord> approved = new ArrayList<>();
        for (GraduationRecord r : records) {
            approved.add(approveGraduation(r.getId(), staffUser, decisionNo));
        }
        return approved;
    }
}
