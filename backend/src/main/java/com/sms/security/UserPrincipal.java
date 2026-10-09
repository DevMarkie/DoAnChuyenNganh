package com.sms.security;

import com.sms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private Long id;
    private String username;
    private String password;
    private String email;
    private String role;
    private boolean active;
    private boolean mustChangePassword;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().getName())
        );

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getEmail(),
                user.getRole().getName(),
                user.getIsActive(),
                Boolean.TRUE.equals(user.getMustChangePassword()),
                authorities
        );
    }

    public static UserPrincipal createFromClaims(io.jsonwebtoken.Claims claims) {
        String role = claims.get("role", String.class);
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
        return new UserPrincipal(
                claims.get("userId", Long.class),
                claims.getSubject(),
                null,
                claims.get("email", String.class),
                role,
                true, // Giả định token còn hạn thì active
                false, // Không có thông tin này trong JWT
                authorities
        );
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return active; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}
