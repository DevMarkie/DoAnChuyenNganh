package com.sms.service.scheduler;

import com.sms.entity.CourseSection;
import com.sms.entity.Semester;
import com.sms.entity.Subject;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.NotificationRepository;
import com.sms.repository.SemesterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AcademicSchedulerTest {

    @Mock
    private SemesterRepository semesterRepository;

    @Mock
    private CourseSectionRepository courseSectionRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private AcademicScheduler academicScheduler;

    private Semester activeSemester;
    private CourseSection sectionUnderEnrolled;
    private CourseSection sectionOk;

    @BeforeEach
    void setUp() {
        activeSemester = new Semester();
        activeSemester.setId(1);
        activeSemester.setSemesterCode("HK1_2024");
        // Registration ended yesterday
        activeSemester.setRegistrationEnd(LocalDate.now().minusDays(1));

        Subject subject = new Subject();
        subject.setSubjectName("Math 101");

        sectionUnderEnrolled = new CourseSection();
        sectionUnderEnrolled.setId(1L);
        sectionUnderEnrolled.setSubject(subject);
        sectionUnderEnrolled.setSemester(activeSemester);
        sectionUnderEnrolled.setStatus(CourseSection.SectionStatus.OPEN);
        sectionUnderEnrolled.setMaxStudents(30);
        sectionUnderEnrolled.setCurrentStudents(10); // Less than 15

        sectionOk = new CourseSection();
        sectionOk.setId(2L);
        sectionOk.setSubject(subject);
        sectionOk.setSemester(activeSemester);
        sectionOk.setStatus(CourseSection.SectionStatus.OPEN);
        sectionOk.setMaxStudents(30);
        sectionOk.setCurrentStudents(20); // More than 15
    }

    @Test
    void autoCancelUnderEnrolledSections_Success() {
        when(semesterRepository.findByStatus(Semester.SemesterStatus.ACTIVE))
                .thenReturn(List.of(activeSemester));
        when(courseSectionRepository.findBySemesterIdAndStatus(1, CourseSection.SectionStatus.OPEN))
                .thenReturn(List.of(sectionUnderEnrolled, sectionOk));
        when(enrollmentRepository.findActiveBySectionId(sectionUnderEnrolled.getId()))
                .thenReturn(List.of());

        academicScheduler.autoCancelUnderEnrolledSections();

        assertEquals(CourseSection.SectionStatus.CANCELLED, sectionUnderEnrolled.getStatus());
        assertEquals(CourseSection.SectionStatus.ACTIVE, sectionOk.getStatus());
        
        verify(courseSectionRepository, times(1)).save(sectionUnderEnrolled);
        verify(enrollmentRepository, times(1)).cancelActiveBySectionId(sectionUnderEnrolled.getId());
        verify(courseSectionRepository, times(1)).save(sectionOk);
    }

    @Test
    void autoCancelUnderEnrolledSections_RegistrationNotEnded() {
        activeSemester.setRegistrationEnd(LocalDate.now().plusDays(1));

        when(semesterRepository.findByStatus(Semester.SemesterStatus.ACTIVE))
                .thenReturn(List.of(activeSemester));

        academicScheduler.autoCancelUnderEnrolledSections();

        verify(courseSectionRepository, never()).findBySemesterIdAndStatus(anyInt(), any());
    }

    @Test
    void warnUnderEnrolledStudents_RunsWithoutErrors() {
        when(semesterRepository.findByStatus(Semester.SemesterStatus.ACTIVE))
                .thenReturn(List.of(activeSemester));

        academicScheduler.warnUnderEnrolledStudents();
        // Since it only logs for now, we just verify it doesn't throw exceptions.
    }
}
