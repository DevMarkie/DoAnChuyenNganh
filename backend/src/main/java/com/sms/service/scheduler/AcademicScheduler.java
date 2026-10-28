package com.sms.service.scheduler;

import com.sms.entity.CourseSection;
import com.sms.entity.Semester;
import com.sms.entity.Enrollment;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.SemesterRepository;
import com.sms.service.rule.CrossCuttingRuleEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduler định kỳ xử lý các nghiệp vụ tự động cuối kỳ / cuối đợt đăng ký.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AcademicScheduler {

    private final SemesterRepository semesterRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CrossCuttingRuleEngine crossCuttingRuleEngine;
    private final com.sms.service.AcademicWarningService academicWarningService;

    /**
     * GAP-04: Auto-cancel lớp thiếu sĩ số.
     * Chạy mỗi ngày lúc 1:00 AM. Kiểm tra các học kỳ đang ACTIVE, 
     * nếu đã qua hạn đăng ký thì hủy các lớp OPEN nhưng không đủ sĩ số tối thiểu.
     */
    @Scheduled(cron = "0 0 1 * * ?") 
    @Transactional
    public void autoCancelUnderEnrolledSections() {
        log.info("Starting auto-cancel under-enrolled sections job...");
        List<Semester> activeSemesters = semesterRepository.findByStatus(Semester.SemesterStatus.ACTIVE);
        
        for (Semester sem : activeSemesters) {
            // Chỉ xử lý SAU khi hết hạn đăng ký. registrationEnd là ngày cuối CÒN mở
            // (Semester.isRegistrationOpen inclusive), nên phải dùng isAfter, không phải
            // !isBefore — nếu không sẽ huỷ lớp ngay trong ngày cuối SV vẫn còn đăng ký được.
            if (sem.getRegistrationEnd() != null && LocalDate.now().isAfter(sem.getRegistrationEnd())) {
                List<CourseSection> openSections = courseSectionRepository.findBySemesterIdAndStatus(
                        sem.getId(), CourseSection.SectionStatus.OPEN);
                
                int cancelCount = 0;
                for (CourseSection section : openSections) {
                    if (section.getSectionType() != null
                            && section.getSectionType() != CourseSection.SectionType.REGULAR) {
                        continue;
                    }
                    int maxStudents = section.getMaxStudents() == null ? 40 : section.getMaxStudents();
                    int minStudents = (section.getMinStudents() != null && section.getMinStudents() > 0) ? section.getMinStudents() : (int) Math.ceil(maxStudents * 2.0 / 3.0);
                    section.setMinStudents(minStudents);
                    if (section.getCurrentStudents() < minStudents) {
                        log.warn("Section {} ({}) has only {} students. Cancelling...", 
                                section.getSectionCode(), section.getSubject().getSubjectName(), section.getCurrentStudents());
                        
                        enrollmentRepository.cancelActiveBySectionId(section.getId());
                        section.setStatus(CourseSection.SectionStatus.CANCELLED);
                        courseSectionRepository.save(section);
                        cancelCount++;
                    } else {
                        section.setStatus(CourseSection.SectionStatus.ACTIVE);
                        courseSectionRepository.save(section);
                    }
                }
                log.info("Cancelled {} sections in semester {}", cancelCount, sem.getSemesterCode());
            }
        }
    }

    /**
     * QUY TẮC LIÊN THÔNG B: Hạn học phí -> Đóng băng dịch vụ học vụ (FINANCIAL_HOLD)
     * Chạy mỗi ngày lúc 00:01 AM. Tự động quét và khóa các sinh viên còn nợ học phí quá hạn.
     */
    @Scheduled(cron = "0 1 0 * * ?")
    @Transactional
    public void autoApplyFinancialHolds() {
        log.info("Starting auto-apply financial holds job (Rule B)...");
        int count = crossCuttingRuleEngine.evaluateFinancialHolds();
        log.info("Finished auto-apply financial holds job. Applied to {} students.", count);
    }

    /**
     * QUY TẮC LIÊN THÔNG C: Quét xử lý học vụ tự động cuối kỳ
     * Chạy mỗi ngày lúc 2:00 AM. Kiểm tra các học kỳ kết thúc để quét học vụ và siết hạn mức tín chỉ.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void autoScanAcademicStanding() {
        log.info("Starting auto-scan academic standing job (Rule C)...");
        academicWarningService.autoScanRecentFinishedSemesters();
    }
}
