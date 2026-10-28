package com.sms.config;

import com.sms.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                // HSTS: ép browser dùng HTTPS cho domain API (emit cả sau Cloudflare tunnel HTTP).
                .httpStrictTransportSecurity(hsts -> hsts
                        .requestMatcher(org.springframework.security.web.util.matcher.AnyRequestMatcher.INSTANCE)
                        .maxAgeInSeconds(31536000))
                .referrerPolicy(referrer -> referrer
                        .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/api-docs", "/v3/api-docs/**", "/v3/api-docs", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/uploads/**").permitAll()

                // Grade Audit Logs (Admin, Cán bộ Đào tạo, Khảo thí tra cứu kiểm toán điểm)
                .requestMatchers("/api/admin/grade-audit-logs/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF", "EXAMINATION_OFFICER")

                // Admin only (Kỹ thuật hệ thống, cấu hình, audit log, sao lưu CSDL)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Graduation Assessment Algorithm (Cán bộ Đào tạo thực thi & xuất quyết định, ADMIN Không)
                .requestMatchers("/api/graduation/**").hasAnyRole("ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")

                // Academic Staff & Admin (Quản trị Đào tạo, CTĐT, Khoa, Môn học, Lớp SH)
                .requestMatchers("/api/staff/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/students/me/contact").hasRole("STUDENT")
                .requestMatchers(HttpMethod.POST, "/api/students/**").hasAnyRole("ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/students/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.POST, "/api/departments/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/departments/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/departments/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.POST, "/api/classes/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/classes/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.POST, "/api/subjects/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/subjects/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.POST, "/api/lecturers/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/lecturers/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.POST, "/api/semesters/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/semesters/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")

                // Mở lớp học phần & Phân công (Cán bộ Đào tạo & Quản trị viên)
                .requestMatchers(HttpMethod.POST, "/api/course-sections/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/course-sections/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.POST, "/api/schedules/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/schedules/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/schedules/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")

                // Lecturer & Attendance
                .requestMatchers("/api/lecturer/**").hasRole("LECTURER")

                // Exam sessions & rooms (Khảo thí, Admin, Cán bộ đào tạo, Giảng viên)
                .requestMatchers("/api/exam-sessions/**", "/api/exam-rooms/**").hasAnyRole("ADMIN", "EXAMINATION_OFFICER", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF", "LECTURER")

                // Enrollment overrides & actions
                .requestMatchers(HttpMethod.POST, "/api/enrollments/override").hasAnyRole("ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/enrollments/*/override").hasAnyRole("ACADEMIC_AFFAIRS", "ACADEMIC_STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/enrollments/*/status").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/enrollments/**").hasRole("STUDENT")
                .requestMatchers(HttpMethod.DELETE, "/api/enrollments/**").hasRole("STUDENT")
                .requestMatchers("/api/student/**").hasRole("STUDENT")
                .requestMatchers("/api/notifications/**").authenticated()

                // Grade entry & submission — admin (kiểm toán) + academic staff (mở/khóa) + lecturer (nhập điểm)
                .requestMatchers(HttpMethod.PUT, "/api/grades/**").hasAnyRole("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF", "LECTURER")

                // Read access — authenticated users
                .requestMatchers(HttpMethod.GET, "/api/**").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            // Rate limiting uses the authenticated principal, so it must run after JWT auth.
            .addFilterAfter(rateLimitFilter, JwtAuthFilter.class);

        return http.build();
    }

    /**
     * RateLimitFilter is managed by Spring Security only. Without disabling the
     * servlet registration, Spring Boot would also run it before the security
     * chain, where SecurityContext is still empty.
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Restrict to known origin patterns. CORS credentials bị tắt (JWT ở header),
        // nên dù pattern có wildcard thì cũng không lộ phiên theo cookie.
        List<String> origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count"));
        // JWT đi trong header Authorization (không dùng cookie), nên không cần CORS credentials.
        // Tắt để loại bỏ rủi ro origin-pattern mở (*.trycloudflare.com) + credentials.
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);
        return new UrlBasedCorsConfigurationSource() {{
            registerCorsConfiguration("/**", config);
        }};
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
