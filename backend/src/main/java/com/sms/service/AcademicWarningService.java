package com.sms.service;

import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.AcademicSummary;
import com.sms.entity.Notification;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.repository.AcademicSummaryRepository;
import com.sms.repository.SemesterRepository;
import com.sms.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AcademicWarningService {

    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final AcademicSummaryRepository academicSummaryRepository;
    private final TranscriptService transcriptService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * Quét và xử lý học vụ tự động theo học kỳ (Batch Processing 500 SV/lô).
     * BR-Grade04 & Quy chế xử lý học vụ tự động.
     */
    @Transactional
    public Map<String, Object> scanAndApplyAcademicWarnings(Integer semesterId) {
        Semester targetSemester = null;
        if (semesterId != null) {
            targetSemester = semesterRepository.findById(semesterId).orElse(null);
        }
        if (targetSemester == null) {
            targetSemester = semesterRepository.findByIsCurrentTrue()
                    .orElseGet(() -> semesterRepository.findAllByOrderByStartDateDesc().stream()
                            .findFirst().orElse(null));
        }

        if (targetSemester == null) {
            log.warn("Không tìm thấy học kỳ để quét học vụ.");
            return Map.of("message", "Không tìm thấy học kỳ để quét học vụ", "scanned", 0);
        }

        log.info("Bắt đầu quét học vụ tự động cho học kỳ {} ({})", targetSemester.getSemesterCode(), targetSemester.getSemesterName());

        final Semester finalTargetSemester = targetSemester;
        int pageSize = 500;
        int pageIndex = 0;
        int totalScanned = 0;
        int level1Count = 0;
        int level2Count = 0;
        int level3Count = 0;

        Page<Student> studentPage;
        do {
            studentPage = studentRepository.findAll(PageRequest.of(pageIndex, pageSize));
            for (Student student : studentPage.getContent()) {
                totalScanned++;
                try {
                    TranscriptResponse transcript = transcriptService.getTranscript(student.getId());
                    if (transcript == null) continue;

                    int warningLevel = transcript.getWarningLevel();
                    BigDecimal cpa = transcript.getCumulativeGpa();
                    int debtCredits = transcript.getDebtCredits();
                    String notice = transcript.getWarningNotice();

                    // Tìm GPA của kỳ hiện tại đang xét
                    BigDecimal semGpa = null;
                    Integer semCredits = 0;
                    if (transcript.getSemesters() != null) {
                        final Integer semId = targetSemester.getId();
                        for (TranscriptResponse.SemesterGrade s : transcript.getSemesters()) {
                            if (semId.equals(s.getSemesterId())) {
                                semGpa = s.getSemesterGpa();
                                semCredits = s.getSemesterCredits();
                                break;
                            }
                        }
                    }

                    int maxAllowed = switch (warningLevel) {
                        case 3 -> 0;
                        case 2 -> 10;
                        case 1 -> 14;
                        default -> 24;
                    };

                    // Lưu snapshot pre-computed vào bảng academic_summaries
                    AcademicSummary summary = academicSummaryRepository
                            .findByStudentIdAndSemesterId(student.getId(), finalTargetSemester.getId())
                            .orElseGet(() -> AcademicSummary.builder()
                                    .student(student)
                                    .semester(finalTargetSemester)
                                    .build());

                    summary.setSemesterGpa(semGpa);
                    summary.setCumulativeCpa(cpa);
                    summary.setSemesterCredits(semCredits);
                    summary.setAccumulatedCredits(transcript.getTotalCredits());
                    summary.setDebtCredits(debtCredits);
                    summary.setWarningLevel(warningLevel);
                    summary.setMaxAllowedCredits(maxAllowed);
                    summary.setWarningNotice(notice);
                    academicSummaryRepository.save(summary);

                    // Cập nhật trạng thái và mức cảnh báo trực tiếp trên Student để tối ưu O(1) khi ĐKTC
                    student.setAcademicWarningLevel(warningLevel);
                    if (warningLevel == 3) {
                        student.setStatus(Student.StudentStatus.SUSPENDED);
                        level3Count++;
                    } else if (warningLevel == 2) {
                        level2Count++;
                    } else if (warningLevel == 1) {
                        level1Count++;
                    }
                    studentRepository.save(student);

                    // Gửi thông báo nếu bị cảnh báo
                    if (warningLevel > 0) {
                        sendWarningAlerts(student, warningLevel, notice, maxAllowed);
                    }
                } catch (Exception ex) {
                    log.error("Lỗi khi xử lý học vụ cho sinh viên {}: {}", student.getStudentCode(), ex.getMessage());
                }
            }
            pageIndex++;
        } while (studentPage.hasNext());

        log.info("Hoàn tất quét học vụ: Tổng SV={}, Mức 1={}, Mức 2={}, Buộc thôi học={}",
                totalScanned, level1Count, level2Count, level3Count);

        Map<String, Object> result = new HashMap<>();
        result.put("semesterCode", targetSemester.getSemesterCode());
        result.put("semesterName", targetSemester.getSemesterName());
        result.put("totalScanned", totalScanned);
        result.put("level1Count", level1Count);
        result.put("level2Count", level2Count);
        result.put("level3Count", level3Count);
        result.put("totalWarnings", level1Count + level2Count + level3Count);
        return result;
    }

    private void sendWarningAlerts(Student student, int warningLevel, String notice, int maxAllowed) {
        try {
            String title = warningLevel >= 3
                    ? "Quyết định xử lý học vụ: BUỘC THÔI HỌC"
                    : String.format("Cảnh báo học vụ Mức %d - Điều chỉnh hạn mức đăng ký tín chỉ", warningLevel);

            String message = warningLevel >= 3
                    ? "Tài khoản của bạn đã bị Buộc thôi học do vi phạm quy chế học vụ liên tiếp hoặc hết thời gian đào tạo. Cổng ĐKTC đã bị đóng."
                    : String.format("Bạn bị Cảnh báo học vụ Mức %d (%s). Hạn mức tín chỉ kỳ tiếp theo của bạn tối đa là %d tín chỉ.",
                            warningLevel, notice != null ? notice : "", maxAllowed);

            notificationService.createNotification(
                    student.getId(), title, message,
                    Notification.NotificationType.SYSTEM, null);
        } catch (Exception ex) {
            log.warn("Không thể gửi chuông cảnh báo học vụ cho SV {}: {}", student.getStudentCode(), ex.getMessage());
        }

        try {
            if (student.getEmail() != null && !student.getEmail().isBlank()) {
                emailService.sendAcademicWarningEmail(
                        student.getEmail(), student.getFullName(), student.getStudentCode(),
                        warningLevel, notice, maxAllowed);
            }
        } catch (Exception ex) {
            log.warn("Không thể gửi email cảnh báo học vụ cho SV {}: {}", student.getStudentCode(), ex.getMessage());
        }
    }

    /**
     * Tự động quét các học kỳ vừa kết thúc.
     */
    @Transactional
    public void autoScanRecentFinishedSemesters() {
        LocalDate today = LocalDate.now();
        List<Semester> completedSemesters = semesterRepository.findByStatus(Semester.SemesterStatus.COMPLETED);
        for (Semester sem : completedSemesters) {
            if (sem.getEndDate() != null && !today.isBefore(sem.getEndDate()) && today.isBefore(sem.getEndDate().plusDays(14))) {
                scanAndApplyAcademicWarnings(sem.getId());
            }
        }
    }
}
