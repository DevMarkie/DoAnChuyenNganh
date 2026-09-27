package com.sms;

import com.sms.dto.request.ForgotPasswordRequest;
import com.sms.dto.response.PasswordResetResult;
import com.sms.entity.PasswordResetRequest;
import com.sms.entity.PasswordResetRequest.RequestStatus;
import com.sms.entity.Role;
import com.sms.entity.Student;
import com.sms.entity.User;
import com.sms.repository.LecturerRepository;
import com.sms.repository.PasswordResetRequestRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import com.sms.service.EmailService;
import com.sms.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests locking in the two "forgot password" security fixes:
 *  - M2 (account takeover): the reset email must go to the account's ON-FILE
 *    address, never the requester-supplied email stored on the request;
 *  - M3 (user enumeration): createRequest must not throw a distinct error that
 *    reveals whether an identifier maps to a real / eligible / pending account.
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private PasswordResetRequestRepository resetRepository;
    @Mock private UserRepository userRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @InjectMocks private PasswordResetService service;

    private static User studentUser(long id, String onFileEmail) {
        Role role = new Role();
        role.setName("STUDENT");
        User u = new User();
        u.setId(id);
        u.setUsername("2500001");
        u.setEmail(onFileEmail);
        u.setRole(role);
        return u;
    }

    @Test
    void approve_sendsToOnFileEmail_notRequesterSuppliedAddress() {
        User target = studentUser(10L, "account.email@school.edu.vn");

        PasswordResetRequest req = PasswordResetRequest.builder()
                .id(1L)
                .user(target)
                .username(target.getUsername())
                .fullName("Nguyen Van A")
                .role("STUDENT")
                .email("attacker@evil.com")   // requester-supplied — must be ignored
                .status(RequestStatus.PENDING)
                .build();

        Student profile = new Student();
        profile.setId(99L);
        profile.setEmail("profile.email@school.edu.vn");   // authoritative on-file email

        when(resetRepository.findById(1L)).thenReturn(Optional.of(req));
        when(userRepository.findById(500L)).thenReturn(Optional.of(new User()));
        when(studentRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(passwordEncoder.encode(anyString())).thenReturn("ENCODED");
        when(resetRepository.save(any(PasswordResetRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(emailService.sendPasswordResetEmail(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        PasswordResetResult result = service.approveRequest(1L, null, 500L);

        ArgumentCaptor<String> to = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(to.capture(), anyString(), anyString(), anyString(), anyString());

        // The email goes to the profile's on-file address, never the attacker's.
        assertThat(to.getValue()).isEqualTo("profile.email@school.edu.vn");
        assertThat(to.getValue()).isNotEqualTo("attacker@evil.com");

        // Password rotated + forced change on next login.
        verify(passwordEncoder).encode(anyString());
        assertThat(target.getPassword()).isEqualTo("ENCODED");
        assertThat(target.getMustChangePassword()).isTrue();

        // Success message must not echo the raw account email or the new password.
        assertThat(result.isEmailSent()).isTrue();
        assertThat(result.getMessage()).doesNotContain("profile.email@school.edu.vn");
        assertThat(result.getMessage()).doesNotContain(result.getGeneratedPassword());
    }

    @Test
    void approve_fallsBackToUserEmail_whenNoProfileEmail() {
        User target = studentUser(11L, "user.account@school.edu.vn");
        PasswordResetRequest req = PasswordResetRequest.builder()
                .id(2L).user(target).username(target.getUsername())
                .fullName("Tran Thi B").role("STUDENT")
                .email("someone@else.com").status(RequestStatus.PENDING)
                .build();

        when(resetRepository.findById(2L)).thenReturn(Optional.of(req));
        when(userRepository.findById(500L)).thenReturn(Optional.of(new User()));
        when(studentRepository.findByUserId(11L)).thenReturn(Optional.empty()); // no profile email
        when(passwordEncoder.encode(anyString())).thenReturn("ENCODED");
        when(resetRepository.save(any(PasswordResetRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(emailService.sendPasswordResetEmail(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        service.approveRequest(2L, null, 500L);

        verify(emailService).sendPasswordResetEmail(eq("user.account@school.edu.vn"),
                anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void createRequest_unknownIdentifier_returnsNullWithoutThrowingOrSaving() {
        ForgotPasswordRequest fr = new ForgotPasswordRequest();
        fr.setUsername("ghost-user");
        fr.setEmail("ghost@nowhere.com");

        when(userRepository.findByUsername("ghost-user")).thenReturn(Optional.empty());
        when(studentRepository.findByStudentCode("ghost-user")).thenReturn(Optional.empty());
        when(lecturerRepository.findByLecturerCode("ghost-user")).thenReturn(Optional.empty());

        PasswordResetRequest saved = service.createRequest(fr);

        assertThat(saved).isNull();
        verify(resetRepository, never()).save(any());
    }

    @Test
    void createRequest_pendingAlreadyExists_returnsNullWithoutSaving() {
        User target = studentUser(12L, "s@school.edu.vn");
        ForgotPasswordRequest fr = new ForgotPasswordRequest();
        fr.setUsername("2500001");
        fr.setEmail("s@school.edu.vn");

        when(userRepository.findByUsername("2500001")).thenReturn(Optional.of(target));
        when(resetRepository.existsByUserIdAndStatus(12L, RequestStatus.PENDING)).thenReturn(true);

        PasswordResetRequest saved = service.createRequest(fr);

        assertThat(saved).isNull();
        verify(resetRepository, never()).save(any());
    }
}
