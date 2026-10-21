package com.sms.service;

import com.sms.dto.request.ChangePasswordRequest;
import com.sms.dto.request.LoginRequest;
import com.sms.dto.response.LoginResponse;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.UserRepository;
import com.sms.security.JwtUtil;
import com.sms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private LoginAttemptService loginAttemptService;

    @InjectMocks
    private AuthService authService;

    private LoginRequest loginRequest;
    private UserPrincipal userPrincipal;
    private User user;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        com.sms.entity.Role role = new com.sms.entity.Role();
        role.setName("ADMIN");
        
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("encodedPassword");
        user.setEmail("test@mail.com");
        user.setRole(role);
        user.setIsActive(true);
        user.setMustChangePassword(false);
        
        userPrincipal = UserPrincipal.create(user);
    }

    @Test
    void login_Success() {
        // Arrange
        when(loginAttemptService.getSecondsUntilUnlocked("testuser")).thenReturn(0L);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userPrincipal);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);

        when(jwtUtil.generateToken(userPrincipal)).thenReturn("mocked.jwt.token");

        // Act
        LoginResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.getToken());
        assertEquals("testuser", response.getUsername());
        verify(loginAttemptService).loginSucceeded("testuser");
    }

    @Test
    void login_LockedAccount() {
        // Arrange
        when(loginAttemptService.getSecondsUntilUnlocked("testuser")).thenReturn(120L); // 2 minutes left

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
        assertTrue(exception.getMessage().contains("2 phút"));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void login_BadCredentials() {
        // Arrange
        when(loginAttemptService.getSecondsUntilUnlocked("testuser")).thenReturn(0L);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // Act & Assert
        assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
        verify(loginAttemptService).loginFailed("testuser");
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    void changePassword_Success() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPassword");
        request.setNewPassword("newPassword123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");

        // Act
        authService.changePassword(1L, request);

        // Assert
        assertEquals("newEncodedPassword", user.getPassword());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_UserNotFound() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> authService.changePassword(999L, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_WrongOldPassword() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongOldPassword");
        request.setNewPassword("newPassword123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongOldPassword", "encodedPassword")).thenReturn(false);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> authService.changePassword(1L, request));
        verify(userRepository, never()).save(any());
    }
}
