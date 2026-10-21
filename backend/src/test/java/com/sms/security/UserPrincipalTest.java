package com.sms.security;

import com.sms.entity.Role;
import com.sms.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserPrincipalTest {

    @Test
    @DisplayName("Tạo UserPrincipal từ User hợp lệ ánh xạ chính xác thông tin và authorities")
    void create_MapsRolesAndFlagsCorrectly() {
        Role role = new Role();
        role.setName("STUDENT");

        User user = new User();
        user.setId(10L);
        user.setUsername("2500001");
        user.setPassword("hashedPass");
        user.setEmail("sv@sms.edu.vn");
        user.setRole(role);
        user.setIsActive(true);
        user.setMustChangePassword(false);

        UserPrincipal principal = UserPrincipal.create(user);

        assertEquals(10L, principal.getId());
        assertEquals("2500001", principal.getUsername());
        assertEquals("hashedPass", principal.getPassword());
        assertEquals("sv@sms.edu.vn", principal.getEmail());
        assertEquals("STUDENT", principal.getRole());
        assertTrue(principal.isActive());
        assertFalse(principal.isMustChangePassword());
        assertTrue(principal.isAccountNonExpired());
        assertTrue(principal.isAccountNonLocked());
        assertTrue(principal.isCredentialsNonExpired());
        assertTrue(principal.isEnabled());
        assertEquals(1, principal.getAuthorities().size());
        assertEquals("ROLE_STUDENT", principal.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    @DisplayName("Tài khoản inactive trả về isAccountNonLocked = false và isEnabled = false")
    void inactiveUser_ReturnsLockedAndDisabled() {
        Role role = new Role();
        role.setName("LECTURER");

        User user = new User();
        user.setId(20L);
        user.setUsername("1000001");
        user.setRole(role);
        user.setIsActive(false);

        UserPrincipal principal = UserPrincipal.create(user);

        assertFalse(principal.isAccountNonLocked());
        assertFalse(principal.isEnabled());
        assertEquals("ROLE_LECTURER", principal.getAuthorities().iterator().next().getAuthority());
    }
}
