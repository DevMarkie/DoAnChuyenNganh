package com.sms.service;

import com.sms.dto.request.ApproveResetRequest;
import com.sms.dto.request.ForgotPasswordRequest;
import com.sms.dto.request.RejectResetRequest;
import com.sms.dto.response.BulkResetPasswordResponse;
import com.sms.dto.response.PasswordResetResult;
import com.sms.entity.Lecturer;
import com.sms.entity.PasswordResetRequest;
import com.sms.entity.Role;
import com.sms.entity.Student;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.repository.LecturerRepository;
import com.sms.repository.PasswordResetRequestRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PasswordResetServiceTest {

    @Mock
    private PasswordResetRequestRepository resetRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User user;
    private Student student;
    private PasswordResetRequest resetRequest;

    @BeforeEach
    void setUp() {
        Role role = new Role();
        role.setName("STUDENT");

        user = new User();
        user.setId(1L);
        user.setUsername("user1");
        user.setRole(role);
        user.setEmail("user1@example.com");

        student = new Student();
        student.setId(1L);
        student.setUser(user);
        student.setStudentCode("user1");
        student.setFullName("Nguyen Van A");
        student.setEmail("student@example.com");

        resetRequest = new PasswordResetRequest();
        resetRequest.setId(1L);
        resetRequest.setUser(user);
        resetRequest.setStatus(PasswordResetRequest.RequestStatus.PENDING);
        resetRequest.setRole("STUDENT");
        resetRequest.setEmail("requester@example.com");
    }

    @Test
    void createRequest_Success() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setUsername("user1");
        request.setEmail("requester@example.com");

        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(resetRepository.existsByUserIdAndStatus(1L, PasswordResetRequest.RequestStatus.PENDING)).thenReturn(false);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(resetRepository.save(any(PasswordResetRequest.class))).thenAnswer(i -> i.getArgument(0));

        PasswordResetRequest result = passwordResetService.createRequest(request);

        assertNotNull(result);
        // Khang dinh tren DOI TUONG service dung: username lay tu user, trang thai PENDING.
        assertEquals("user1", result.getUsername());
        assertEquals(PasswordResetRequest.RequestStatus.PENDING, result.getStatus());
    }

    @Test
    void createRequest_UserNotFound_ReturnsNull() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setUsername("unknown");

        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(studentRepository.findByStudentCode("unknown")).thenReturn(Optional.empty());
        when(lecturerRepository.findByLecturerCode("unknown")).thenReturn(Optional.empty());

        PasswordResetRequest result = passwordResetService.createRequest(request);

        assertNull(result);
    }

    @Test
    void approveRequest_Success() {
        User admin = new User();
        admin.setId(2L);

        when(resetRepository.findById(1L)).thenReturn(Optional.of(resetRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(resetRepository.save(any(PasswordResetRequest.class))).thenReturn(resetRequest);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(emailService.sendPasswordResetEmail(anyString(), any(), any(), anyString(), anyString())).thenReturn(true);

        ApproveResetRequest req = new ApproveResetRequest();
        req.setNewPassword("newPass123");

        PasswordResetResult result = passwordResetService.approveRequest(1L, req, 2L);

        assertNotNull(result);
        assertTrue(result.isEmailSent());
        assertEquals(PasswordResetRequest.RequestStatus.APPROVED, resetRequest.getStatus());
        assertTrue(user.getMustChangePassword());
    }

    @Test
    void approveRequest_AlreadyProcessed_Throws() {
        resetRequest.setStatus(PasswordResetRequest.RequestStatus.APPROVED);
        when(resetRepository.findById(1L)).thenReturn(Optional.of(resetRequest));

        assertThrows(BadRequestException.class, () -> passwordResetService.approveRequest(1L, null, 2L));
    }

    @Test
    void rejectRequest_Success() {
        User admin = new User();
        admin.setId(2L);

        when(resetRepository.findById(1L)).thenReturn(Optional.of(resetRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(resetRepository.save(any(PasswordResetRequest.class))).thenReturn(resetRequest);

        RejectResetRequest req = new RejectResetRequest();
        req.setRejectReason("Invalid");

        PasswordResetRequest result = passwordResetService.rejectRequest(1L, req, 2L);

        assertNotNull(result);
        assertEquals(PasswordResetRequest.RequestStatus.REJECTED, result.getStatus());
        verify(emailService).sendRejectionEmail(any(), any(), any(), anyString());
    }

    @Test
    void batchApprove_Success() {
        User admin = new User();
        admin.setId(2L);

        when(resetRepository.findById(1L)).thenReturn(Optional.of(resetRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(resetRepository.save(any(PasswordResetRequest.class))).thenReturn(resetRequest);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));

        List<PasswordResetResult> results = passwordResetService.batchApprove(List.of(1L), 2L);

        assertEquals(1, results.size());
    }

    @Test
    void approve_sendsToOnFileEmail_notRequesterSuppliedAddress() {
        Role role = new Role();
        role.setName("STUDENT");
        User target = new User();
        target.setId(10L);
        target.setUsername("2500001");
        target.setEmail("account.email@school.edu.vn");
        target.setRole(role);

        PasswordResetRequest req = PasswordResetRequest.builder()
                .id(1L)
                .user(target)
                .username(target.getUsername())
                .fullName("Nguyen Van A")
                .role("STUDENT")
                .email("attacker@evil.com")
                .status(PasswordResetRequest.RequestStatus.PENDING)
                .build();

        Student profile = new Student();
        profile.setId(99L);
        profile.setEmail("profile.email@school.edu.vn");

        when(resetRepository.findById(1L)).thenReturn(Optional.of(req));
        when(userRepository.findById(500L)).thenReturn(Optional.of(new User()));
        when(studentRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(passwordEncoder.encode(anyString())).thenReturn("ENCODED");
        when(resetRepository.save(any(PasswordResetRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(emailService.sendPasswordResetEmail(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        PasswordResetResult result = passwordResetService.approveRequest(1L, null, 500L);

        org.mockito.ArgumentCaptor<String> to = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(to.capture(), anyString(), anyString(), anyString(), anyString());

        assertEquals("profile.email@school.edu.vn", to.getValue());
        assertNotEquals("attacker@evil.com", to.getValue());
        assertTrue(result.isEmailSent());
    }

    @Test
    void createRequest_pendingAlreadyExists_returnsNullWithoutSaving() {
        ForgotPasswordRequest fr = new ForgotPasswordRequest();
        fr.setUsername("user1");
        fr.setEmail("user1@example.com");

        Role role = new Role();
        role.setName("STUDENT");
        User user = new User();
        user.setId(12L);
        user.setUsername("user1");
        user.setRole(role);

        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(resetRepository.existsByUserIdAndStatus(
                12L, PasswordResetRequest.RequestStatus.PENDING))
                .thenReturn(true);

        PasswordResetRequest req = passwordResetService.createRequest(fr);
        assertNull(req);
        verify(resetRepository, never()).save(any());
    }

    @Test
    void sendOtp_and_verifyOtpAndReset_flowSuccess() {
        Role role = new Role();
        role.setName("STUDENT");
        User user = new User();
        user.setId(25L);
        user.setUsername("2500001");
        user.setEmail("sv2500001@st.phenikaa-uni.edu.vn");
        user.setRole(role);

        when(userRepository.findByUsername("2500001")).thenReturn(Optional.of(user));
        when(userRepository.findById(25L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPassword123")).thenReturn("encodedPassword");

        com.sms.dto.request.SendOtpRequest sendReq = new com.sms.dto.request.SendOtpRequest("2500001");
        com.sms.dto.response.SendOtpResponse sendRes = passwordResetService.sendOtp(sendReq);

        assertNotNull(sendRes);
        assertNotNull(sendRes.getDevOtp());
        assertEquals(6, sendRes.getDevOtp().length());
        verify(emailService, times(1)).sendOtpEmail(anyString(), anyString(), eq("2500001"), eq(sendRes.getDevOtp()));

        // Verify with wrong OTP -> throws
        com.sms.dto.request.VerifyOtpResetRequest wrongReq = new com.sms.dto.request.VerifyOtpResetRequest(
                "2500001", "000000", "newPassword123");
        assertThrows(BadRequestException.class, () -> passwordResetService.verifyOtpAndReset(wrongReq));

        // Verify with correct OTP -> resets password
        com.sms.dto.request.VerifyOtpResetRequest correctReq = new com.sms.dto.request.VerifyOtpResetRequest(
                "2500001", sendRes.getDevOtp(), "newPassword123");
        assertDoesNotThrow(() -> passwordResetService.verifyOtpAndReset(correctReq));
        assertEquals("encodedPassword", user.getPassword());
        assertFalse(user.getMustChangePassword());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void resetAllPasswordsToDateOfBirth_successWithStudentAndLecturerAndAdminWithStaffSkipped() {
        // User 1: Student with DOB 2002-03-15 -> expected password "15032002a@"
        Role studentRole = new Role();
        studentRole.setName("STUDENT");
        User studentUser = new User();
        studentUser.setId(101L);
        studentUser.setUsername("sv001");
        studentUser.setRole(studentRole);

        Student studentProfile = new Student();
        studentProfile.setId(201L);
        studentProfile.setUser(studentUser);
        studentProfile.setDateOfBirth(LocalDate.of(2002, 3, 15));

        // User 2: Lecturer with DOB 1980-11-05 -> expected password "05111980a@"
        Role lecturerRole = new Role();
        lecturerRole.setName("LECTURER");
        User lecturerUser = new User();
        lecturerUser.setId(102L);
        lecturerUser.setUsername("gv001");
        lecturerUser.setRole(lecturerRole);

        Lecturer lecturerProfile = new Lecturer();
        lecturerProfile.setId(202L);
        lecturerProfile.setUser(lecturerUser);
        lecturerProfile.setDateOfBirth(LocalDate.of(1980, 11, 5));

        // User 3: Admin with DOB on User entity: 1990-01-01 -> expected password "01011990a@"
        Role adminRole = new Role();
        adminRole.setName("ADMIN");
        User adminUser = new User();
        adminUser.setId(103L);
        adminUser.setUsername("admin");
        adminUser.setRole(adminRole);
        adminUser.setDateOfBirth(LocalDate.of(1990, 1, 1));

        // User 4: Staff without DOB -> should be skipped
        Role staffRole = new Role();
        staffRole.setName("ACADEMIC_AFFAIRS");
        User staffUser = new User();
        staffUser.setId(104L);
        staffUser.setUsername("daotao_nodob");
        staffUser.setRole(staffRole);
        staffUser.setDateOfBirth(null);

        when(userRepository.findAll()).thenReturn(List.of(studentUser, lecturerUser, adminUser, staffUser));
        when(studentRepository.findByUserId(101L)).thenReturn(Optional.of(studentProfile));
        when(lecturerRepository.findByUserId(102L)).thenReturn(Optional.of(lecturerProfile));
        when(passwordEncoder.encode("15032002a@")).thenReturn("HASH_15032002a@");
        when(passwordEncoder.encode("05111980a@")).thenReturn("HASH_05111980a@");
        when(passwordEncoder.encode("01011990a@")).thenReturn("HASH_01011990a@");

        BulkResetPasswordResponse response = passwordResetService.resetAllPasswordsToDateOfBirth();

        assertNotNull(response);
        assertEquals(3, response.getResetCount());
        assertEquals(1, response.getSkippedCount());
        assertEquals(1, response.getSkippedUsers().size());
        assertEquals("daotao_nodob", response.getSkippedUsers().get(0).getUsername());
        assertTrue(response.getSkippedUsers().get(0).getReason().contains("ACADEMIC_AFFAIRS"));

        // Verify passwords updated
        assertEquals("HASH_15032002a@", studentUser.getPassword());
        assertEquals("HASH_05111980a@", lecturerUser.getPassword());
        assertEquals("HASH_01011990a@", adminUser.getPassword());

        // Verify DOB synced to User entity
        assertEquals(LocalDate.of(2002, 3, 15), studentUser.getDateOfBirth());
        assertEquals(LocalDate.of(1980, 11, 5), lecturerUser.getDateOfBirth());

        verify(passwordEncoder).encode("15032002a@");
        verify(passwordEncoder).encode("05111980a@");
        verify(passwordEncoder).encode("01011990a@");
        verify(userRepository).save(studentUser);
        verify(userRepository).save(lecturerUser);
        verify(userRepository).save(adminUser);
        verify(userRepository, never()).save(staffUser);
    }

    @Test
    void resetAllPasswordsToDateOfBirth_allSkippedWhenStudentHasNullDob() {
        Role studentRole = new Role();
        studentRole.setName("STUDENT");
        User studentUser = new User();
        studentUser.setId(104L);
        studentUser.setUsername("sv_nodob");
        studentUser.setRole(studentRole);

        Student studentProfile = new Student();
        studentProfile.setId(204L);
        studentProfile.setUser(studentUser);
        studentProfile.setDateOfBirth(null); // null DOB

        when(userRepository.findAll()).thenReturn(List.of(studentUser));
        when(studentRepository.findByUserId(104L)).thenReturn(Optional.of(studentProfile));

        BulkResetPasswordResponse response = passwordResetService.resetAllPasswordsToDateOfBirth();

        assertNotNull(response);
        assertEquals(0, response.getResetCount());
        assertEquals(1, response.getSkippedCount());
        assertEquals("sv_nodob", response.getSkippedUsers().get(0).getUsername());
        verify(userRepository, never()).save(studentUser);
        verify(passwordEncoder, never()).encode(anyString());
    }
}
