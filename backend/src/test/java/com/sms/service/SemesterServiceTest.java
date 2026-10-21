package com.sms.service;

import com.sms.dto.request.SemesterRequest;
import com.sms.entity.Semester;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.SemesterRepository;
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
public class SemesterServiceTest {

    @Mock
    private SemesterRepository semesterRepository;

    @InjectMocks
    private SemesterService semesterService;

    private Semester semester;
    private SemesterRequest request;

    @BeforeEach
    void setUp() {
        semester = new Semester();
        semester.setId(1);
        semester.setSemesterCode("HK1_2324");
        semester.setSemesterName("Học kỳ 1 năm học 2023-2024");
        semester.setAcademicYear("2023-2024");
        semester.setSemesterNumber(1);
        semester.setStartDate(LocalDate.parse("2023-09-01"));
        semester.setEndDate(LocalDate.parse("2024-01-15"));
        semester.setIsCurrent(false);
        semester.setStatus(Semester.SemesterStatus.UPCOMING);

        request = new SemesterRequest();
        request.setSemesterCode("HK1_2324");
        request.setSemesterName("Học kỳ 1 năm học 2023-2024");
        request.setAcademicYear("2023-2024");
        request.setSemesterNumber(1);
        request.setStartDate("2023-09-01");
        request.setEndDate("2024-01-15");
        request.setStatus("UPCOMING");
    }

    @Test
    void findAll_Success() {
        when(semesterRepository.findAllByOrderByStartDateDesc()).thenReturn(List.of(semester));
        List<Semester> result = semesterService.findAll();
        assertFalse(result.isEmpty());
        assertEquals("HK1_2324", result.get(0).getSemesterCode());
    }

    @Test
    void findById_Success() {
        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        Semester result = semesterService.findById(1);
        assertNotNull(result);
        assertEquals("HK1_2324", result.getSemesterCode());
    }

    @Test
    void findById_NotFound() {
        when(semesterRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> semesterService.findById(99));
    }

    @Test
    void findCurrent_Success() {
        when(semesterRepository.findByIsCurrentTrue()).thenReturn(Optional.of(semester));
        Semester result = semesterService.findCurrent();
        assertNotNull(result);
    }

    @Test
    void findCurrent_NotFound() {
        when(semesterRepository.findByIsCurrentTrue()).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> semesterService.findCurrent());
    }

    @Test
    void create_Success() {
        when(semesterRepository.existsBySemesterCode("HK1_2324")).thenReturn(false);
        when(semesterRepository.save(any(Semester.class))).thenAnswer(i -> {
            Semester s = (Semester) i.getArguments()[0];
            s.setId(1);
            return s;
        });

        Semester created = semesterService.create(request);
        assertNotNull(created);
        assertEquals(1, created.getId());
        assertEquals("HK1_2324", created.getSemesterCode()); // service map tu request, khong phai stub
        verify(semesterRepository).save(any(Semester.class));
    }

    @Test
    void create_DuplicateCode() {
        when(semesterRepository.existsBySemesterCode("HK1_2324")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> semesterService.create(request));
        verify(semesterRepository, never()).save(any());
    }

    @Test
    void create_InvalidDates() {
        request.setStartDate("2024-01-15");
        request.setEndDate("2023-09-01");

        when(semesterRepository.existsBySemesterCode("HK1_2324")).thenReturn(false);
        assertThrows(BadRequestException.class, () -> semesterService.create(request));
    }

    @Test
    void update_Success() {
        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        when(semesterRepository.save(any(Semester.class))).thenReturn(semester);

        request.setSemesterName("Updated Name");
        Semester updated = semesterService.update(1, request);
        assertEquals("Updated Name", updated.getSemesterName());
        verify(semesterRepository).save(any(Semester.class));
    }

    @Test
    void setCurrent_Success() {
        Semester oldCurrent = new Semester();
        oldCurrent.setId(2);
        oldCurrent.setIsCurrent(true);

        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        when(semesterRepository.findByIsCurrentTrue()).thenReturn(Optional.of(oldCurrent));
        
        semesterService.setCurrent(1);

        assertFalse(oldCurrent.getIsCurrent());
        assertTrue(semester.getIsCurrent());
        verify(semesterRepository).save(oldCurrent);
        verify(semesterRepository).save(semester);
    }
}
