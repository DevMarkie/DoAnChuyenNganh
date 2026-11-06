package com.sms.config;

import com.sms.entity.Role;
import com.sms.entity.User;
import com.sms.repository.RoleRepository;
import com.sms.repository.UserRepository;
import com.sms.repository.DepartmentRepository;
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
    private final DepartmentRepository departmentRepository;
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
        String[] requiredRoles = {"ADMIN", "LECTURER", "STUDENT", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF", "EXAMINATION_OFFICER"};
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
            if (admin.getFullName() == null || "Quản trị viên hệ thống".equals(admin.getFullName())) {
                admin.setFullName("Nguyễn Hoàng Long");
                changed = true;
            }
            if (changed) {
                userRepository.save(admin);
                log.info("Cập nhật thông tin cho tài khoản 'admin': DOB=1990-01-01, fullName=Nguyễn Hoàng Long");
            }
        });

        // Khởi tạo Quản trị viên kỹ thuật: admin_tech (Lê Hoàng Nam, Password: 123456)
        User ad = userRepository.findByUsername("admin_tech")
                .or(() -> userRepository.findByUsername("AD001"))
                .orElse(null);
        if (ad == null) {
            Role role = roleRepository.findByName("ADMIN").orElse(null);
            if (role != null) {
                ad = new User();
                ad.setUsername("admin_tech");
                ad.setFullName("Lê Hoàng Nam");
                ad.setDateOfBirth(LocalDate.of(1990, 1, 1));
                ad.setPassword(passwordEncoder.encode("123456"));
                ad.setEmail("admin.tech@sms.edu.vn");
                ad.setRole(role);
                ad.setIsActive(true);
                ad.setMustChangePassword(false);
                userRepository.save(ad);
                log.info("Khởi tạo Quản trị viên kỹ thuật 'admin_tech' thành công (Password: 123456)");
            }
        } else {
            ad.setUsername("admin_tech");
            ad.setEmail("admin.tech@sms.edu.vn");
            ad.setFullName("Lê Hoàng Nam");
            userRepository.save(ad);
        }
    }

    private void initAcademicAffairsUser() {
        Role roleAffairs = roleRepository.findByName("ACADEMIC_AFFAIRS").orElseGet(() -> {
            Role r = new Role();
            r.setName("ACADEMIC_AFFAIRS");
            return roleRepository.save(r);
        });

        Role roleStaff = roleRepository.findByName("ACADEMIC_STAFF").orElseGet(() -> {
            Role r = new Role();
            r.setName("ACADEMIC_STAFF");
            return roleRepository.save(r);
        });

        // 1. Cán bộ Đào tạo cấp Trường: daotao (Nguyễn Văn Đào - Toàn trường)
        User user = userRepository.findByUsername("daotao").orElse(null);
        if (user == null) {
            user = new User();
            user.setUsername("daotao");
            user.setFullName("Nguyễn Văn Đào");
            user.setPassword(passwordEncoder.encode("15051985a@"));
            user.setEmail("daotao@sms.edu.vn");
            user.setRole(roleAffairs);
            user.setDepartment(null);
            user.setDateOfBirth(LocalDate.of(1985, 5, 15));
            user.setIsActive(true);
            user.setMustChangePassword(false);
            userRepository.save(user);
            log.info("Khởi tạo tài khoản Cán bộ Đào tạo cấp Trường 'daotao' (DOB: 1985-05-15, Password: 15051985a@)");
        } else {
            user.setFullName("Nguyễn Văn Đào");
            user.setRole(roleAffairs);
            user.setDepartment(null);
            userRepository.save(user);
        }

        // 2. Giáo vụ Khoa CNTT: giaovu_cntt (Lê Thị Thanh - Khoa CNTT ID=1)
        User daotao01 = userRepository.findByUsername("giaovu_cntt")
                .or(() -> userRepository.findByUsername("daotao01"))
                .orElse(null);
        if (daotao01 == null) {
            User staff = new User();
            staff.setUsername("giaovu_cntt");
            staff.setFullName("Lê Thị Thanh");
            staff.setDateOfBirth(LocalDate.of(1994, 8, 15));
            staff.setPassword(passwordEncoder.encode("15081994a@"));
            staff.setEmail("giaovu.cntt@sms.edu.vn");
            staff.setRole(roleStaff);
            departmentRepository.findById(1).ifPresent(staff::setDepartment);
            staff.setIsActive(true);
            staff.setMustChangePassword(false);
            userRepository.save(staff);
            log.info("Khởi tạo Giáo vụ Khoa CNTT 'giaovu_cntt' thành công (DOB: 1994-08-15, Password: 15081994a@)");
        } else {
            daotao01.setUsername("giaovu_cntt");
            daotao01.setEmail("giaovu.cntt@sms.edu.vn");
            daotao01.setFullName("Lê Thị Thanh");
            daotao01.setRole(roleStaff);
            departmentRepository.findById(1).ifPresent(daotao01::setDepartment);
            userRepository.save(daotao01);
        }

        // 3. Giáo vụ Khoa Kỹ thuật Ô tô: giaovu_oto (Phạm Thanh Tùng - Khoa KT_OTO ID=2)
        User nv = userRepository.findByUsername("giaovu_oto")
                .or(() -> userRepository.findByUsername("NV001"))
                .orElse(null);
        if (nv == null) {
            nv = new User();
            nv.setUsername("giaovu_oto");
            nv.setFullName("Phạm Thanh Tùng");
            nv.setDateOfBirth(LocalDate.of(1985, 5, 15));
            nv.setPassword(passwordEncoder.encode("123456"));
            nv.setEmail("giaovu.oto@sms.edu.vn");
            nv.setRole(roleStaff);
            departmentRepository.findById(2).ifPresent(nv::setDepartment);
            nv.setIsActive(true);
            nv.setMustChangePassword(false);
            userRepository.save(nv);
            log.info("Khởi tạo Giáo vụ Khoa KT Ô tô 'giaovu_oto' thành công (Password: 123456)");
        } else {
            nv.setUsername("giaovu_oto");
            nv.setEmail("giaovu.oto@sms.edu.vn");
            nv.setFullName("Phạm Thanh Tùng");
            nv.setRole(roleStaff);
            departmentRepository.findById(2).ifPresent(nv::setDepartment);
            userRepository.save(nv);
        }

        // 4. Giáo vụ Khoa Kinh tế & QTKD: giaovu_kt (Đặng Quốc Huy - Khoa KT_QTKD ID=3)
        User cb = userRepository.findByUsername("giaovu_kt")
                .or(() -> userRepository.findByUsername("CB001"))
                .orElse(null);
        if (cb == null) {
            cb = new User();
            cb.setUsername("giaovu_kt");
            cb.setFullName("Đặng Quốc Huy");
            cb.setDateOfBirth(LocalDate.of(1985, 5, 15));
            cb.setPassword(passwordEncoder.encode("123456"));
            cb.setEmail("giaovu.kt@sms.edu.vn");
            cb.setRole(roleStaff);
            departmentRepository.findById(3).ifPresent(cb::setDepartment);
            cb.setIsActive(true);
            cb.setMustChangePassword(false);
            userRepository.save(cb);
            log.info("Khởi tạo Giáo vụ Khoa Kinh tế 'giaovu_kt' thành công (Password: 123456)");
        } else {
            cb.setUsername("giaovu_kt");
            cb.setEmail("giaovu.kt@sms.edu.vn");
            cb.setFullName("Đặng Quốc Huy");
            cb.setRole(roleStaff);
            departmentRepository.findById(3).ifPresent(cb::setDepartment);
            userRepository.save(cb);
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
            user.setFullName("Trần Thị Khảo");
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
            if (user.getFullName() == null || user.getFullName().contains("Phòng Khảo thí") || "Cán bộ Khảo thí".equals(user.getFullName())) {
                user.setFullName("Trần Thị Khảo");
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
