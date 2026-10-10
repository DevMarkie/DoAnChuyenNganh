package com.sms.service.scheduler;

import com.sms.entity.CourseSection;
import com.sms.entity.Semester;
import com.sms.entity.Enrollment;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
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
    private final EnrollmentRepository enrollmentRepository;

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
                    int minStudents = (int) Math.ceil(maxStudents * 2.0 / 3.0);
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

}
