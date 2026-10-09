package com.sms.service;

import com.sms.dto.request.ApproveResetRequest;
import com.sms.dto.request.ForgotPasswordRequest;
import com.sms.dto.request.RejectResetRequest;
import com.sms.dto.response.PasswordResetResult;
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
        when(resetRepository.save(any(PasswordResetRequest.class))).thenReturn(resetRequest);

        PasswordResetRequest result = passwordResetService.createRequest(request);

        assertNotNull(result);
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

        User user = new User();
        user.setId(12L);
        user.setUsername("user1");

        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(resetRepository.existsByUserIdAndStatus(
                12L, PasswordResetRequest.RequestStatus.PENDING))
                .thenReturn(true);

        PasswordResetRequest req = passwordResetService.createRequest(fr);
        assertNull(req);
        verify(resetRepository, never()).save(any());
    }
}
