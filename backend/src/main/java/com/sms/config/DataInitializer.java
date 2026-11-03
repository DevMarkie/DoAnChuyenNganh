package com.sms.config;

import com.sms.entity.Role;
import com.sms.entity.User;
import com.sms.repository.RoleRepository;
import com.sms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.sms.repository.SystemConfigRepository systemConfigRepository;

    @Override
    public void run(String... args) {
        initRoles();
        initAdminUser();
        initAcademicAffairsUser();
        initExaminationOfficerUser();
        initSystemConfigs();
    }

    private void initRoles() {
        String[] requiredRoles = {"ADMIN", "LECTURER", "STUDENT", "ACADEMIC_AFFAIRS", "EXAMINATION_OFFICER"};
        for (String roleName : requiredRoles) {
            roleRepository.findByName(roleName).orElseGet(() -> {
                Role role = new Role();
                role.setName(roleName);
                log.info("Khởi tạo vai trò mới trong hệ thống: {}", roleName);
                return roleRepository.save(role);
            });
        }
    }

    private void initAdminUser() {
        userRepository.findByUsername("admin").ifPresent(admin -> {
            boolean changed = false;
            if (admin.getDateOfBirth() == null) {
                admin.setDateOfBirth(LocalDate.of(1990, 1, 1));
                changed = true;
            }
            if (admin.getFullName() == null) {
                admin.setFullName("Quản trị viên hệ thống");
                changed = true;
            }
            if (changed) {
                userRepository.save(admin);
                log.info("Cập nhật thông tin cho tài khoản 'admin': DOB=1990-01-01, fullName=Quản trị viên hệ thống");
            }
        });
    }

    private void initAcademicAffairsUser() {
        User user = userRepository.findByUsername("daotao").orElse(null);
        if (user == null) {
            Role role = roleRepository.findByName("ACADEMIC_AFFAIRS")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("ACADEMIC_AFFAIRS");
                        return roleRepository.save(r);
                    });

            user = new User();
            user.setUsername("daotao");
            user.setFullName("Nguyễn Văn Đào (Phòng Đào tạo)");
            user.setPassword(passwordEncoder.encode("15051985a@"));
            user.setEmail("daotao@sms.edu.vn");
            user.setRole(role);
            user.setDateOfBirth(LocalDate.of(1985, 5, 15));
            user.setIsActive(true);
            user.setMustChangePassword(false);

            userRepository.save(user);
            log.info("Khởi tạo tài khoản Cán bộ Đào tạo mẫu 'daotao' thành công (DOB: 1985-05-15, Password: 15051985a@)");
        } else {
            boolean changed = false;
            if (user.getDateOfBirth() == null) {
                user.setDateOfBirth(LocalDate.of(1985, 5, 15));
                changed = true;
            }
            if (user.getFullName() == null) {
                user.setFullName("Nguyễn Văn Đào (Phòng Đào tạo)");
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
                log.info("Cập nhật thông tin cho tài khoản 'daotao': DOB=1985-05-15, fullName=Nguyễn Văn Đào");
            }
        }

        // Tạo thêm chuyên viên Đào tạo mẫu: daotao01 (DOB: 1994-08-15 -> password 15081994a@)
        if (!userRepository.existsByUsername("daotao01")) {
            Role role = roleRepository.findByName("ACADEMIC_AFFAIRS").orElse(null);
            if (role != null) {
                User staff = new User();
                staff.setUsername("daotao01");
                staff.setFullName("Lê Thị Thanh (Chuyên viên Đào tạo)");
                staff.setDateOfBirth(LocalDate.of(1994, 8, 15));
                staff.setPassword(passwordEncoder.encode("15081994a@"));
                staff.setEmail("daotao01@sms.edu.vn");
                staff.setRole(role);
                staff.setIsActive(true);
                staff.setMustChangePassword(false);
                userRepository.save(staff);
                log.info("Khởi tạo nhân viên Đào tạo mẫu 'daotao01' thành công (DOB: 1994-08-15, Password: 15081994a@)");
            }
        }
    }

    private void initExaminationOfficerUser() {
        User user = userRepository.findByUsername("khaothi").orElse(null);
        if (user == null) {
            Role role = roleRepository.findByName("EXAMINATION_OFFICER")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("EXAMINATION_OFFICER");
                        return roleRepository.save(r);
                    });

            user = new User();
            user.setUsername("khaothi");
            user.setFullName("Trần Thị Khảo (Phòng Khảo thí & ĐBCL)");
            user.setPassword(passwordEncoder.encode("20101988a@"));
            user.setEmail("khaothi@sms.edu.vn");
            user.setRole(role);
            user.setDateOfBirth(LocalDate.of(1988, 10, 20));
            user.setIsActive(true);
            user.setMustChangePassword(false);

            userRepository.save(user);
            log.info("Khởi tạo tài khoản Cán bộ Khảo thí mẫu 'khaothi' thành công (DOB: 1988-10-20, Password: 20101988a@)");
        } else {
            boolean changed = false;
            if (user.getDateOfBirth() == null) {
                user.setDateOfBirth(LocalDate.of(1988, 10, 20));
                changed = true;
            }
            if (user.getFullName() == null) {
                user.setFullName("Trần Thị Khảo (Phòng Khảo thí & ĐBCL)");
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
                log.info("Cập nhật thông tin cho tài khoản 'khaothi': DOB=1988-10-20, fullName=Trần Thị Khảo");
            }
        }
    }

    private void initSystemConfigs() {
        if (!systemConfigRepository.existsByConfigKey("cpa_deduplication_strategy")) {
            com.sms.entity.SystemConfig config = com.sms.entity.SystemConfig.builder()
                    .configKey("cpa_deduplication_strategy")
                    .configValue("HIGHEST_SCORE")
                    .description("Quy tắc tính CPA khi học lại môn: HIGHEST_SCORE (lấy điểm cao nhất) hoặc LATEST_ATTEMPT (lấy lần thi gần nhất)")
                    .build();
            systemConfigRepository.save(config);
            log.info("Khởi tạo cấu hình hệ thống 'cpa_deduplication_strategy' = HIGHEST_SCORE");
        }
    }
}
