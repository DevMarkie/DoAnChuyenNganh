package com.sms.service;

import com.sms.dto.request.ScheduleRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.CourseSection;
import com.sms.entity.Lecturer;
import com.sms.entity.Schedule;
import com.sms.entity.Student;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.ClassRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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

        classEntity = new ClassEntity();
        classEntity.setId(1);

        student = new Student();
        student.setId(1L);
        student.setClassEntity(classEntity);

        schedule = new Schedule();
        schedule.setId(1L);
        schedule.setSection(section);
        schedule.setClassEntity(classEntity);
        schedule.setDayOfWeek(2); // Thu 2
        schedule.setStartPeriod(1);
        schedule.setEndPeriod(3);
        schedule.setRoom("A101");
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
    void getLecturerSchedule_Success() {
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(scheduleRepository.findByLecturerIdAndSemesterId(1L, 1L))
                .thenReturn(List.of(schedule));

        List<Schedule> result = scheduleService.getLecturerSchedule(1L, 1L);
        assertFalse(result.isEmpty());
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

        assertThrows(BadRequestException.class, () -> scheduleService.create(request));
    }

    @Test
    void update_Success() {
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
        verify(scheduleRepository).save(any(Schedule.class));
    }

    @Test
    void delete_Success() {
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        assertDoesNotThrow(() -> scheduleService.delete(1L));
        verify(scheduleRepository).delete(schedule);
    }
}
