package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.BulkResetPasswordRequest;
import com.sms.dto.request.CreateStaffRequest;
import com.sms.dto.response.BulkResetPasswordResponse;
import com.sms.dto.response.StaffResponse;
import com.sms.entity.Role;
import com.sms.entity.User;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.RoleRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.AuditLogService;
import com.sms.service.DatabaseBackupService;
import com.sms.service.PasswordResetService;
import com.sms.service.SystemConfigService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminSystemControllerTest {

    @Mock
    private SystemConfigService systemConfigService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private DatabaseBackupService backupService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private PasswordResetService passwordResetService;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminSystemController adminSystemController;

    private UserPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = new UserPrincipal(
                1L,
                "admin",
                "password",
                "admin@sms.edu.vn",
                "ADMIN",
                true,
                false,
                Collections.emptyList()
        );
    }

    @Test
    void bulkResetPasswords_Success() {
        BulkResetPasswordRequest request = new BulkResetPasswordRequest();
        request.setConfirm(true);

        BulkResetPasswordResponse mockResponse = BulkResetPasswordResponse.builder()
                .resetCount(10)
                .skippedCount(1)
                .skippedUsers(List.of(
                        BulkResetPasswordResponse.SkippedUser.builder()
                                .username("admin")
                                .reason("Không tìm thấy ngày sinh")
                                .build()
                ))
                .message("Đã reset mật khẩu thành công 10 tài khoản. Bỏ qua 1 tài khoản do thiếu ngày sinh.")
                .build();

        when(passwordResetService.resetAllPasswordsToDateOfBirth()).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<BulkResetPasswordResponse>> responseEntity =
                adminSystemController.bulkResetPasswords(request, adminPrincipal);

        assertNotNull(responseEntity);
        assertEquals(200, responseEntity.getStatusCode().value());
        ApiResponse<BulkResetPasswordResponse> body = responseEntity.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(10, body.getData().getResetCount());
        assertEquals(1, body.getData().getSkippedCount());

        verify(passwordResetService, times(1)).resetAllPasswordsToDateOfBirth();
        verify(auditLogService, times(1)).record(
                isNull(),
                eq("admin"),
                eq("ADMIN"),
                eq("BULK_RESET_PASSWORD"),
                eq("USER"),
                isNull(),
                contains("10 reset, 1 skipped")
        );
    }

    @Test
    void getAllStaffs_ReturnsOnlyStaffRoles() {
        Role adminRole = new Role(1, "ADMIN");
        Role staffRole = new Role(2, "ACADEMIC_AFFAIRS");
        Role studentRole = new Role(3, "STUDENT");

        User u1 = new User();
        u1.setId(1L);
        u1.setUsername("admin");
        u1.setRole(adminRole);

        User u2 = new User();
        u2.setId(2L);
        u2.setUsername("daotao");
        u2.setRole(staffRole);

        User u3 = new User();
        u3.setId(3L);
        u3.setUsername("sv001");
        u3.setRole(studentRole);

        when(userRepository.findAll()).thenReturn(List.of(u1, u2, u3));

        ResponseEntity<ApiResponse<List<StaffResponse>>> res = adminSystemController.getAllStaffs();

        assertNotNull(res.getBody());
        assertEquals(2, res.getBody().getData().size());
        assertEquals("admin", res.getBody().getData().get(0).getUsername());
        assertEquals("daotao", res.getBody().getData().get(1).getUsername());
    }

    @Test
    void createStaff_Success_GeneratesPasswordFromDob() {
        CreateStaffRequest req = new CreateStaffRequest();
        req.setUsername("daotao_new");
        req.setFullName("Nguyen Van B");
        req.setEmail("daotao_new@sms.edu.vn");
        req.setRoleName("ACADEMIC_AFFAIRS");
        req.setDateOfBirth(LocalDate.of(1992, 5, 15));

        Role role = new Role(2, "ACADEMIC_AFFAIRS");
        when(userRepository.existsByUsername("daotao_new")).thenReturn(false);
        when(userRepository.existsByEmail("daotao_new@sms.edu.vn")).thenReturn(false);
        when(roleRepository.findByName("ACADEMIC_AFFAIRS")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("15051992a@")).thenReturn("ENCODED_15051992a@");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(50L);
            return u;
        });

        ResponseEntity<ApiResponse<StaffResponse>> res = adminSystemController.createStaff(req, adminPrincipal);

        assertNotNull(res.getBody());
        assertTrue(res.getBody().isSuccess());
        assertEquals("daotao_new", res.getBody().getData().getUsername());
        assertEquals("Nguyen Van B", res.getBody().getData().getFullName());
        assertEquals(LocalDate.of(1992, 5, 15), res.getBody().getData().getDateOfBirth());
        assertTrue(res.getBody().getMessage().contains("15051992a@"));

        verify(passwordEncoder).encode("15051992a@");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void resetStaffPassword_Success() {
        Role role = new Role(2, "ACADEMIC_AFFAIRS");
        User staff = new User();
        staff.setId(99L);
        staff.setUsername("daotao_test");
        staff.setRole(role);
        staff.setDateOfBirth(LocalDate.of(1988, 11, 20));

        when(userRepository.findById(99L)).thenReturn(Optional.of(staff));
        when(passwordEncoder.encode("20111988a@")).thenReturn("ENCODED_20111988a@");

        ResponseEntity<ApiResponse<Map<String, String>>> res =
                adminSystemController.resetStaffPassword(99L, adminPrincipal);

        assertNotNull(res.getBody());
        assertTrue(res.getBody().isSuccess());
        assertEquals("20111988a@", res.getBody().getData().get("newPassword"));
        assertEquals("ENCODED_20111988a@", staff.getPassword());
        verify(userRepository).save(staff);
    }
}
