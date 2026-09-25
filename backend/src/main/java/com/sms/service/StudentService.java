package com.sms.service;

import com.sms.dto.request.StudentRequest;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ClassRepository classRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Student findById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + id));
    }

    public Student findByUserId(Long userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
    }

    public List<Student> findByClass(Integer classId) {
        return studentRepository.findByClassEntityId(classId);
    }

    public List<Student> search(String keyword) {
        return studentRepository.search(keyword);
    }

    /**
     * Tìm kiếm sinh viên phân trang với bộ lọc nâng cao
     */
    public Page<Student> findPaged(String keyword, Integer departmentId, Integer classId,
                                    String status, Pageable pageable) {
        Student.StudentStatus parsedStatus = parseStatusOrNull(status);
        return studentRepository.findPaged(keyword, departmentId, classId, parsedStatus, pageable);
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
        student.setFullName(request.getFullName().trim());
        student.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        student.setGender(parseGender(request.getGender()));
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setClassEntity(cls);
        student.setStatus(parseStatus(request.getStatus()));

        return studentRepository.save(student);
    }

    @Transactional
    public Student update(Long id, StudentRequest request) {
        Student student = findById(id);

        ClassEntity cls = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp"));

        student.setFullName(request.getFullName().trim());
        student.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        student.setGender(parseGender(request.getGender()));
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setClassEntity(cls);

        if (request.getStatus() != null) {
            student.setStatus(parseStatus(request.getStatus()));
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
    public void updateStatus(Long id, String status) {
        Student student = findById(id);
        Student.StudentStatus parsedStatus = parseStatus(status);
        student.setStatus(parsedStatus);
        studentRepository.save(student);

        // BR-Account-Lifecycle: Lock user account if student is SUSPENDED or INACTIVE (thôi học)
        User user = student.getUser();
        if (user != null) {
            boolean shouldBeActive = (parsedStatus == Student.StudentStatus.ACTIVE || parsedStatus == Student.StudentStatus.GRADUATED);
            user.setIsActive(shouldBeActive);
            userRepository.save(user);
        }
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
}
