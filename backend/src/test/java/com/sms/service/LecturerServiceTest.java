package com.sms.service;

import com.sms.dto.request.LecturerRequest;
import com.sms.entity.Department;
import com.sms.entity.Lecturer;
import com.sms.entity.Role;
import com.sms.entity.Student.Gender;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.RoleRepository;
import com.sms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LecturerServiceTest {

    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private LecturerService lecturerService;

    private Lecturer lecturer;
    private Department department;
    private Role role;
    private LecturerRequest request;
    private User user;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1);
        department.setCode("IT");
        department.setName("Information Technology");

        role = new Role();
        role.setId(2);
        role.setName("LECTURER");

        user = new User();
        user.setId(1L);
        user.setUsername("gv01");
        user.setPassword("encodedPassword");
        user.setEmail("gv01@example.com");
        user.setRole(role);
        user.setIsActive(true);

        lecturer = new Lecturer();
        lecturer.setId(1L);
        lecturer.setLecturerCode("GV01");
        lecturer.setFullName("Nguyen Van A");
        lecturer.setEmail("gv01@example.com");
        lecturer.setDepartment(department);
        lecturer.setUser(user);
        lecturer.setIsActive(true);

        request = new LecturerRequest();
        request.setLecturerCode("GV01");
        request.setFullName("Nguyen Van A");
        request.setEmail("gv01@example.com");
        request.setDepartmentId(1);
        request.setDateOfBirth("1980-01-01");
        request.setGender("MALE");
    }

    @Test
    void findAll_Success() {
        when(lecturerRepository.findAll()).thenReturn(List.of(lecturer));
        List<Lecturer> result = lecturerService.findAll();
        assertFalse(result.isEmpty());
        assertEquals("GV01", result.get(0).getLecturerCode());
    }

    @Test
    void findById_Success() {
        when(lecturerRepository.findById(1L)).thenReturn(Optional.of(lecturer));
        Lecturer result = lecturerService.findById(1L);
        assertNotNull(result);
        assertEquals("GV01", result.getLecturerCode());
    }

    @Test
    void findById_NotFound() {
        when(lecturerRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> lecturerService.findById(99L));
    }

    @Test
    void findByUserId_Success() {
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        Lecturer result = lecturerService.findByUserId(1L);
        assertNotNull(result);
        assertEquals("GV01", result.getLecturerCode());
    }

    @Test
    void create_Success() {
        when(lecturerRepository.existsByLecturerCode(request.getLecturerCode())).thenReturn(false);
        when(lecturerRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(roleRepository.findByName("LECTURER")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = (User) i.getArguments()[0];
            u.setId(1L);
            return u;
        });
        when(lecturerRepository.save(any(Lecturer.class))).thenAnswer(i -> {
            Lecturer l = (Lecturer) i.getArguments()[0];
            l.setId(1L);
            return l;
        });

        Lecturer created = lecturerService.create(request);
        assertNotNull(created);
        assertEquals(1L, created.getId());
        assertEquals("GV01", created.getLecturerCode());
        verify(userRepository).save(any(User.class));
        verify(lecturerRepository).save(any(Lecturer.class));
    }

    @Test
    void create_DuplicateCode_Throws() {
        when(lecturerRepository.existsByLecturerCode(request.getLecturerCode())).thenReturn(true);
        assertThrows(BadRequestException.class, () -> lecturerService.create(request));
        verify(lecturerRepository, never()).save(any());
    }

    @Test
    void update_Success() {
        when(lecturerRepository.findById(1L)).thenReturn(Optional.of(lecturer));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(lecturerRepository.save(any(Lecturer.class))).thenReturn(lecturer);

        request.setFullName("Updated Name");
        request.setPassword("newPassword");
        when(passwordEncoder.encode("newPassword")).thenReturn("newEncodedPassword");

        Lecturer updated = lecturerService.update(1L, request);
        assertEquals("Updated Name", updated.getFullName());
        verify(userRepository).save(any(User.class));
        verify(lecturerRepository).save(any(Lecturer.class));
    }

    @Test
    void toggleActive_Success() {
        when(lecturerRepository.findById(1L)).thenReturn(Optional.of(lecturer));
        when(lecturerRepository.save(any(Lecturer.class))).thenReturn(lecturer);

        lecturerService.toggleActive(1L);
        assertFalse(lecturer.getIsActive());
        verify(lecturerRepository).save(lecturer);
    }
}
