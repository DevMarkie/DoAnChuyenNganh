package com.sms.service;

import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpecialClassServiceTest {

    @Mock
    private ClassOpeningRequestRepository requestRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private CourseSectionRepository sectionRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private FeeScaleRuleRepository feeScaleRuleRepository;
    @Mock
    private StudentInvoiceRepository invoiceRepository;
    @Mock
    private LecturerRepository lecturerRepository;

    @InjectMocks
    private SpecialClassService specialClassService;

    private Student student;
    private Subject subject;
    private Semester semester;
    private Lecturer lecturer;

    @BeforeEach
    void setUp() {
        Department dept = new Department();
        dept.setId(1);
        dept.setName("Công nghệ thông tin");

        student = new Student();
        student.setId(10L);
        student.setStudentCode("21010001");

        subject = new Subject();
        subject.setId(100);
        subject.setSubjectCode("IT301");
        subject.setSubjectName("Hệ cơ sở dữ liệu");
        subject.setCredits(3);
        subject.setDepartment(dept);

        semester = new Semester();
        semester.setId(5);
        semester.setSemesterCode("HK1_2026");

        lecturer = new Lecturer();
        lecturer.setId(50L);
        lecturer.setFullName("TS. Nguyễn Văn A");
    }

    @Test
    @DisplayName("submitRequest thành công khi dữ liệu hợp lệ")
    void submitRequest_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(subjectRepository.findById(100)).thenReturn(Optional.of(subject));
        when(semesterRepository.findById(5)).thenReturn(Optional.of(semester));
        when(sectionRepository.findBySubjectId(100)).thenReturn(List.of());
        when(requestRepository.existsByStudentIdAndSubjectIdAndSemesterId(10L, 100, 5)).thenReturn(false);
        when(requestRepository.save(any(ClassOpeningRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassOpeningRequest result = specialClassService.submitRequest(1L, 100, 5, ClassOpeningRequest.RequestType.LEARN_AGAIN);

        assertThat(result).isNotNull();
        assertThat(result.getStudent()).isEqualTo(student);
        assertThat(result.getSubject()).isEqualTo(subject);
        assertThat(result.getSemester()).isEqualTo(semester);
        assertThat(result.getRequestType()).isEqualTo(ClassOpeningRequest.RequestType.LEARN_AGAIN);
    }

    @Test
    @DisplayName("submitRequest thất bại khi sinh viên đã gửi đơn trước đó")
    void submitRequest_DuplicateThrows() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(subjectRepository.findById(100)).thenReturn(Optional.of(subject));
        when(semesterRepository.findById(5)).thenReturn(Optional.of(semester));
        when(sectionRepository.findBySubjectId(100)).thenReturn(List.of());
        when(requestRepository.existsByStudentIdAndSubjectIdAndSemesterId(10L, 100, 5)).thenReturn(true);

        assertThatThrownBy(() -> specialClassService.submitRequest(1L, 100, 5, ClassOpeningRequest.RequestType.NEW))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Sinh viên chỉ được gửi một đơn");
    }

    @Test
    @DisplayName("createSpecialSection tạo lớp riêng thành công từ danh sách đơn pending")
    void createSpecialSection_Success() {
        ClassOpeningRequest req = new ClassOpeningRequest();
        req.setId(101L);
        req.setStudent(student);
        req.setSubject(subject);
        req.setSemester(semester);
        req.setRequestType(ClassOpeningRequest.RequestType.LEARN_AGAIN);

        when(requestRepository.findPendingForUpdate(100, 5, ClassOpeningRequest.RequestStatus.PENDING))
                .thenReturn(List.of(req));
        when(sectionRepository.findNonCancelledBySubjectAndSemester(100, 5)).thenReturn(List.of());
        when(subjectRepository.findById(100)).thenReturn(Optional.of(subject));
        when(semesterRepository.findById(5)).thenReturn(Optional.of(semester));
        when(lecturerRepository.findById(50L)).thenReturn(Optional.of(lecturer));
        when(sectionRepository.save(any(CourseSection.class))).thenAnswer(inv -> inv.getArgument(0));
        when(enrollmentRepository.existsByStudentIdAndSectionSubjectIdAndSectionSemesterIdAndStatus(
                eq(10L), eq(100), eq(5), eq(Enrollment.EnrollmentStatus.ENROLLED))).thenReturn(false);

        CourseSection section = specialClassService.createSpecialSection(
                100, 5, 50L, "IT301_SPECIAL", 15, BigDecimal.valueOf(700_000));

        assertThat(section).isNotNull();
        assertThat(section.getSectionType()).isEqualTo(CourseSection.SectionType.SPECIAL);
        assertThat(section.getStatus()).isEqualTo(CourseSection.SectionStatus.PENDING_FEE);
        assertThat(req.getStatus()).isEqualTo(ClassOpeningRequest.RequestStatus.APPROVED);
        verify(enrollmentRepository, times(1)).save(any(Enrollment.class));
    }

    @Test
    @DisplayName("createSpecialSection thất bại khi không có đơn nào đang chờ")
    void createSpecialSection_NoRequestsThrows() {
        when(requestRepository.findPendingForUpdate(100, 5, ClassOpeningRequest.RequestStatus.PENDING))
                .thenReturn(List.of());

        assertThatThrownBy(() -> specialClassService.createSpecialSection(
                100, 5, 50L, "IT301_SPECIAL", 15, BigDecimal.valueOf(700_000)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không có đơn đề nghị mở lớp đang chờ xử lý");
    }

    @Test
    @DisplayName("finalizeBilling tính toán học phí lớp riêng và tạo hóa đơn chuẩn xác")
    void finalizeBilling_Success() {
        CourseSection section = new CourseSection();
        section.setId(200L);
        section.setSectionType(CourseSection.SectionType.SPECIAL);
        section.setStatus(CourseSection.SectionStatus.PENDING_FEE);
        section.setSubject(subject);
        section.setBaseTuitionRate(BigDecimal.valueOf(650_000));

        Enrollment enr = new Enrollment();
        enr.setId(301L);
        enr.setStudent(student);
        enr.setSection(section);

        FeeScaleRule rule = new FeeScaleRule();
        rule.setMinStudents(1);
        rule.setMaxStudents(5);
        rule.setCoefficient(BigDecimal.valueOf(2.50));

        when(sectionRepository.findByIdForEnrollment(200L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findActiveBySectionId(200L)).thenReturn(List.of(enr));
        when(feeScaleRuleRepository.findFirstByMinStudentsLessThanEqualAndMaxStudentsGreaterThanEqual(1, 1))
                .thenReturn(Optional.of(rule));
        when(invoiceRepository.existsByStudentIdAndSectionId(10L, 200L)).thenReturn(false);
        when(sectionRepository.save(any(CourseSection.class))).thenAnswer(inv -> inv.getArgument(0));

        CourseSection result = specialClassService.finalizeBilling(200L);

        assertThat(result.getStatus()).isEqualTo(CourseSection.SectionStatus.LOCKED_BILLING);
        assertThat(result.getScaleCoefficient()).isEqualByComparingTo("2.50");
        verify(invoiceRepository, times(1)).save(any(StudentInvoice.class));
    }
}
