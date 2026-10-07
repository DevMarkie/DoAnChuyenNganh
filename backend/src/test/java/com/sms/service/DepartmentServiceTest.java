package com.sms.service;

import com.sms.dto.request.DepartmentRequest;
import com.sms.entity.Department;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
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
public class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentService departmentService;

    private Department department;
    private DepartmentRequest request;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1);
        department.setCode("IT");
        department.setName("Information Technology");
        department.setDescription("IT Dept");
        department.setIsActive(true);

        request = new DepartmentRequest();
        request.setCode("IT");
        request.setName("Information Technology");
        request.setDescription("IT Dept");
    }

    @Test
    void findAll_Success() {
        when(departmentRepository.findAll()).thenReturn(List.of(department));
        List<Department> result = departmentService.findAll();
        assertFalse(result.isEmpty());
        assertEquals("IT", result.get(0).getCode());
    }

    @Test
    void findById_Success() {
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        Department result = departmentService.findById(1);
        assertNotNull(result);
        assertEquals("IT", result.getCode());
    }

    @Test
    void findById_NotFound() {
        when(departmentRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> departmentService.findById(99));
    }

    @Test
    void create_Success() {
        when(departmentRepository.existsByCode("IT")).thenReturn(false);
        when(departmentRepository.existsByName("Information Technology")).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenAnswer(i -> {
            Department d = (Department) i.getArguments()[0];
            d.setId(1);
            return d;
        });

        Department created = departmentService.create(request);
        assertNotNull(created);
        assertEquals(1, created.getId());
        verify(departmentRepository).save(any(Department.class));
    }

    @Test
    void create_DuplicateCode() {
        when(departmentRepository.existsByCode("IT")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> departmentService.create(request));
        verify(departmentRepository, never()).save(any());
    }

    @Test
    void update_Success() {
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(departmentRepository.save(any(Department.class))).thenReturn(department);

        request.setName("New Name");
        Department updated = departmentService.update(1, request);
        assertEquals("New Name", updated.getName());
        verify(departmentRepository).save(any(Department.class));
    }

    @Test
    void toggleActive_Success() {
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(departmentRepository.save(any(Department.class))).thenReturn(department);

        departmentService.toggleActive(1);
        assertFalse(department.getIsActive());
        verify(departmentRepository).save(department);
    }
}
