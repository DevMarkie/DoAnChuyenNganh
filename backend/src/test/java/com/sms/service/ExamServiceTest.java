package com.sms.service;

import com.sms.dto.request.AutoAssignExamRoomsRequest;
import com.sms.dto.request.ExamGradeCommitItem;
import com.sms.dto.request.ExamGradeCommitRequest;
import com.sms.dto.request.ExamSessionRequest;
import com.sms.dto.response.ExamRoomResponse;
import com.sms.dto.response.ExamSessionResponse;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExamServiceTest {

    @Mock
    private ExamSessionRepository examSessionRepository;
    @Mock
    private ExamRoomRepository examRoomRepository;
    @Mock
    private ExamRosterRepository examRosterRepository;
    @Mock
    private GradeAuditLogRepository gradeAuditLogRepository;
    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExamService examService;

    private Semester semester;
    private Subject subject;
    private ExamSession session;
    private ExamRoom room;
    private Student student;
    private Enrollment enrollment;
    private ExamRoster roster;
    private Grade grade;
    private User adminUser;

    @BeforeEach
    void setUp() {
        semester = new Semester();
        semester.setId(1);
        semester.setSemesterName("Học kỳ 1 2026-2027");

        subject = new Subject();
        subject.setId(101);
        subject.setSubjectCode("IT301");
        subject.setSubjectName("Lập trình Web");

        session = ExamSession.builder()
                .id(1L)
                .semester(semester)
                .subject(subject)
                .sessionName("Thi Cuối Kỳ IT301")
                .examDate(LocalDate.of(2026, 12, 15))
                .startTime("07:30")
                .endTime("09:30")
                .build();

        room = ExamRoom.builder()
                .id(10L)
                .examSession(session)
                .roomCode("P.01")
                .roomLocation("Giảng đường A2 - Phòng 1")
                .capacity(40)
                .status(ExamRoomStatus.SCHEDULED)
                .build();

        student = new Student();
        student.setId(50L);
        student.setStudentCode("24010001");
        student.setFullName("Nguyễn Văn An");
        student.setDateOfBirth(LocalDate.of(2004, 5, 20));

        enrollment = new Enrollment();
        enrollment.setId(100L);
        enrollment.setStudent(student);

        roster = ExamRoster.builder()
                .id(200L)
                .examRoom(room)
                .enrollment(enrollment)
                .student(student)
                .sbd("IT301-P01-001")
                .specialGrade(Grade.SpecialGrade.NONE)
                .build();

        grade = new Grade();
        grade.setId(300L);
        grade.setEnrollment(enrollment);
        grade.setCc1Score(new BigDecimal("9.0"));
        grade.setCc2Score(new BigDecimal("9.0"));
        grade.setMidtermScore(new BigDecimal("8.0"));

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
    }

    @Test
    void testCreateSession_Success() {
        ExamSessionRequest req = ExamSessionRequest.builder()
                .semesterId(1)
                .subjectId(101)
                .sessionName("Thi Cuối Kỳ IT301")
                .examDate(LocalDate.of(2026, 12, 15))
                .startTime("07:30")
                .endTime("09:30")
                .build();

        when(semesterRepository.findById(1)).thenReturn(Optional.of(semester));
        when(subjectRepository.findById(101)).thenReturn(Optional.of(subject));
        when(examSessionRepository.save(any(ExamSession.class))).thenReturn(session);

        ExamSessionResponse res = examService.createSession(req);

        assertNotNull(res);
        assertEquals("Thi Cuối Kỳ IT301", res.getSessionName());
        assertEquals("IT301", res.getSubjectCode());
        verify(examSessionRepository, times(1)).save(any(ExamSession.class));
    }

    @Test
    void testAutoAssignRooms_Success() {
        when(examSessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(enrollmentRepository.findActiveBySemesterIdAndSubjectId(1, 101))
                .thenReturn(List.of(enrollment));
        when(examRoomRepository.findByExamSessionId(1L)).thenReturn(List.of());
        when(examRoomRepository.save(any(ExamRoom.class))).thenReturn(room);

        AutoAssignExamRoomsRequest req = AutoAssignExamRoomsRequest.builder()
                .studentsPerRoom(30)
                .roomPrefix("P")
                .startRoomNumber(1)
                .build();

        List<ExamRoomResponse> responses = examService.autoAssignRooms(1L, req);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(examRosterRepository, times(1)).saveAll(anyList());
    }

    @Test
    void testAutoAssignRooms_NoStudents_ThrowsBadRequest() {
        when(examSessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(enrollmentRepository.findActiveBySemesterIdAndSubjectId(1, 101))
                .thenReturn(List.of());

        AutoAssignExamRoomsRequest req = AutoAssignExamRoomsRequest.builder().build();

        assertThrows(BadRequestException.class, () -> examService.autoAssignRooms(1L, req));
    }

    @Test
    void testCommitExamGrades_Success_CalculatesTotalScoreAndFinalizes() {
        when(examRoomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(examRosterRepository.findById(200L)).thenReturn(Optional.of(roster));
        when(gradeRepository.findByEnrollmentId(100L)).thenReturn(Optional.of(grade));

        ExamGradeCommitItem item = ExamGradeCommitItem.builder()
                .rosterId(200L)
                .studentCode("24010001")
                .sbd("IT301-P01-001")
                .score(new BigDecimal("8.5"))
                .specialGrade(Grade.SpecialGrade.NONE)
                .violationNote(null)
                .build();

        ExamGradeCommitRequest req = ExamGradeCommitRequest.builder()
                .reason("Nhập điểm thi đợt 1")
                .items(List.of(item))
                .build();

        examService.commitExamGrades(1L, 10L, req);

        assertEquals(new BigDecimal("8.5"), roster.getScore());
        assertEquals(new BigDecimal("8.5"), grade.getFinalScore());
        assertTrue(grade.getIsFinalized());
        assertNotNull(grade.getFinalizedAt());
        assertNotNull(grade.getTotalScore());
        // CC1: 9 * 0.05 = 0.45, CC2: 9 * 0.05 = 0.45, GK: 8 * 0.3 = 2.4, CK: 8.5 * 0.6 = 5.1 -> Total = 8.40
        assertEquals(new BigDecimal("8.40"), grade.getTotalScore());
        assertEquals("B+", grade.getLetterGrade());

        assertEquals(ExamRoomStatus.SCORED, room.getStatus());
        verify(gradeAuditLogRepository, times(1)).saveAll(anyList());
    }

    @Test
    void testCommitExamGrades_SpecialGradeV_SetsAbsent() {
        when(examRoomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(examRosterRepository.findById(200L)).thenReturn(Optional.of(roster));
        when(gradeRepository.findByEnrollmentId(100L)).thenReturn(Optional.of(grade));

        ExamGradeCommitItem item = ExamGradeCommitItem.builder()
                .rosterId(200L)
                .studentCode("24010001")
                .sbd("IT301-P01-001")
                .score(BigDecimal.ZERO)
                .specialGrade(Grade.SpecialGrade.V)
                .violationNote("Vắng thi không phép")
                .build();

        ExamGradeCommitRequest req = ExamGradeCommitRequest.builder()
                .items(List.of(item))
                .build();

        examService.commitExamGrades(1L, 10L, req);

        assertEquals(Grade.SpecialGrade.V, roster.getSpecialGrade());
        assertEquals(Grade.SpecialGrade.V, grade.getSpecialGrade());
        assertTrue(grade.getIsFinalized());
    }
}
