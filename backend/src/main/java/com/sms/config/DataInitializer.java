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

    private void initAcademicAffairsUser() {
        if (!userRepository.existsByUsername("daotao")) {
            Role role = roleRepository.findByName("ACADEMIC_AFFAIRS")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("ACADEMIC_AFFAIRS");
                        return roleRepository.save(r);
                    });

            User user = new User();
            user.setUsername("daotao");
            // Mật khẩu tuân thủ chuẩn an toàn quốc tế (chữ hoa, chữ thường, số, ký tự đặc biệt, độ dài >= 12)
            user.setPassword(passwordEncoder.encode("Daotao@2026!"));
            user.setEmail("daotao@sms.edu.vn");
            user.setRole(role);
            user.setIsActive(true);
            user.setMustChangePassword(false);

            userRepository.save(user);
            log.info("Khởi tạo tài khoản Cán bộ Đào tạo mẫu 'daotao' thành công (Password: Daotao@2026!)");
        }
    }

    private void initExaminationOfficerUser() {
        if (!userRepository.existsByUsername("khaothi")) {
            Role role = roleRepository.findByName("EXAMINATION_OFFICER")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("EXAMINATION_OFFICER");
                        return roleRepository.save(r);
                    });

            User user = new User();
            user.setUsername("khaothi");
            user.setPassword(passwordEncoder.encode("Khaothi@2026!"));
            user.setEmail("khaothi@sms.edu.vn");
            user.setRole(role);
            user.setIsActive(true);
            user.setMustChangePassword(false);

            userRepository.save(user);
            log.info("Khởi tạo tài khoản Cán bộ Khảo thí mẫu 'khaothi' thành công (Password: Khaothi@2026!)");
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
