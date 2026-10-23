package com.sms.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.sms.dto.response.NotificationResponse;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Notification;
import com.sms.entity.Notification.NotificationType;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.NotificationRepository;
import com.sms.repository.StudentRepository;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Student student;
    private CourseSection section;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(100L);
        student.setStudentCode("SV202601");
        student.setFullName("Nguyen Van An");

        Subject subject = new Subject();
        subject.setId(10);
        subject.setSubjectCode("CS101");
        subject.setSubjectName("Lap trinh Java");

        section = new CourseSection();
        section.setId(20L);
        section.setSectionCode("CS101.01");
        section.setSubject(subject);

        enrollment = new Enrollment();
        enrollment.setId(30L);
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);
    }

    @Test
    void testSubscribe_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(notificationRepository.countByStudentIdAndIsReadFalse(100L)).thenReturn(3L);

        SseEmitter emitter = notificationService.subscribe(1L);

        assertNotNull(emitter);
        verify(studentRepository).findByUserId(1L);
        verify(notificationRepository).countByStudentIdAndIsReadFalse(100L);
    }

    @Test
    void testNotifySectionGradeEvent_Finalized() {
        when(courseSectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findActiveBySectionId(20L)).thenReturn(List.of(enrollment));
        when(notificationRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.notifySectionGradeEvent(20L, true);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());

        List<Notification> savedList = captor.getValue();
        assertEquals(1, savedList.size());
        Notification n = savedList.get(0);
        assertEquals(NotificationType.GRADE_FINALIZED, n.getType());
        assertTrue(n.getTitle().contains("Lap trinh Java"));
        assertTrue(n.getMessage().contains("7 ngày"));
        assertTrue(n.getMessage().contains("phúc khảo"));
        assertEquals(20L, n.getRelatedId());
        assertFalse(n.getIsRead());
    }

    @Test
    void testNotifySectionGradeEvent_Updated() {
        when(courseSectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findActiveBySectionId(20L)).thenReturn(List.of(enrollment));
        when(notificationRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.notifySectionGradeEvent(20L, false);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());

        List<Notification> savedList = captor.getValue();
        assertEquals(1, savedList.size());
        Notification n = savedList.get(0);
        assertEquals(NotificationType.GRADE_UPDATED, n.getType());
        assertTrue(n.getTitle().contains("Cập nhật điểm"));
        assertFalse(n.getIsRead());
    }

    @Test
    void testGetMyNotifications() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        Notification n = Notification.builder()
                .id(1L)
                .student(student)
                .title("Test")
                .message("Message")
                .type(NotificationType.GRADE_UPDATED)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        when(notificationRepository.findByStudentIdOrderByCreatedAtDesc(eq(100L), any(PageRequest.class)))
                .thenReturn(List.of(n));

        List<NotificationResponse> result = notificationService.getMyNotifications(1L, 10);

        assertEquals(1, result.size());
        assertEquals("Test", result.get(0).getTitle());
    }

    @Test
    void testGetUnreadCount() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(notificationRepository.countByStudentIdAndIsReadFalse(100L)).thenReturn(5L);

        long count = notificationService.getUnreadCount(1L);

        assertEquals(5L, count);
    }

    @Test
    void testMarkAsRead() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));

        notificationService.markAsRead(1L, 99L);

        verify(notificationRepository).markAsRead(99L, 100L);
    }

    @Test
    void testMarkAllAsRead() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));

        notificationService.markAllAsRead(1L);

        verify(notificationRepository).markAllAsRead(100L);
    }
}
