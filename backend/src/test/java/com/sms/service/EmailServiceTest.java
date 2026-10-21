package com.sms.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@sms.edu.vn");
    }

    @Test
    void sendPasswordResetEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        
        boolean result = emailService.sendPasswordResetEmail("test@example.com", "Nguyen Van A", "user1", "newPass", "STUDENT");
        
        assertTrue(result);
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendPasswordResetEmail_MailSenderNull() {
        ReflectionTestUtils.setField(emailService, "mailSender", null);
        
        boolean result = emailService.sendPasswordResetEmail("test@example.com", "Nguyen Van A", "user1", "newPass", "STUDENT");
        
        assertFalse(result);
    }

    @Test
    void sendPasswordResetEmail_Exception() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("Mail error"));
        
        boolean result = emailService.sendPasswordResetEmail("test@example.com", "Nguyen Van A", "user1", "newPass", "STUDENT");
        
        assertFalse(result);
    }

    @Test
    void sendRejectionEmail_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        
        boolean result = emailService.sendRejectionEmail("test@example.com", "Nguyen Van A", "user1", "Reason");
        
        assertTrue(result);
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendRejectionEmail_MailSenderNull() {
        ReflectionTestUtils.setField(emailService, "mailSender", null);
        
        boolean result = emailService.sendRejectionEmail("test@example.com", "Nguyen Van A", "user1", "Reason");
        
        assertFalse(result);
    }

    @Test
    void sendRejectionEmail_Exception() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("Mail error"));
        
        boolean result = emailService.sendRejectionEmail("test@example.com", "Nguyen Van A", "user1", "Reason");
        
        assertFalse(result);
    }
}
