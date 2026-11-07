package com.sms.service;

import com.sms.entity.ClassEntity;
import com.sms.entity.Student;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.repository.ClassRepository;
import com.sms.repository.RoleRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentLifecycleTransitionTest {

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

    @Mock
    private CurriculumService curriculumService;

    @InjectMocks
    private StudentService studentService;

    private Student student;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(10L);
        user.setUsername("23010359");
        user.setIsActive(true);

        student = new Student();
        student.setId(100L);
        student.setStudentCode("23010359");
        student.setFullName("Nguyễn Duy Minh");
        student.setUser(user);
        student.setStatus(Student.StudentStatus.ACTIVE);
    }

    @Nested
    @DisplayName("1. Hợp lệ: Các bước chuyển đổi trạng thái chuẩn trong Vòng đời sinh viên")
    class ValidLifecycleTransitions {

        @Test
        @DisplayName("Đang học -> Bảo lưu (ACTIVE -> RESERVED)")
        void testActiveToReserved_Success() {
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            studentService.updateStatus(100L, "RESERVED");

            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.RESERVED);
            verify(studentRepository).save(student);
            verify(userRepository).save(user);
            assertThat(user.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("Hết hạn bảo lưu -> Quay lại học tập (RESERVED -> ACTIVE)")
        void testReservedToActive_Success() {
            student.setStatus(Student.StudentStatus.RESERVED);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            studentService.updateStatus(100L, "ACTIVE");

            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.ACTIVE);
            verify(studentRepository).save(student);
            assertThat(user.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("Đang học -> Tạm đình chỉ học tập (ACTIVE -> SUSPENDED)")
        void testActiveToSuspended_Success() {
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            studentService.updateStatus(100L, "SUSPENDED");

            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.SUSPENDED);
            verify(studentRepository).save(student);
        }

        @Test
        @DisplayName("Hết thời gian đình chỉ -> Quay lại học tập (SUSPENDED -> ACTIVE)")
        void testSuspendedToActive_Success() {
            student.setStatus(Student.StudentStatus.SUSPENDED);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            studentService.updateStatus(100L, "ACTIVE");

            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.ACTIVE);
            verify(studentRepository).save(student);
        }

        @Test
        @DisplayName("Đang học -> Buộc thôi học / Ngừng học (ACTIVE -> INACTIVE) & Khóa tài khoản đăng nhập")
        void testActiveToInactive_LocksUserAccount() {
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            studentService.updateStatus(100L, "INACTIVE");

            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.INACTIVE);
            verify(studentRepository).save(student);
            verify(userRepository).save(user);
            assertThat(user.getIsActive()).isFalse(); // Khóa tài khoản
        }

        @Test
        @DisplayName("Quá hạn bảo lưu -> Buộc thôi học (RESERVED -> INACTIVE)")
        void testReservedToInactive_Success() {
            student.setStatus(Student.StudentStatus.RESERVED);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            studentService.updateStatus(100L, "INACTIVE");

            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.INACTIVE);
            verify(studentRepository).save(student);
            assertThat(user.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("Đang học -> Tốt nghiệp (ACTIVE -> GRADUATED) khi thẩm định chuẩn đầu ra thành công")
        void testActiveToGraduated_WhenEligible_Success() {
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));
            doNothing().when(curriculumService).validateGraduationEligibility(100L);

            studentService.updateStatus(100L, "GRADUATED");

            assertThat(student.getStatus()).isEqualTo(Student.StudentStatus.GRADUATED);
            verify(curriculumService).validateGraduationEligibility(100L);
            verify(studentRepository).save(student);
        }
    }

    @Nested
    @DisplayName("2. Anti-skip & Ràng buộc chuyển đổi trạng thái phi lý (State Machine Rules)")
    class AntiSkipAndInvalidTransitionTests {

        @Test
        @DisplayName("Anti-skip 1: Sinh viên Đang bảo lưu (RESERVED) không thể nhảy cóc sang Tốt nghiệp (GRADUATED)")
        void testAntiSkip_ReservedToGraduated_Forbidden() {
            student.setStatus(Student.StudentStatus.RESERVED);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "GRADUATED"));
            assertTrue(ex.getMessage().contains("Vi phạm luồng trạng thái"));
            verify(studentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Anti-skip 2: Sinh viên Đang đình chỉ (SUSPENDED) không thể nhảy cóc sang Tốt nghiệp (GRADUATED)")
        void testAntiSkip_SuspendedToGraduated_Forbidden() {
            student.setStatus(Student.StudentStatus.SUSPENDED);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "GRADUATED"));
            assertTrue(ex.getMessage().contains("Vi phạm luồng trạng thái"));
            verify(studentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Anti-skip 3: Sinh viên Buộc thôi học (INACTIVE) không thể nhảy cóc sang Tốt nghiệp (GRADUATED)")
        void testAntiSkip_InactiveToGraduated_Forbidden() {
            student.setStatus(Student.StudentStatus.INACTIVE);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "GRADUATED"));
            assertTrue(ex.getMessage().contains("Sinh viên đã thôi học (INACTIVE)"));
            verify(studentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Terminal State 1: Sinh viên đã thôi học (INACTIVE) không thể tự ý chuyển về Đang học (ACTIVE)")
        void testTerminalState_InactiveToActive_Forbidden() {
            student.setStatus(Student.StudentStatus.INACTIVE);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "ACTIVE"));
            assertTrue(ex.getMessage().contains("Sinh viên đã thôi học (INACTIVE)"));
            verify(studentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Terminal State 2: Sinh viên đã tốt nghiệp (GRADUATED) không thể chuyển sang trạng thái khác")
        void testTerminalState_GraduatedToAny_Forbidden() {
            student.setStatus(Student.StudentStatus.GRADUATED);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "ACTIVE"));
            assertTrue(ex.getMessage().contains("Sinh viên đã tốt nghiệp (GRADUATED)"));

            assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "RESERVED"));
            verify(studentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Chặn chuyển đổi bất hợp lệ giữa Bảo lưu và Đình chỉ (RESERVED <-> SUSPENDED)")
        void testInvalidTransition_ReservedToSuspended_Forbidden() {
            student.setStatus(Student.StudentStatus.RESERVED);
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "SUSPENDED"));
            assertTrue(ex.getMessage().contains("chỉ có thể quay lại học tập (ACTIVE) hoặc thôi học"));
        }

        @Test
        @DisplayName("Chặn chuyển sang GRADUATED nếu chưa thỏa mãn điều kiện thẩm định chuẩn đầu ra")
        void testActiveToGraduated_Ineligible_ThrowsBadRequest() {
            when(studentRepository.findById(100L)).thenReturn(Optional.of(student));
            doThrow(new BadRequestException("Sinh viên chưa hoàn thành đủ 135 tín chỉ"))
                    .when(curriculumService).validateGraduationEligibility(100L);

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> studentService.updateStatus(100L, "GRADUATED"));
            assertTrue(ex.getMessage().contains("chưa hoàn thành đủ 135 tín chỉ"));
            verify(studentRepository, never()).save(any());
        }
    }
}
