package com.sms.service;

import com.sms.dto.request.LecturerRequest;
import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LecturerService {

    private final LecturerRepository lecturerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Lecturer> findAll() {
        return lecturerRepository.findAll();
    }

    public Lecturer findById(Long id) {
        return lecturerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên với ID: " + id));
    }

    public Lecturer findByUserId(Long userId) {
        return lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên"));
    }

    public List<Lecturer> search(String keyword) {
        return lecturerRepository.search(keyword);
    }

    @Transactional
    public Lecturer create(LecturerRequest request) {
        if (lecturerRepository.existsByLecturerCode(request.getLecturerCode())) {
            throw new BadRequestException("Mã giảng viên đã tồn tại");
        }
        if (lecturerRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã tồn tại");
        }

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));

        Role lecturerRole = roleRepository.findByName("LECTURER")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role LECTURER"));

        String username = request.getLecturerCode().trim().toLowerCase();
        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword().trim()
                : "123456";

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEmail(request.getEmail());
        user.setRole(lecturerRole);
        user.setIsActive(true);
        user = userRepository.save(user);

        Lecturer lecturer = new Lecturer();
        lecturer.setUser(user);
        lecturer.setLecturerCode(request.getLecturerCode().trim());
        lecturer.setFullName(request.getFullName().trim());
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            lecturer.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        }
        if (request.getGender() != null && !request.getGender().isEmpty()) {
            lecturer.setGender(parseGender(request.getGender()));
        }
        lecturer.setEmail(request.getEmail());
        lecturer.setPhone(request.getPhone());
        lecturer.setDepartment(dept);
        lecturer.setDegree(request.getDegree());
        lecturer.setSpecialization(request.getSpecialization());
        lecturer.setIsActive(true);

        return lecturerRepository.save(lecturer);
    }

    @Transactional
    public Lecturer update(Long id, LecturerRequest request) {
        Lecturer lecturer = findById(id);
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));

        lecturer.setFullName(request.getFullName().trim());
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            lecturer.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        }
        if (request.getGender() != null && !request.getGender().isEmpty()) {
            lecturer.setGender(parseGender(request.getGender()));
        }
        lecturer.setPhone(request.getPhone());
        lecturer.setDepartment(dept);
        lecturer.setDegree(request.getDegree());
        lecturer.setSpecialization(request.getSpecialization());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            User user = lecturer.getUser();
            if (user != null) {
                user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
                userRepository.save(user);
            }
        }

        return lecturerRepository.save(lecturer);
    }

    public void toggleActive(Long id) {
        Lecturer lecturer = findById(id);
        lecturer.setIsActive(!lecturer.getIsActive());
        lecturerRepository.save(lecturer);
    }

    private Student.Gender parseGender(String g) {
        if (g == null) return Student.Gender.OTHER;
        if (g.equalsIgnoreCase("Nam") || g.equalsIgnoreCase("MALE")) return Student.Gender.MALE;
        if (g.equalsIgnoreCase("Nữ") || g.equalsIgnoreCase("Nu") || g.equalsIgnoreCase("FEMALE")) return Student.Gender.FEMALE;
        return Student.Gender.OTHER;
    }
}
