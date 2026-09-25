package com.sms.service;

import com.sms.dto.response.DashboardResponse;
import com.sms.entity.Student;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassRepository classRepository;
    private final SubjectRepository subjectRepository;
    private final LecturerRepository lecturerRepository;
    private final CourseSectionRepository courseSectionRepository;

    public DashboardResponse getDashboard() {
        long total = studentRepository.count();
        long active = studentRepository.countByStatus(Student.StudentStatus.ACTIVE);
        long graduated = studentRepository.countByStatus(Student.StudentStatus.GRADUATED);
        long suspended = studentRepository.countByStatus(Student.StudentStatus.SUSPENDED);

        // Students by department — dùng query JOIN để tránh N+1 query
        List<Object[]> byDept = studentRepository.countByDepartmentWithName();
        List<Map<String, Object>> studentsByDept = new ArrayList<>();
        for (Object[] row : byDept) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("count", row[1]);
            studentsByDept.add(item);
        }

        // Students by status
        List<Map<String, Object>> studentsByStatus = List.of(
                Map.of("name", "Đang học", "count", active),
                Map.of("name", "Tốt nghiệp", "count", graduated),
                Map.of("name", "Đình chỉ", "count", suspended),
                Map.of("name", "Nghỉ học", "count",
                        studentRepository.countByStatus(Student.StudentStatus.INACTIVE))
        );

        return DashboardResponse.builder()
                .totalStudents(total)
                .activeStudents(active)
                .graduatedStudents(graduated)
                .suspendedStudents(suspended)
                .totalDepartments(departmentRepository.count())
                .totalClasses(classRepository.count())
                .totalSubjects(subjectRepository.count())
                .totalLecturers(lecturerRepository.count())
                .totalCourseSections(courseSectionRepository.count())
                .studentsByDepartment(studentsByDept)
                .studentsByStatus(studentsByStatus)
                .build();
    }
}
