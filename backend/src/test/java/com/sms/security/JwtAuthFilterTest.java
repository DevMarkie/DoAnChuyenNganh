package com.sms.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock private JwtUtil jwtUtil;
    @Mock private UserDetailsServiceImpl userDetailsService;
    @InjectMocks private JwtAuthFilter filter;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void stubUser(boolean mustChange) {
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("sv001");
        when(jwtUtil.getValidatedClaims("tok")).thenReturn(claims);
        when(userDetailsService.loadUserByUsername("sv001")).thenReturn(new UserPrincipal(
                1L, "sv001", "pw", "e@e", "STUDENT", true, mustChange,
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    private MockHttpServletRequest req(String path) {
        MockHttpServletRequest r = new MockHttpServletRequest("GET", path);
        r.setServletPath(path);
        r.addHeader("Authorization", "Bearer tok");
        return r;
    }

    @Test
    void mustChangePassword_blocksNormalEndpoint() throws Exception {
        stubUser(true);
        MockHttpServletResponse resp = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(req("/api/students"), resp, chain);

        assertEquals(403, resp.getStatus());
        assertNull(chain.getRequest(), "request phải bị chặn, không đi tiếp");
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void mustChangePassword_allowsChangePassword() throws Exception {
        stubUser(true);
        MockHttpServletResponse resp = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(req("/api/auth/change-password"), resp, chain);

        assertEquals(200, resp.getStatus());
        assertNotNull(chain.getRequest(), "đổi mật khẩu phải được cho qua");
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void normalUser_passesThrough() throws Exception {
        stubUser(false);
        MockHttpServletResponse resp = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(req("/api/students"), resp, chain);

        assertNotNull(chain.getRequest());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
