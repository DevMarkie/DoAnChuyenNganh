package com.sms.service;

import com.sms.dto.request.ClassRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.Department;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.ClassRepository;
import com.sms.repository.DepartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClassServiceTest {

    @Mock
    private ClassRepository classRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private ClassService classService;

    private ClassEntity classEntity;
    private Department department;
    private ClassRequest request;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1);
        department.setCode("IT");
        department.setName("Information Technology");

        classEntity = new ClassEntity();
        classEntity.setId(1);
        classEntity.setCode("SE01");
        classEntity.setName("Software Engineering 01");
        classEntity.setDepartment(department);
        classEntity.setAcademicYear("2023-2027");
        classEntity.setIsActive(true);

        request = new ClassRequest();
        request.setCode("SE01");
        request.setName("Software Engineering 01");
        request.setDepartmentId(1);
        request.setAcademicYear("2023-2027");
    }

    @Test
    void findAll_Success() {
        when(classRepository.findAll()).thenReturn(List.of(classEntity));
        List<ClassEntity> result = classService.findAll();
        assertFalse(result.isEmpty());
        assertEquals("SE01", result.get(0).getCode());
    }

    @Test
    void findById_Success() {
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        ClassEntity result = classService.findById(1);
        assertNotNull(result);
        assertEquals("SE01", result.getCode());
    }

    @Test
    void findById_NotFound() {
        when(classRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> classService.findById(99));
    }

    @Test
    void findByDepartment_Success() {
        when(classRepository.findByDepartmentId(1)).thenReturn(List.of(classEntity));
        List<ClassEntity> result = classService.findByDepartment(1);
        assertFalse(result.isEmpty());
        assertEquals(1, result.get(0).getDepartment().getId());
    }

    @Test
    void create_Success() {
        when(classRepository.existsByCode("SE01")).thenReturn(false);
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(classRepository.save(any(ClassEntity.class))).thenAnswer(i -> {
            ClassEntity c = (ClassEntity) i.getArguments()[0];
            c.setId(1);
            return c;
        });

        ClassEntity created = classService.create(request);
        assertNotNull(created);
        assertEquals(1, created.getId());
        verify(classRepository).save(any(ClassEntity.class));
    }

    @Test
    void create_DuplicateCode() {
        when(classRepository.existsByCode("SE01")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> classService.create(request));
        verify(classRepository, never()).save(any());
    }

    @Test
    void update_Success() {
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(classRepository.save(any(ClassEntity.class))).thenReturn(classEntity);

        request.setName("Updated SE01");
        ClassEntity updated = classService.update(1, request);
        assertEquals("Updated SE01", updated.getName());
        verify(classRepository).save(any(ClassEntity.class));
    }

    @Test
    void toggleActive_Success() {
        when(classRepository.findById(1)).thenReturn(Optional.of(classEntity));
        when(classRepository.save(any(ClassEntity.class))).thenReturn(classEntity);

        classService.toggleActive(1);
        assertFalse(classEntity.getIsActive());
        verify(classRepository).save(classEntity);
    }
}
