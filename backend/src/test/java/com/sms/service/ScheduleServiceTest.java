package com.sms.service;

import com.sms.dto.request.ScheduleRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Lecturer;
import com.sms.entity.Schedule;
import com.sms.entity.Schedule.ScheduleStatus;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.entity.Semester;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.ClassRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.repository.SemesterRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ScheduleServiceTest {

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private ClassRepository classRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ExcelExportService excelExportService;

    @InjectMocks
    private ScheduleService scheduleService;

    private Schedule schedule;
    private ScheduleRequest request;
    private CourseSection section;
    private ClassEntity classEntity;
    private Lecturer lecturer;
    private Student student;

    @BeforeEach
    void setUp() {
        lecturer = new Lecturer();
        lecturer.setId(1L);
        lecturer.setFullName("Nguyen Van A");

        section = new CourseSection();
        section.setId(1L);
        section.setLecturer(lecturer);
        section.setSectionCode("SE01");
        Subject subject = new Subject();
        subject.setSubjectName("Lập trình Java");
        section.setSubject(subject);
        Semester semester = new Semester();
        semester.setId(1);
        section.setSemester(semester);

        classEntity = new ClassEntity();
        classEntity.setId(1);

        student = new Student();
        student.setId(1L);
        student.setStudentCode("23010359");
        student.setFullName("Nguyen Duy Minh");
        student.setClassEntity(classEntity);

        schedule = new Schedule();
        schedule.setId(1L);
        schedule.setSection(section);
        schedule.setClassEntity(classEntity);
        schedule.setDayOfWeek(2); // Thu 2
        schedule.setStartPeriod(1);
        schedule.setEndPeriod(3);
        schedule.setRoom("A101");
        schedule.setStatus(ScheduleStatus.NORMAL);
        schedule.setStartDate(LocalDate.parse("2023-09-01"));
        schedule.setEndDate(LocalDate.parse("2023-12-31"));

        request = new ScheduleRequest();
        request.setSectionId(1L);
        request.setClassId(1);
        request.setDayOfWeek(2);
        request.setStartPeriod(1);
        request.setEndPeriod(3);
        request.setRoom("A101");
        request.setStartDate("2023-09-01");
        request.setEndDate("2023-12-31");
    }

    @Test
    void findAll_Success() {
        when(scheduleRepository.findAll()).thenReturn(List.of(schedule));
        List<Schedule> result = scheduleService.findAll();
        assertFalse(result.isEmpty());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getStudentSchedule_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(scheduleRepository.findSchedulesForStudentAndSemester(1L, 1, 1L))
                .thenReturn(List.of(schedule));

        List<Schedule> result = scheduleService.getStudentSchedule(1L, 1L);
        assertFalse(result.isEmpty());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getStudentSchedule_WithoutSemester_UsesCurrentSemester() {
        Semester currentSemester = new Semester();
        currentSemester.setId(1);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(semesterRepository.findByIsCurrentTrue()).thenReturn(Optional.of(currentSemester));
        when(scheduleRepository.findSchedulesForStudentAndSemester(1L, 1, 1L))
                .thenReturn(List.of(schedule));

        List<Schedule> result = scheduleService.getStudentSchedule(1L, null);

        assertEquals(List.of(schedule), result);
        verify(scheduleRepository, never()).findSchedulesForStudent(1L, 1);
    }

    @Test
    void getLecturerSchedule_Success() {
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(scheduleRepository.findByLecturerIdAndSemesterId(1L, 1L))
                .thenReturn(List.of(schedule));

        List<Schedule> result = scheduleService.getLecturerSchedule(1L, 1L);
        assertFalse(result.isEmpty());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getLecturerSchedule_FiltersOutCancelledSections() {
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        CourseSection cancelledSec = new CourseSection();
        cancelledSec.setId(2L);
        cancelledSec.setStatus(CourseSection.SectionStatus.CANCELLED);

        Schedule cancelledSchedule = new Schedule();
        cancelledSchedule.setId(2L);
        cancelledSchedule.setSection(cancelledSec);

        when(scheduleRepository.findByLecturerIdAndSemesterId(1L, 1L))
                .thenReturn(List.of(schedule, cancelledSchedule));

        List<Schedule> result = scheduleService.getLecturerSchedule(1L, 1L);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void create_Success() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(null)))
                .thenReturn(List.of());
        when(scheduleRepository.findLecturerConflicts(any(), any(), any(), any(), any(), any(), eq(null)))
                .thenReturn(List.of());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

        Schedule created = scheduleService.create(request);
        assertNotNull(created);
        assertEquals(1L, created.getId());
    }

    @Test
    void create_InvalidPeriods_Throws() {
        request.setStartPeriod(5);
        request.setEndPeriod(1);

        assertThrows(BadRequestException.class, () -> scheduleService.create(request));
    }

    @Test
    void create_RoomConflict_Throws() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        
        Schedule conflicting = new Schedule();
        conflicting.setDayOfWeek(2);
        conflicting.setStartPeriod(1);
        conflicting.setEndPeriod(3);
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(null)))
                .thenReturn(List.of(conflicting));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> scheduleService.create(request));
        assertTrue(ex.getMessage().contains("Trùng phòng học"));
    }

    @Test
    void create_LecturerConflict_Throws() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(null)))
                .thenReturn(List.of());

        Schedule conflicting = new Schedule();
        conflicting.setDayOfWeek(2);
        conflicting.setStartPeriod(1);
        conflicting.setEndPeriod(3);
        when(scheduleRepository.findLecturerConflicts(any(), any(), any(), any(), any(), any(), eq(null)))
                .thenReturn(List.of(conflicting));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> scheduleService.create(request));
        assertTrue(ex.getMessage().contains("Trùng lịch giảng viên"));
    }

    @Test
    void create_WhenAnEnrolledStudentAlreadyHasAnotherSubjectAtThatTime_Throws() {
        CourseSection conflictingSection = new CourseSection();
        conflictingSection.setId(2L);
        conflictingSection.setSectionCode("SE02");
        Subject conflictingSubject = new Subject();
        conflictingSubject.setSubjectName("Cấu trúc dữ liệu");
        conflictingSection.setSubject(conflictingSubject);

        Schedule conflictingSchedule = new Schedule();
        conflictingSchedule.setSection(conflictingSection);
        conflictingSchedule.setDayOfWeek(2);
        conflictingSchedule.setStartPeriod(1);
        conflictingSchedule.setEndPeriod(3);
        conflictingSchedule.setStartDate(LocalDate.parse("2023-09-01"));
        conflictingSchedule.setEndDate(LocalDate.parse("2023-12-31"));

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);

        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(null)))
                .thenReturn(List.of());
        when(scheduleRepository.findLecturerConflicts(any(), any(), any(), any(), any(), any(), eq(null)))
                .thenReturn(List.of());
        when(enrollmentRepository.findActiveBySectionId(1L)).thenReturn(List.of(enrollment));
        when(scheduleRepository.findSchedulesForStudentAndSemester(1L, 1, 1L))
                .thenReturn(List.of(conflictingSchedule));

        BadRequestException exception = assertThrows(BadRequestException.class, () -> scheduleService.create(request));

        assertTrue(exception.getMessage().contains("Trùng lịch học"));
        assertTrue(exception.getMessage().contains("Cấu trúc dữ liệu"));
    }

    @Test
    void update_Success_WithoutNotificationWhenNoCriticalChange() {
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.findLecturerConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

        request.setNote("Ghi chú mới");
        Schedule updated = scheduleService.update(1L, request);
        assertNotNull(updated);
        verify(notificationService, never()).notifyScheduleChange(any(), any(), any());
    }

    @Test
    void update_RoomChanged_NotifiesStudents() {
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.findLecturerConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

        request.setRoom("B202");
        Schedule updated = scheduleService.update(1L, request);
        assertEquals("B202", updated.getRoom());
        verify(notificationService, times(1)).notifyScheduleChange(eq(1L), contains("Cập nhật lịch học"), contains("ĐỔI PHÒNG HỌC"));
    }

    @Test
    void update_CancelledStatus_NotifiesStudents() {
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.findLecturerConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

        request.setStatus("CANCELLED");
        request.setNote("Giảng viên bận công tác");
        Schedule updated = scheduleService.update(1L, request);
        assertNotNull(updated);
        verify(notificationService, times(1)).notifyScheduleChange(eq(1L), contains("Cập nhật lịch học"), contains("BÁO NGHỈ"));
    }

    @Test
    void update_MakeupStatus_NotifiesStudents() {
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(scheduleRepository.findRoomConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.findLecturerConflicts(any(), any(), any(), any(), any(), any(), eq(1L)))
                .thenReturn(List.of());
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

        request.setStatus("MAKEUP");
        request.setNote("Dạy bù ngày 10/10");
        Schedule updated = scheduleService.update(1L, request);
        assertNotNull(updated);
        verify(notificationService, times(1)).notifyScheduleChange(eq(1L), contains("Cập nhật lịch học"), contains("HỌC BÙ"));
    }

    @Test
    void generateIcalendar_ValidRFC5545Format() {
        byte[] icsBytes = scheduleService.generateIcalendar(List.of(schedule), "TKB_Test");
        assertNotNull(icsBytes);
        String icsContent = new String(icsBytes, StandardCharsets.UTF_8);

        assertTrue(icsContent.contains("BEGIN:VCALENDAR"));
        assertTrue(icsContent.contains("VERSION:2.0"));
        assertTrue(icsContent.contains("BEGIN:VEVENT"));
        assertTrue(icsContent.contains("RRULE:FREQ=WEEKLY"));
        assertTrue(icsContent.contains("SUMMARY:Lập trình Java (SE01)"));
        assertTrue(icsContent.contains("LOCATION:A101"));
        assertTrue(icsContent.contains("END:VEVENT"));
        assertTrue(icsContent.contains("END:VCALENDAR"));
    }

    @Test
    void exportStudentIcs_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(scheduleRepository.findSchedulesForStudentAndSemester(1L, 1, 1L))
                .thenReturn(List.of(schedule));

        byte[] result = scheduleService.exportStudentIcs(1L, 1L);
        assertNotNull(result);
        String text = new String(result, StandardCharsets.UTF_8);
        assertTrue(text.contains("BEGIN:VCALENDAR"));
    }

    @Test
    void exportStudentExcel_Success() throws IOException {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(scheduleRepository.findSchedulesForStudentAndSemester(1L, 1, 1L))
                .thenReturn(List.of(schedule));
        when(excelExportService.exportSchedule(any(), any())).thenReturn(new byte[]{1, 2, 3});

        byte[] result = scheduleService.exportStudentExcel(1L, 1L);
        assertNotNull(result);
        assertEquals(3, result.length);
        verify(excelExportService).exportSchedule(any(), any());
    }

    @Test
    void delete_Success() {
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        assertDoesNotThrow(() -> scheduleService.delete(1L));
        verify(scheduleRepository).delete(schedule);
    }
}
