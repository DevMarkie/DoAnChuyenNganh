package com.sms.service;

import com.sms.dto.request.StudentRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.Role;
import com.sms.entity.Student;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.ClassRepository;
import com.sms.repository.RoleRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ClassRepository classRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private StudentService studentService;

    private Student student;
    private StudentRequest request;
    private ClassEntity classEntity;
    private Role role;

    @BeforeEach
    void setUp() {
        classEntity = new ClassEntity();
        classEntity.setId(1);
        classEntity.setName("Class A");

        role = new Role();
        role.setId(3); // STUDENT ROLE
        role.setName("STUDENT");

        student = new Student();
        student.setId(1L);
        student.setStudentCode("STU001");
        student.setFullName("Test Student");
        student.setClassEntity(classEntity);

        request = new StudentRequest();
        request.setStudentCode("STU001");
        request.setFullName("Test Student");
        request.setClassId(1);
        request.setEmail("stu001@example.com");
        request.setDateOfBirth("2000-01-01");
        request.setGender("MALE");
    }

    @Test
    void findById_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        Student result = studentService.findById(1L);
        assertNotNull(result);
        assertEquals("STU001", result.getStudentCode());
    }

    @Test
    void findById_NotFound() {
        when(studentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> studentService.findById(99L));
    }

    @Test
    void create_Success() {
        when(studentRepository.existsByStudentCode(request.getStudentCode())).thenReturn(false);
        lenient().when(userRepository.existsByUsername(request.getStudentCode())).thenReturn(false);
        lenient().when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        
        when(classRepository.findById(request.getClassId())).thenReturn(Optional.of(classEntity));
        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);
        when(studentRepository.save(any(Student.class))).thenAnswer(i -> {
            Student s = (Student) i.getArguments()[0];
            s.setId(1L);
            return s;
        });

        Student created = studentService.create(request);

        assertNotNull(created);
        assertEquals("STU001", created.getStudentCode());
        verify(userRepository).save(any(User.class));
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    void create_DuplicateCode() {
        when(studentRepository.existsByStudentCode(request.getStudentCode())).thenReturn(true);
        
        BadRequestException ex = assertThrows(BadRequestException.class, () -> studentService.create(request));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    void update_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(classRepository.findById(request.getClassId())).thenReturn(Optional.of(classEntity));
        when(studentRepository.save(any(Student.class))).thenReturn(student);

        request.setFullName("Updated Name");
        Student updated = studentService.update(1L, request);

        assertEquals("Updated Name", updated.getFullName());
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    void updateStatus_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(studentRepository.save(any(Student.class))).thenReturn(student);

        studentService.updateStatus(1L, "ACTIVE");

        assertEquals(Student.StudentStatus.ACTIVE, student.getStatus());
        verify(studentRepository).save(student);
    }

    @Test
    void saveImportedStudents_EmptyList_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, () -> studentService.saveImportedStudents(java.util.List.of()));
    }

    @Test
    void saveImportedStudents_ValidRows_SavesSuccessfully() {
        com.sms.dto.response.StudentImportRow row = com.sms.dto.response.StudentImportRow.builder()
                .studentCode("STU002")
                .fullName("Nguyen Van B")
                .dateOfBirth("2005-05-10")
                .gender("Nam")
                .classCode("CNPM01")
                .email("b.nv@example.com")
                .phone("0912345678")
                .valid(true)
                .build();

        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(role));
        when(studentRepository.existsByStudentCode("STU002")).thenReturn(false);
        when(studentRepository.existsByEmail("b.nv@example.com")).thenReturn(false);
        when(classRepository.findByCode("CNPM01")).thenReturn(Optional.of(classEntity));
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        int count = studentService.saveImportedStudents(java.util.List.of(row));

        assertEquals(1, count);
        verify(userRepository).save(any(User.class));
        verify(studentRepository).save(any(Student.class));
    }
}
