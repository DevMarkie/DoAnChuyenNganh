package com.sms.service;

import com.sms.dto.response.DashboardResponse;
import com.sms.entity.Student;
import com.sms.repository.ClassRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DashboardServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private ClassRepository classRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getDashboard_Success() {
        when(studentRepository.count()).thenReturn(100L);
        when(studentRepository.countByStatus(Student.StudentStatus.ACTIVE)).thenReturn(80L);
        when(studentRepository.countByStatus(Student.StudentStatus.GRADUATED)).thenReturn(10L);
        when(studentRepository.countByStatus(Student.StudentStatus.SUSPENDED)).thenReturn(5L);
        when(studentRepository.countByStatus(Student.StudentStatus.INACTIVE)).thenReturn(5L);

        Object[] row1 = {"CNTT", 50L};
        Object[] row2 = {"Kinh Te", 50L};
        when(studentRepository.countByDepartmentWithName()).thenReturn(List.of(row1, row2));

        when(departmentRepository.count()).thenReturn(5L);
        when(classRepository.count()).thenReturn(20L);
        when(subjectRepository.count()).thenReturn(30L);
        when(lecturerRepository.count()).thenReturn(40L);
        when(courseSectionRepository.count()).thenReturn(50L);

        DashboardResponse response = dashboardService.getDashboard();

        assertNotNull(response);
        assertEquals(100L, response.getTotalStudents());
        assertEquals(80L, response.getActiveStudents());
        assertEquals(10L, response.getGraduatedStudents());
        assertEquals(5L, response.getSuspendedStudents());
        assertEquals(5L, response.getTotalDepartments());
        assertEquals(20L, response.getTotalClasses());
        assertEquals(30L, response.getTotalSubjects());
        assertEquals(40L, response.getTotalLecturers());
        assertEquals(50L, response.getTotalCourseSections());
        
        assertEquals(2, response.getStudentsByDepartment().size());
        assertEquals(4, response.getStudentsByStatus().size());
    }
}
