package com.sms.service;

import com.sms.dto.request.CourseSectionRequest;
import com.sms.entity.CourseSection;
import com.sms.entity.Lecturer;
import com.sms.entity.Schedule;
import com.sms.entity.Semester;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.repository.SemesterRepository;
import com.sms.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CourseSectionServiceTest {

    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private CourseSectionService courseSectionService;

    private CourseSection section;
    private CourseSectionRequest request;
    private Subject subject;
    private Lecturer lecturer;
    private Semester semester;

    @BeforeEach
    void setUp() {
        subject = new Subject();
        subject.setId(1);

        lecturer = new Lecturer();
        lecturer.setId(1L);

        semester = new Semester();
        semester.setId(1);
        semester.setStartDate(LocalDate.parse("2023-09-01"));
        semester.setEndDate(LocalDate.parse("2023-12-31"));
        semester.setRegistrationStart(LocalDate.parse("2023-08-01"));
        semester.setRegistrationEnd(LocalDate.parse("2023-08-31"));

        section = new CourseSection();
        section.setId(1L);
        section.setSectionCode("SE01");
        section.setSubject(subject);
        section.setLecturer(lecturer);
        section.setSemester(semester);
        section.setMaxStudents(40);
        section.setCurrentStudents(10);
        section.setStatus(CourseSection.SectionStatus.OPEN);

        request = new CourseSectionRequest();
        request.setSectionCode("SE01");
        request.setSubjectId(1);
        request.setLecturerId(1L);
        request.setSemesterId(1);
        request.setMaxStudents(45);
        request.setRoom("A101");
    }

    @Test
    void findAll_Success() {
        when(courseSectionRepository.findAll()).thenReturn(List.of(section));
        List<CourseSection> result = courseSectionService.findAll();
        assertEquals(1, result.size());
    }

    @Test
    void findPaged_Success() {
        Page<CourseSection> page = new PageImpl<>(List.of(section));
        when(courseSectionRepository.findPaged(eq("SE01"), eq(1), eq(CourseSection.SectionStatus.OPEN), any()))
                .thenReturn(page);
        
        Page<CourseSection> result = courseSectionService.findPaged("SE01", 1, "OPEN", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findPaged_InvalidStatus_Throws() {
        assertThrows(BadRequestException.class, () -> courseSectionService.findPaged("SE01", 1, "INVALID", PageRequest.of(0, 10)));
    }

    @Test
    void findById_Success() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        CourseSection result = courseSectionService.findById(1L);
        assertEquals("SE01", result.getSectionCode());
    }

    @Test
    void findById_NotFound() {
        when(courseSectionRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> courseSectionService.findById(99L));
    }

    @Test
    void findOpenBySemester_Success() {
        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        
        semester.setRegistrationStart(LocalDate.now().minusDays(1));
        semester.setRegistrationEnd(LocalDate.now().plusDays(1));
        semester.setIsCurrent(true);
        semester.setStatus(Semester.SemesterStatus.ACTIVE);
        
        when(courseSectionRepository.findOpenSectionsBySemester(1)).thenReturn(List.of(section));
        
        List<CourseSection> result = courseSectionService.findOpenBySemester(1);
        assertEquals(1, result.size());
    }

    @Test
    void create_Success_NoSchedule() {
        when(courseSectionRepository.existsBySectionCode("SE01")).thenReturn(false);
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(lecturerRepository.findById(1L)).thenReturn(Optional.of(lecturer));
        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        when(courseSectionRepository.save(any(CourseSection.class))).thenReturn(section);

        CourseSection created = courseSectionService.create(request);
        assertNotNull(created);
        verify(courseSectionRepository).save(any(CourseSection.class));
    }

    @Test
    void create_Success_WithSchedule() {
        request.setDayOfWeek(2);
        request.setStartPeriod(1);
        request.setEndPeriod(3);
        
        when(courseSectionRepository.existsBySectionCode("SE01")).thenReturn(false);
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(lecturerRepository.findById(1L)).thenReturn(Optional.of(lecturer));
        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        when(courseSectionRepository.save(any(CourseSection.class))).thenReturn(section);
        
        when(scheduleRepository.findRoomConflicts(anyString(), anyInt(), anyInt(), anyInt(), any(), any(), eq(null)))
                .thenReturn(List.of());
        when(scheduleRepository.findLecturerConflicts(anyLong(), anyInt(), anyInt(), anyInt(), any(), any(), eq(null)))
                .thenReturn(List.of());

        courseSectionService.create(request);

        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(scheduleCaptor.capture());
        Schedule saved = scheduleCaptor.getValue();
        assertEquals(2, saved.getDayOfWeek().intValue());
        assertEquals(1, saved.getStartPeriod().intValue());
        assertEquals(3, saved.getEndPeriod().intValue());
        assertEquals("A101", saved.getRoom());
    }

    @Test
    void create_DuplicateCode() {
        when(courseSectionRepository.existsBySectionCode("SE01")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> courseSectionService.create(request));
    }

    @Test
    void update_Success() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(lecturerRepository.findById(1L)).thenReturn(Optional.of(lecturer));
        when(courseSectionRepository.save(any(CourseSection.class))).thenReturn(section);
        
        request.setMaxStudents(50);
        CourseSection updated = courseSectionService.update(1L, request);
        assertEquals(50, updated.getMaxStudents());
    }

    @Test
    void update_MaxStudentsLessThanCurrent_Throws() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        request.setLecturerId(null);
        request.setMaxStudents(5); // current is 10
        assertThrows(BadRequestException.class, () -> courseSectionService.update(1L, request));
    }
}
