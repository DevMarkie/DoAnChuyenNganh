package com.sms.service;

import com.sms.dto.request.SubjectRequest;
import com.sms.entity.Department;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubjectServiceTest {

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private SubjectService subjectService;

    private Subject subject;
    private Department department;
    private SubjectRequest request;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1);
        department.setCode("IT");
        department.setName("Information Technology");

        subject = new Subject();
        subject.setId(1);
        subject.setSubjectCode("CS101");
        subject.setSubjectName("Introduction to Computer Science");
        subject.setCredits(3);
        subject.setDepartment(department);
        subject.setIsActive(true);
        subject.setPrerequisites(new LinkedHashSet<>());

        request = new SubjectRequest();
        request.setSubjectCode("CS101");
        request.setSubjectName("Introduction to Computer Science");
        request.setCredits(3);
        request.setDepartmentId(1);
    }

    @Test
    void findAll_Success() {
        when(subjectRepository.findAll()).thenReturn(List.of(subject));
        List<Subject> result = subjectService.findAll();
        assertFalse(result.isEmpty());
        assertEquals("CS101", result.get(0).getSubjectCode());
    }

    @Test
    void findById_Success() {
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        Subject result = subjectService.findById(1);
        assertNotNull(result);
        assertEquals("CS101", result.getSubjectCode());
    }

    @Test
    void findById_NotFound() {
        when(subjectRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> subjectService.findById(99));
    }

    @Test
    void create_Success() {
        when(subjectRepository.existsBySubjectCode("CS101")).thenReturn(false);
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(subjectRepository.save(any(Subject.class))).thenAnswer(i -> {
            Subject s = (Subject) i.getArguments()[0];
            s.setId(1);
            return s;
        });

        Subject created = subjectService.create(request);
        assertNotNull(created);
        assertEquals(1, created.getId());
        verify(subjectRepository).save(any(Subject.class));
    }

    @Test
    void create_DuplicateCode() {
        when(subjectRepository.existsBySubjectCode("CS101")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> subjectService.create(request));
        verify(subjectRepository, never()).save(any());
    }

    @Test
    void update_SelfPrerequisite_ShouldThrow() {
        request.setPrerequisiteIds(List.of(1));

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));

        assertThrows(BadRequestException.class, () -> subjectService.update(1, request));
    }

    @Test
    void update_Success() {
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(subjectRepository.save(any(Subject.class))).thenReturn(subject);

        request.setSubjectName("Updated Name");
        Subject updated = subjectService.update(1, request);
        assertEquals("Updated Name", updated.getSubjectName());
        verify(subjectRepository).save(any(Subject.class));
    }

    @Test
    void toggleActive_Success() {
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(subjectRepository.save(any(Subject.class))).thenReturn(subject);

        subjectService.toggleActive(1);
        assertFalse(subject.getIsActive());
        verify(subjectRepository).save(subject);
    }

    @Test
    void update_rejectsIndirectCycle() {
        Subject current = new Subject();
        current.setId(10);
        current.setSubjectCode("CS201");

        Subject prerequisite = new Subject();
        prerequisite.setId(20);
        prerequisite.setSubjectCode("CS101");
        prerequisite.setPrerequisites(java.util.Set.of(current));

        when(subjectRepository.findById(10)).thenReturn(Optional.of(current));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(new Department()));
        when(subjectRepository.findAllById(java.util.Set.of(20))).thenReturn(List.of(prerequisite));

        SubjectRequest req = new SubjectRequest("CS201", "Data Structures", 3, "", 1, List.of(20));
        assertThrows(BadRequestException.class, () -> subjectService.update(10, req));
        verify(subjectRepository, never()).save(any(Subject.class));
    }

    @Test
    void update_rejectsUnknownPrerequisiteId() {
        Subject current = new Subject();
        current.setId(10);
        current.setSubjectCode("CS201");

        when(subjectRepository.findById(10)).thenReturn(Optional.of(current));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(new Department()));
        when(subjectRepository.findAllById(java.util.Set.of(999))).thenReturn(List.of());

        SubjectRequest req = new SubjectRequest("CS201", "Data Structures", 3, "", 1, List.of(999));
        assertThrows(ResourceNotFoundException.class, () -> subjectService.update(10, req));
    }
}
