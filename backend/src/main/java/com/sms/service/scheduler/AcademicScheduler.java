package com.sms.service.scheduler;

import com.sms.entity.CourseSection;
import com.sms.entity.Semester;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.SemesterRepository;
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

    private static final int MIN_STUDENTS_PER_SECTION = 15;

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
            // Kiểm tra xem đợt đăng ký đã kết thúc chưa
            if (sem.getRegistrationEnd() != null && LocalDate.now().isAfter(sem.getRegistrationEnd())) {
                List<CourseSection> openSections = courseSectionRepository.findBySemesterIdAndStatus(
                        sem.getId(), CourseSection.SectionStatus.OPEN);
                
                int cancelCount = 0;
                for (CourseSection section : openSections) {
                    if (section.getCurrentStudents() < MIN_STUDENTS_PER_SECTION) {
                        log.warn("Section {} ({}) has only {} students. Cancelling...", 
                                section.getSectionCode(), section.getSubject().getSubjectName(), section.getCurrentStudents());
                        
                        section.setStatus(CourseSection.SectionStatus.CANCELLED);
                        courseSectionRepository.save(section);
                        cancelCount++;
                    }
                }
                log.info("Cancelled {} sections in semester {}", cancelCount, sem.getSemesterCode());
            }
        }
    }

    private static final int MIN_CREDITS_PER_SEMESTER = 12;

    /**
     * GAP-02: Kiểm tra sinh viên đăng ký dưới số tín chỉ tối thiểu (12 tín).
     * Chạy mỗi ngày lúc 1:30 AM (sau khi hủy lớp thiếu sĩ số).
     */
    @Scheduled(cron = "0 30 1 * * ?") 
    @Transactional(readOnly = true)
    public void warnUnderEnrolledStudents() {
        log.info("Starting minimum credits check job...");
        List<Semester> activeSemesters = semesterRepository.findByStatus(Semester.SemesterStatus.ACTIVE);
        
        for (Semester sem : activeSemesters) {
            // Chỉ kiểm tra khi đã đóng cổng đăng ký
            if (sem.getRegistrationEnd() != null && LocalDate.now().isAfter(sem.getRegistrationEnd())) {
                // Trong thực tế sẽ dùng custom query để JOIN thẳng Enrollment và Subject lấy SUM(credits)
                // log ra danh sách để giáo vụ xử lý hoặc gửi email cảnh báo.
                log.info("Checking minimum credits for semester: {}", sem.getSemesterCode());
                // TODO: Implement bulk query to find students with sum(credits) < MIN_CREDITS_PER_SEMESTER
            }
        }
    }
}
