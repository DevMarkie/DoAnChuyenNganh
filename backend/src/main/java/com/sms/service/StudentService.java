package com.sms.service;

import com.sms.dto.request.StudentRequest;
import com.sms.dto.response.GraduationEligibilityResponse;
import com.sms.dto.response.StudentImportRow;
import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ClassRepository classRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurriculumService curriculumService;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public List<Student> findAll(com.sms.security.UserPrincipal user) {
        if (user != null && "ACADEMIC_STAFF".equalsIgnoreCase(user.getRole())) {
            if (user.getDepartmentId() == null) {
                throw new ForbiddenException("Tài khoản Giáo vụ chưa được phân công Khoa trực thuộc");
            }
            return studentRepository.findByClassEntityDepartmentId(user.getDepartmentId());
        }
        return findAll();
    }

    public Student findById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + id));
    }

    public Student findById(Long id, com.sms.security.UserPrincipal user) {
        Student s = findById(id);
        if (user != null && "ACADEMIC_STAFF".equalsIgnoreCase(user.getRole())) {
            Integer deptId = (s.getClassEntity() != null && s.getClassEntity().getDepartment() != null)
                    ? s.getClassEntity().getDepartment().getId() : null;
            if (deptId == null || !deptId.equals(user.getDepartmentId())) {
                throw new ForbiddenException("Bạn không có quyền truy cập thông tin sinh viên thuộc Khoa khác");
            }
        }
        return s;
    }

    public Student findByUserId(Long userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
    }

    public List<Student> findByClass(Integer classId) {
        return studentRepository.findByClassEntityId(classId);
    }

    public List<Student> findByClass(Integer classId, com.sms.security.UserPrincipal user) {
        if (user != null && "ACADEMIC_STAFF".equalsIgnoreCase(user.getRole())) {
            ClassEntity cls = classRepository.findById(classId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
            Integer deptId = cls.getDepartment() != null ? cls.getDepartment().getId() : null;
            if (deptId == null || !deptId.equals(user.getDepartmentId())) {
                throw new ForbiddenException("Bạn không có quyền xem sinh viên của lớp thuộc Khoa khác");
            }
        }
        return findByClass(classId);
    }

    public List<Student> search(String keyword) {
        return studentRepository.search(keyword);
    }

    /**
     * Tìm kiếm sinh viên phân trang với bộ lọc nâng cao
     */
    public Page<Student> findPaged(String keyword, Integer departmentId, Integer classId,
                                    String academicYear, String status, Pageable pageable) {
        Student.StudentStatus parsedStatus = parseStatusOrNull(status);
        return studentRepository.findPaged(keyword, departmentId, classId, academicYear, parsedStatus, pageable);
    }

    public Page<Student> findPaged(String keyword, Integer departmentId, Integer classId,
                                    String status, Pageable pageable) {
        return findPaged(keyword, departmentId, classId, null, status, pageable);
    }

    @Transactional
    public Student create(StudentRequest request) {
        if (studentRepository.existsByStudentCode(request.getStudentCode())) {
            throw new BadRequestException("Mã sinh viên đã tồn tại: " + request.getStudentCode());
        }
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã tồn tại: " + request.getEmail());
        }

        ClassEntity cls = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp"));

        validateStudentCodeWithClass(request.getStudentCode(), cls);

        // Create user account
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role STUDENT"));

        String username = request.getStudentCode().trim().toLowerCase();
        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword().trim()
                : "123456";
        // Nếu dùng mật khẩu mặc định, bắt đổi khi đăng nhập lần đầu
        boolean needsMustChange = !(request.getPassword() != null && !request.getPassword().isBlank());

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEmail(request.getEmail());
        user.setRole(studentRole);
        user.setIsActive(true);
        user.setMustChangePassword(needsMustChange);
        user = userRepository.save(user);

        // Create student
        Student student = new Student();
        student.setUser(user);
        student.setStudentCode(request.getStudentCode().trim());
        student.setCitizenId(request.getCitizenId() != null ? request.getCitizenId().trim() : null);
        student.setFullName(request.getFullName().trim());
        student.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        student.setGender(parseGender(request.getGender()));
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setHometown(request.getHometown());
        student.setEmergencyContactName(request.getEmergencyContactName());
        student.setEmergencyContactPhone(request.getEmergencyContactPhone());
        student.setEmergencyContactRelationship(request.getEmergencyContactRelationship());
        student.setClassEntity(cls);
        student.setStatus(parseStatus(request.getStatus()));

        return studentRepository.save(student);
    }

    @Transactional
    public Student create(StudentRequest request, com.sms.security.UserPrincipal user) {
        if (user != null && "ACADEMIC_STAFF".equalsIgnoreCase(user.getRole())) {
            if (user.getDepartmentId() == null) {
                throw new ForbiddenException("Tài khoản Giáo vụ chưa được phân công Khoa trực thuộc");
            }
            ClassEntity cls = classRepository.findById(request.getClassId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp"));
            Integer deptId = cls.getDepartment() != null ? cls.getDepartment().getId() : null;
            if (deptId == null || !deptId.equals(user.getDepartmentId())) {
                throw new ForbiddenException("Bạn không thể thêm sinh viên vào lớp thuộc Khoa khác");
            }
        }
        return create(request);
    }

    @Transactional
    public Student update(Long id, StudentRequest request) {
        Student student = findById(id);

        ClassEntity cls = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp"));

        validateStudentCodeWithClass(student.getStudentCode(), cls);

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equalsIgnoreCase(student.getEmail())) {
                if (studentRepository.existsByEmail(newEmail)) {
                    throw new BadRequestException("Email đã tồn tại: " + newEmail);
                }
                student.setEmail(newEmail);
                if (student.getUser() != null) {
                    student.getUser().setEmail(newEmail);
                    userRepository.save(student.getUser());
                }
            }
        }

        if (request.getCitizenId() != null) {
            student.setCitizenId(request.getCitizenId().trim());
        }
        student.setFullName(request.getFullName().trim());
        student.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        student.setGender(parseGender(request.getGender()));
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setHometown(request.getHometown());
        student.setEmergencyContactName(request.getEmergencyContactName());
        student.setEmergencyContactPhone(request.getEmergencyContactPhone());
        student.setEmergencyContactRelationship(request.getEmergencyContactRelationship());
        student.setClassEntity(cls);

        if (request.getStatus() != null) {
            Student.StudentStatus parsedStatus = parseStatus(request.getStatus());
            validateStateTransition(student.getStatus(), parsedStatus, id);
            student.setStatus(parsedStatus);
        }

        // If admin provides a new password during edit, update the user's password as well
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            User user = student.getUser();
            if (user != null) {
                user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
                userRepository.save(user);
            }
        }

        return studentRepository.save(student);
    }

    @Transactional
    public Student update(Long id, StudentRequest request, com.sms.security.UserPrincipal user) {
        findById(id, user);
        if (user != null && "ACADEMIC_STAFF".equalsIgnoreCase(user.getRole())) {
            ClassEntity cls = classRepository.findById(request.getClassId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp"));
            Integer deptId = cls.getDepartment() != null ? cls.getDepartment().getId() : null;
            if (deptId == null || !deptId.equals(user.getDepartmentId())) {
                throw new ForbiddenException("Bạn không thể chuyển sinh viên sang lớp thuộc Khoa khác");
            }
        }
        return update(id, request);
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        Student student = findById(id);
        Student.StudentStatus parsedStatus = parseStatus(status);

        validateStateTransition(student.getStatus(), parsedStatus, id);

        student.setStatus(parsedStatus);
        studentRepository.save(student);

        // BR-Account-Lifecycle: Lock user account if student is INACTIVE (thôi học)
        User user = student.getUser();
        if (user != null) {
            boolean shouldBeActive = (parsedStatus == Student.StudentStatus.ACTIVE || parsedStatus == Student.StudentStatus.GRADUATED || parsedStatus == Student.StudentStatus.SUSPENDED || parsedStatus == Student.StudentStatus.RESERVED);
            user.setIsActive(shouldBeActive);
            userRepository.save(user);
        }
    }

    @Transactional
    public void updateStatus(Long id, String status, com.sms.security.UserPrincipal user) {
        findById(id, user);
        updateStatus(id, status);
    }

    /**
     * Quy tắc chuyển đổi trạng thái sinh viên (Student Lifecycle State Machine):
     * - ACTIVE (Đang học / Nhập học): có thể sang RESERVED, SUSPENDED, INACTIVE, hoặc GRADUATED (khi thỏa mãn chuẩn đầu ra).
     * - RESERVED (Bảo lưu): chỉ có thể quay lại ACTIVE hoặc bị INACTIVE (buộc thôi học).
     * - SUSPENDED (Đình chỉ): chỉ có thể quay lại ACTIVE hoặc bị INACTIVE.
     * - GRADUATED / INACTIVE: Trạng thái kết thúc (Terminal State), không được nhảy sang trạng thái khác.
     */
    public void validateStateTransition(Student.StudentStatus currentStatus, Student.StudentStatus targetStatus, Long studentId) {
        if (currentStatus == null || targetStatus == null || currentStatus == targetStatus) {
            return;
        }

        // Terminal state 1: Sinh viên đã tốt nghiệp không thể chuyển về trạng thái khác
        if (currentStatus == Student.StudentStatus.GRADUATED) {
            throw new BadRequestException("Vi phạm luồng trạng thái sinh viên: Sinh viên đã tốt nghiệp (GRADUATED), không thể thay đổi trạng thái.");
        }

        // Terminal state 2: Sinh viên đã thôi học không thể tự ý quay lại các trạng thái khác
        if (currentStatus == Student.StudentStatus.INACTIVE) {
            throw new BadRequestException("Vi phạm luồng trạng thái sinh viên: Sinh viên đã thôi học (INACTIVE), không thể chuyển đổi trạng thái.");
        }

        // Anti-skip to GRADUATED: Chỉ sinh viên đang học (ACTIVE) mới được xét chuyển sang GRADUATED
        if (targetStatus == Student.StudentStatus.GRADUATED) {
            if (currentStatus != Student.StudentStatus.ACTIVE) {
                throw new BadRequestException("Vi phạm luồng trạng thái: Chỉ sinh viên đang học (ACTIVE) mới được xét chuyển sang Tốt nghiệp. Trạng thái hiện tại: " + currentStatus);
            }
            curriculumService.validateGraduationEligibility(studentId);
        }

        // Sinh viên đang bảo lưu (RESERVED) chỉ có thể quay lại học (ACTIVE) hoặc thôi học (INACTIVE)
        if (currentStatus == Student.StudentStatus.RESERVED) {
            if (targetStatus != Student.StudentStatus.ACTIVE && targetStatus != Student.StudentStatus.INACTIVE) {
                throw new BadRequestException("Vi phạm luồng trạng thái: Sinh viên đang bảo lưu (RESERVED) chỉ có thể quay lại học tập (ACTIVE) hoặc thôi học (INACTIVE).");
            }
        }

        // Sinh viên đang bị tạm đình chỉ (SUSPENDED) chỉ có thể quay lại học (ACTIVE) hoặc thôi học (INACTIVE)
        if (currentStatus == Student.StudentStatus.SUSPENDED) {
            if (targetStatus != Student.StudentStatus.ACTIVE && targetStatus != Student.StudentStatus.INACTIVE) {
                throw new BadRequestException("Vi phạm luồng trạng thái: Sinh viên đang bị đình chỉ (SUSPENDED) chỉ có thể quay lại học tập (ACTIVE) hoặc thôi học (INACTIVE).");
            }
        }
    }

    @Transactional
    public Student updateMyContact(Long userId, String phone, String address) {
        return updateMyContact(userId, phone, address, null, null, null);
    }

    @Transactional
    public Student updateMyContact(Long userId, String phone, String address,
                                   String emergencyContactName, String emergencyContactPhone, String emergencyContactRelationship) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        if (phone != null) student.setPhone(phone.trim());
        if (address != null) student.setAddress(address.trim());
        if (emergencyContactName != null) {
            student.setEmergencyContactName(emergencyContactName.trim());
        }
        if (emergencyContactPhone != null) {
            String cleanPhone = emergencyContactPhone.trim();
            if (!cleanPhone.isEmpty() && !cleanPhone.matches("^0\\d{9}$")) {
                throw new BadRequestException("Số điện thoại khẩn cấp không đúng định dạng Việt Nam (10 chữ số bắt đầu bằng 0)");
            }
            student.setEmergencyContactPhone(cleanPhone);
        }
        if (emergencyContactRelationship != null) {
            student.setEmergencyContactRelationship(emergencyContactRelationship.trim());
        }
        return studentRepository.save(student);
    }

    /**
     * Tra cứu điều kiện xét tốt nghiệp của sinh viên
     */
    public GraduationEligibilityResponse getGraduationEligibility(Long id) {
        return curriculumService.checkGraduationEligibility(id);
    }

    /**
     * Nhập hàng loạt sinh viên từ danh sách đã qua kiểm duyệt Preview.
     * Tự động khởi tạo tài khoản User (Role STUDENT), mật khẩu 123456, gán lớp và kích hoạt tài khoản.
     */
    @Transactional
    public int saveImportedStudents(List<StudentImportRow> validRows) {
        if (validRows == null || validRows.isEmpty()) {
            throw new BadRequestException("Danh sách sinh viên rỗng");
        }

        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role STUDENT"));

        String defaultEncodedPassword = passwordEncoder.encode("123456");
        Map<String, ClassEntity> classCache = new HashMap<>();

        int count = 0;
        for (StudentImportRow row : validRows) {
            if (!row.isValid()) continue;

            // Bỏ qua nếu MSSV hoặc Email đã tồn tại (phòng trường hợp trùng lặp)
            if (studentRepository.existsByStudentCode(row.getStudentCode()) ||
                studentRepository.existsByEmail(row.getEmail())) {
                continue;
            }

            String classCode = row.getClassCode().trim();
            ClassEntity cls = classCache.computeIfAbsent(classCode, code ->
                    classRepository.findByCode(code).orElse(null));
            if (cls == null) continue;

            // 1. Tạo tài khoản User
            String username = row.getStudentCode().trim().toLowerCase();

            User user = new User();
            user.setUsername(username);
            user.setPassword(defaultEncodedPassword);
            user.setEmail(row.getEmail().trim());
            user.setRole(studentRole);
            user.setIsActive(true);
            user.setMustChangePassword(true);
            user = userRepository.save(user);

            // 2. Tạo đối tượng Student
            Student student = new Student();
            student.setUser(user);
            student.setStudentCode(row.getStudentCode().trim());
            student.setFullName(row.getFullName().trim());
            student.setDateOfBirth(LocalDate.parse(row.getDateOfBirth()));
            student.setGender(parseGender(row.getGender()));
            student.setEmail(row.getEmail().trim());
            student.setPhone(row.getPhone() != null && !row.getPhone().isBlank() ? row.getPhone().trim() : null);
            student.setAddress(row.getAddress() != null && !row.getAddress().isBlank() ? row.getAddress().trim() : null);
            student.setClassEntity(cls);
            student.setStatus(Student.StudentStatus.ACTIVE);

            studentRepository.save(student);
            count++;
        }

        return count;
    }

    private Student.Gender parseGender(String g) {
        if (g == null) return Student.Gender.OTHER;
        if (g.equalsIgnoreCase("Nam") || g.equalsIgnoreCase("MALE")) return Student.Gender.MALE;
        if (g.equalsIgnoreCase("Nữ") || g.equalsIgnoreCase("Nu") || g.equalsIgnoreCase("FEMALE")) return Student.Gender.FEMALE;
        return Student.Gender.OTHER;
    }

    private Student.StudentStatus parseStatus(String s) {
        if (s == null) return Student.StudentStatus.ACTIVE;
        if (s.equalsIgnoreCase("ACTIVE") || s.equalsIgnoreCase("STUDYING") || s.equalsIgnoreCase("Đang học")) {
            return Student.StudentStatus.ACTIVE;
        }
        if (s.equalsIgnoreCase("GRADUATED") || s.equalsIgnoreCase("Tốt nghiệp")) {
            return Student.StudentStatus.GRADUATED;
        }
        if (s.equalsIgnoreCase("SUSPENDED") || s.equalsIgnoreCase("Tạm đình chỉ")) {
            return Student.StudentStatus.SUSPENDED;
        }
        if (s.equalsIgnoreCase("RESERVED") || s.equalsIgnoreCase("Bảo lưu")) {
            return Student.StudentStatus.RESERVED;
        }
        return Student.StudentStatus.INACTIVE;
    }

    /**
     * Giống parseStatus nhưng trả về null nếu chuỗi rỗng/null (dùng cho filter pagination)
     */
    private Student.StudentStatus parseStatusOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Student.StudentStatus.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return parseStatus(s);
        }
    }

    /**
     * Ràng buộc logic Khóa học: Mã SV 7 chữ số chuẩn phải có tiền tố khớp với Khóa của Lớp.
     * Quy ước hệ thống: K16 -> '23', K17 -> '24', K18 -> '25', K19 -> '26' (prefix = cohort + 7)
     */
    private void validateStudentCodeWithClass(String studentCode, ClassEntity cls) {
        if (studentCode == null || cls == null || cls.getAcademicYear() == null) return;
        String code = studentCode.trim();
        String year = cls.getAcademicYear().trim().toUpperCase();
        if (code.matches("^\\d{7}$") && year.matches("^K\\d{2}$")) {
            int cohortNum = Integer.parseInt(year.substring(1));
            String expectedPrefix = String.valueOf(cohortNum + 7);
            if (!code.startsWith(expectedPrefix)) {
                throw new BadRequestException("Mã sinh viên '" + code + "' không phù hợp với khóa " + year
                        + " của lớp '" + cls.getName() + "' (yêu cầu bắt đầu bằng '" + expectedPrefix + "')");
            }
        }
    }

    @Transactional
    public void resetPassword(Long studentId) {
        Student student = findById(studentId);
        User user = student.getUser();
        if (user == null) {
            throw new ResourceNotFoundException("Sinh viên chưa có tài khoản người dùng liên kết");
        }
        user.setPassword(passwordEncoder.encode("123456"));
        user.setMustChangePassword(true);
        userRepository.save(user);
    }
}
