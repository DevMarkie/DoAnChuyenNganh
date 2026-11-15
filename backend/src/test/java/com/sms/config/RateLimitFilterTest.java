package com.sms.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter();
        filterChain = mock(FilterChain.class);
    }

    @Test
    void shouldFilter_ForgotPasswordSendOtp_EnforcesRateLimit() throws ServletException, IOException {
        String clientIp = "192.168.1.50";

        // Up to 5 requests should be allowed
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/forgot-password/send-otp");
            request.setServletPath("/api/auth/forgot-password/send-otp");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();

            rateLimitFilter.doFilter(request, response, filterChain);
            assertEquals(HttpStatus.OK.value(), response.getStatus());
        }

        // 6th request from same IP should be blocked with 429 Too Many Requests
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/auth/forgot-password/send-otp");
        blockedRequest.setServletPath("/api/auth/forgot-password/send-otp");
        blockedRequest.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        rateLimitFilter.doFilter(blockedRequest, blockedResponse, filterChain);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blockedResponse.getStatus());
        assertTrue(blockedResponse.getContentAsString().contains("Bạn gửi yêu cầu quá thường xuyên"));
    }

    @Test
    void shouldFilter_ForgotPasswordVerifyOtp_EnforcesRateLimit() throws ServletException, IOException {
        String clientIp = "192.168.1.60";

        // Up to 5 requests allowed
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/forgot-password/verify-otp");
            request.setServletPath("/api/auth/forgot-password/verify-otp");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();

            rateLimitFilter.doFilter(request, response, filterChain);
            assertEquals(HttpStatus.OK.value(), response.getStatus());
        }

        // 6th request blocked with 429
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/auth/forgot-password/verify-otp");
        blockedRequest.setServletPath("/api/auth/forgot-password/verify-otp");
        blockedRequest.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        rateLimitFilter.doFilter(blockedRequest, blockedResponse, filterChain);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blockedResponse.getStatus());
    }

    @Test
    void nonRateLimitedEndpoint_PassesThroughWithoutLimit() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/info");
        request.setServletPath("/api/public/info");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilter(request, response, filterChain);
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
