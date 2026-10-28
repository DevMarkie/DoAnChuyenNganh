package com.sms.service;

import com.sms.dto.request.AchievementDisciplineRequest;
import com.sms.dto.request.TrainingPointRequest;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.StudentAchievementDiscipline;
import com.sms.entity.StudentTrainingPoint;
import com.sms.repository.SemesterRepository;
import com.sms.repository.StudentAchievementDisciplineRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.StudentTrainingPointRepository;
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
public class StudentConductServiceTest {

    @Mock
    private StudentAchievementDisciplineRepository achievementDisciplineRepository;

    @Mock
    private StudentTrainingPointRepository trainingPointRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private SemesterRepository semesterRepository;

    @InjectMocks
    private StudentConductService studentConductService;

    private Student student;
    private Semester semester;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);
        student.setStudentCode("2500001");
        student.setFullName("Nguyen Van A");

        semester = new Semester();
        semester.setId(1);
        semester.setSemesterName("Học kỳ 1");
    }

    @Test
    void testCreateAchievementDiscipline_Success() {
        AchievementDisciplineRequest request = new AchievementDisciplineRequest();
        request.setStudentId(1L);
        request.setSemesterId(1);
        request.setType("REWARD");
        request.setDecisionNumber("QD-01/DH");
        request.setIssueDate("2026-01-15");
        request.setTitle("Sinh viên Xuất sắc");
        request.setDescription("Thành tích cao trong học tập");
        request.setLevel("TRUONG");

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        when(achievementDisciplineRepository.save(any(StudentAchievementDiscipline.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StudentAchievementDiscipline result = studentConductService.createRecord(request);

        assertNotNull(result);
        assertEquals(StudentAchievementDiscipline.RecordType.REWARD, result.getType());
        assertEquals("QD-01/DH", result.getDecisionNumber());
        assertEquals("Sinh viên Xuất sắc", result.getTitle());
        verify(achievementDisciplineRepository, times(1)).save(any(StudentAchievementDiscipline.class));
    }

    @Test
    void testSaveTrainingPoint_Success_GradeCalculation() {
        TrainingPointRequest request = new TrainingPointRequest();
        request.setStudentId(1L);
        request.setSemesterId(1);
        request.setScore(92);
        request.setNotes("Tích cực tham gia hoạt động");

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        when(trainingPointRepository.findByStudentIdAndSemesterId(1L, 1)).thenReturn(Optional.empty());
        when(trainingPointRepository.save(any(StudentTrainingPoint.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StudentTrainingPoint result = studentConductService.saveTrainingPoint(request);

        assertNotNull(result);
        assertEquals(92, result.getScore());
        assertEquals("XUAT_SAC", result.getEvaluationGrade());
        verify(trainingPointRepository, times(1)).save(any(StudentTrainingPoint.class));
    }

    @Test
    void testSearchAchievementsDisciplines() {
        when(achievementDisciplineRepository.search(1L, StudentAchievementDiscipline.RecordType.REWARD, 1))
                .thenReturn(List.of(new StudentAchievementDiscipline()));

        List<StudentAchievementDiscipline> list = studentConductService.searchAchievementsDisciplines(1L, "REWARD", 1);
        assertEquals(1, list.size());
    }
}
