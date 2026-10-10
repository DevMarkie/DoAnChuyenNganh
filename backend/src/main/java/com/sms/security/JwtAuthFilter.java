package com.sms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    /** Public endpoints that don't need JWT token parsing at all */
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/swagger-ui/**",
            "/api-docs/**",
            "/swagger-ui.html"
    );

    /** Khi tài khoản còn cờ "phải đổi mật khẩu mặc định", chỉ các path này được phép. */
    private static final List<String> MUST_CHANGE_ALLOWED = List.of(
            "/api/auth/change-password",
            "/api/auth/logout"
    );

    private static final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Skip JWT filter entirely for public endpoints — saves unnecessary
     * token parsing and UserDetailsService lookup on every unauthenticated request.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return PUBLIC_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token)) {
            io.jsonwebtoken.Claims claims = jwtUtil.getValidatedClaims(token);
            if (claims != null) {
                // Nạp lại user từ DB mỗi request (không tin role/active trong claim):
                // tài khoản bị khoá/giáng cấp mất quyền NGAY, không phải chờ token hết hạn.
                try {
                    UserDetails userPrincipal = userDetailsService.loadUserByUsername(claims.getSubject());
                    if (userPrincipal.isEnabled()) {
                        // Tài khoản còn cờ "phải đổi mật khẩu mặc định": chỉ cho đổi mật khẩu/đăng xuất.
                        // Trước đây chỉ frontend chặn → gọi thẳng API bằng mật khẩu mặc định vẫn vào được.
                        if (((UserPrincipal) userPrincipal).isMustChangePassword()
                                && !MUST_CHANGE_ALLOWED.contains(request.getServletPath())) {
                            // Trả JSON ApiResponse như mọi lỗi khác (frontend đọc data.message),
                            // không dùng sendError (ra trang lỗi HTML của container).
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            MAPPER.writeValue(response.getWriter(),
                                    ApiResponse.error("Bạn phải đổi mật khẩu mặc định trước khi sử dụng hệ thống"));
                            return;
                        }
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                    // Tài khoản đã bị xoá — để request đi tiếp ở trạng thái chưa xác thực.
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
