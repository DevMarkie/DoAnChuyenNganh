package com.sms.service;

import com.sms.dto.request.RegistrationWaveRequest;
import com.sms.dto.response.RegistrationStatusResponse;
import com.sms.dto.response.RegistrationWaveResponse;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegistrationWaveService {

    private final RegistrationWaveRepository registrationWaveRepository;
    private final SemesterRepository semesterRepository;
    private final CohortRepository cohortRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    public List<RegistrationWaveResponse> getWavesBySemester(Integer semesterId) {
        return registrationWaveRepository.findBySemesterIdOrderByStartTimeAsc(semesterId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RegistrationWaveResponse getWaveById(Long id) {
        RegistrationWave wave = registrationWaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đợt/ca đăng ký: " + id));
        return mapToResponse(wave);
    }

    @Transactional
    public RegistrationWaveResponse createWave(RegistrationWaveRequest request) {
        if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().isEqual(request.getStartTime())) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ: " + request.getSemesterId()));

        Cohort cohort = null;
        if (request.getCohortId() != null) {
            cohort = cohortRepository.findById(request.getCohortId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa sinh viên: " + request.getCohortId()));
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa: " + request.getDepartmentId()));
        }

        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ngành đào tạo: " + request.getMajorId()));
            if (department != null && major.getDepartment() != null && !major.getDepartment().getId().equals(department.getId())) {
                throw new BadRequestException("Ngành được chọn không thuộc Khoa đã chọn!");
            }
        }

        RegistrationWave wave = RegistrationWave.builder()
                .semester(semester)
                .name(request.getName().trim())
                .shiftName(request.getShiftName() != null ? request.getShiftName().trim() : null)
                .cohort(cohort)
                .department(department)
                .major(major)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return mapToResponse(registrationWaveRepository.save(wave));
    }

    @Transactional
    public RegistrationWaveResponse updateWave(Long id, RegistrationWaveRequest request) {
        RegistrationWave wave = registrationWaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đợt/ca đăng ký: " + id));

        if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().isEqual(request.getStartTime())) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        if (!wave.getSemester().getId().equals(request.getSemesterId())) {
            Semester semester = semesterRepository.findById(request.getSemesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ: " + request.getSemesterId()));
            wave.setSemester(semester);
        }

        Cohort cohort = null;
        if (request.getCohortId() != null) {
            cohort = cohortRepository.findById(request.getCohortId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa sinh viên: " + request.getCohortId()));
        }
        wave.setCohort(cohort);

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa: " + request.getDepartmentId()));
        }
        wave.setDepartment(department);

        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ngành: " + request.getMajorId()));
            if (department != null && major.getDepartment() != null && !major.getDepartment().getId().equals(department.getId())) {
                throw new BadRequestException("Ngành được chọn không thuộc Khoa đã chọn!");
            }
        }
        wave.setMajor(major);

        wave.setName(request.getName().trim());
        wave.setShiftName(request.getShiftName() != null ? request.getShiftName().trim() : null);
        wave.setStartTime(request.getStartTime());
        wave.setEndTime(request.getEndTime());
        wave.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            wave.setIsActive(request.getIsActive());
        }

        return mapToResponse(registrationWaveRepository.save(wave));
    }

    @Transactional
    public void deleteWave(Long id) {
        if (!registrationWaveRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy đợt/ca đăng ký: " + id);
        }
        registrationWaveRepository.deleteById(id);
    }

    @Transactional
    public RegistrationWaveResponse toggleActive(Long id) {
        RegistrationWave wave = registrationWaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đợt/ca đăng ký: " + id));
        wave.setIsActive(!Boolean.TRUE.equals(wave.getIsActive()));
        return mapToResponse(registrationWaveRepository.save(wave));
    }

    public RegistrationStatusResponse getStudentRegistrationStatus(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        Semester currentSemester = semesterRepository.findByIsCurrentTrue().orElse(null);
        if (currentSemester == null) {
            return RegistrationStatusResponse.builder()
                    .canRegister(false)
                    .studentStatus(student.getStatus().name())
                    .minCredits(12)
                    .maxCredits(24)
                    .currentEnrolledCredits(0)
                    .message("Hiện không có học kỳ nào đang mở để đăng ký")
                    .build();
        }

        Integer cohortId = student.getClassEntity() != null && student.getClassEntity().getCohort() != null
                ? student.getClassEntity().getCohort().getId() : null;
        String cohortName = student.getClassEntity() != null && student.getClassEntity().getCohort() != null
                ? student.getClassEntity().getCohort().getName() : "Chưa xác định";

        Integer departmentId = student.getClassEntity() != null && student.getClassEntity().getDepartment() != null
                ? student.getClassEntity().getDepartment().getId() : null;
        String departmentName = student.getClassEntity() != null && student.getClassEntity().getDepartment() != null
                ? student.getClassEntity().getDepartment().getName() : "Chưa xác định";

        Integer majorId = student.getClassEntity() != null && student.getClassEntity().getMajor() != null
                ? student.getClassEntity().getMajor().getId() : null;
        String majorName = student.getClassEntity() != null && student.getClassEntity().getMajor() != null
                ? student.getClassEntity().getMajor().getName() : "Chưa xác định";

        int currentCredits = enrollmentRepository.countEnrolledCredits(student.getId(), currentSemester.getId());

        if (student.getStatus() != Student.StudentStatus.ACTIVE) {
            String statusMsg = student.getStatus() == Student.StudentStatus.SUSPENDED
                    ? "Tài khoản sinh viên đang trong trạng thái Bảo lưu, không được phép đăng ký học phần"
                    : "Tài khoản sinh viên đang trong trạng thái Buộc thôi học / Ngừng học, bị khóa quyền đăng ký";
            return RegistrationStatusResponse.builder()
                    .canRegister(false)
                    .studentStatus(student.getStatus().name())
                    .studentCohort(cohortName)
                    .studentDepartment(departmentName)
                    .studentMajor(majorName)
                    .minCredits(12)
                    .maxCredits(24)
                    .currentEnrolledCredits(currentCredits)
                    .message(statusMsg)
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();

        // Kiểm tra cơ chế Nghiêm ngặt độc quyền (Strict Exclusive):
        // Nếu học kỳ có cấu hình ca riêng theo Ngành của sinh viên, sinh viên CHỈ được đăng ký trong ca của Ngành mình.
        boolean hasSpecificMajorWaves = majorId != null && registrationWaveRepository.hasWavesForMajor(currentSemester.getId(), majorId);

        List<RegistrationWave> eligibleActiveWaves;
        List<RegistrationWave> allWavesForStudent;

        if (hasSpecificMajorWaves) {
            eligibleActiveWaves = registrationWaveRepository.findActiveWavesByMajor(currentSemester.getId(), cohortId, majorId, now);
            allWavesForStudent = registrationWaveRepository.findWavesByMajorOrderByStartTimeAsc(currentSemester.getId(), majorId);
        } else {
            eligibleActiveWaves = registrationWaveRepository.findEligibleActiveWaves(
                    currentSemester.getId(), cohortId, departmentId, majorId, now);
            allWavesForStudent = registrationWaveRepository.findWavesForStudent(
                    currentSemester.getId(), cohortId, departmentId, majorId);
        }

        List<RegistrationWaveResponse> waveResponses = allWavesForStudent.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        RegistrationWave activeWave = eligibleActiveWaves.isEmpty() ? null : eligibleActiveWaves.get(0);
        RegistrationWave upcomingWave = allWavesForStudent.stream()
                .filter(w -> w.getStartTime().isAfter(now))
                .findFirst()
                .orElse(null);

        boolean canRegister = activeWave != null;
        String message;
        if (canRegister) {
            String shiftPrefix = activeWave.getShiftName() != null ? "[" + activeWave.getShiftName() + "] " : "";
            message = String.format("Cổng đăng ký đang mở: %s%s (Từ %s đến %s)",
                    shiftPrefix,
                    activeWave.getName(),
                    activeWave.getStartTime().format(TIME_FMT),
                    activeWave.getEndTime().format(TIME_FMT));
        } else if (upcomingWave != null) {
            String shiftPrefix = upcomingWave.getShiftName() != null ? "[" + upcomingWave.getShiftName() + "] " : "";
            message = String.format("Chưa đến ca đăng ký của bạn. Ca tiếp theo: %s%s (Mở lúc %s)",
                    shiftPrefix,
                    upcomingWave.getName(),
                    upcomingWave.getStartTime().format(TIME_FMT));
        } else {
            message = String.format("Hiện không có ca đăng ký tín chỉ nào đang mở cho %s - %s trong học kỳ này.",
                    cohortName, majorName.equals("Chưa xác định") ? departmentName : majorName);
        }

        return RegistrationStatusResponse.builder()
                .canRegister(canRegister)
                .studentStatus(student.getStatus().name())
                .studentCohort(cohortName)
                .studentDepartment(departmentName)
                .studentMajor(majorName)
                .currentShiftName(activeWave != null ? activeWave.getShiftName() : null)
                .activeWave(activeWave != null ? mapToResponse(activeWave) : null)
                .upcomingWave(upcomingWave != null ? mapToResponse(upcomingWave) : null)
                .allStudentWaves(waveResponses)
                .minCredits(12)
                .maxCredits(24)
                .currentEnrolledCredits(currentCredits)
                .message(message)
                .build();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public RegistrationWave validateStudentEligibleWave(Student student, Integer semesterId) {
        Integer cohortId = student.getClassEntity() != null && student.getClassEntity().getCohort() != null
                ? student.getClassEntity().getCohort().getId() : null;
        Integer departmentId = student.getClassEntity() != null && student.getClassEntity().getDepartment() != null
                ? student.getClassEntity().getDepartment().getId() : null;
        Integer majorId = student.getClassEntity() != null && student.getClassEntity().getMajor() != null
                ? student.getClassEntity().getMajor().getId() : null;
        String majorName = "ngành của bạn";
        try {
            if (student.getClassEntity() != null && student.getClassEntity().getMajor() != null) {
                majorName = student.getClassEntity().getMajor().getName();
            }
        } catch (Exception ignored) {
        }

        LocalDateTime now = LocalDateTime.now();

        boolean hasSpecificMajorWaves = majorId != null && registrationWaveRepository.hasWavesForMajor(semesterId, majorId);

        List<RegistrationWave> eligibleWaves;
        if (hasSpecificMajorWaves) {
            eligibleWaves = registrationWaveRepository.findActiveWavesByMajor(semesterId, cohortId, majorId, now);
        } else {
            eligibleWaves = registrationWaveRepository.findEligibleActiveWaves(semesterId, cohortId, departmentId, majorId, now);
        }

        if (eligibleWaves.isEmpty()) {
            List<RegistrationWave> studentWaves = hasSpecificMajorWaves
                    ? registrationWaveRepository.findWavesByMajorOrderByStartTimeAsc(semesterId, majorId)
                    : registrationWaveRepository.findWavesForStudent(semesterId, cohortId, departmentId, majorId);

            RegistrationWave upcoming = studentWaves.stream()
                    .filter(w -> w.getStartTime().isAfter(now))
                    .findFirst()
                    .orElse(null);

            if (upcoming != null) {
                String shiftInfo = upcoming.getShiftName() != null ? " (" + upcoming.getShiftName() + ")" : "";
                throw new BadRequestException(String.format(
                        "Chưa đến khung giờ/ca đăng ký học phần của ngành %s! Đợt '%s'%s sẽ mở từ %s đến %s.",
                        majorName,
                        upcoming.getName(),
                        shiftInfo,
                        upcoming.getStartTime().format(TIME_FMT),
                        upcoming.getEndTime().format(TIME_FMT)));
            } else {
                throw new BadRequestException(String.format(
                        "Không có ca đăng ký học phần nào đang mở cho ngành %s trong học kỳ này!", majorName));
            }
        }

        return eligibleWaves.get(0);
    }

    public RegistrationWaveResponse mapToResponse(RegistrationWave wave) {
        LocalDateTime now = LocalDateTime.now();
        boolean isCurrent = wave.isCurrentlyActive();
        String statusText;
        if (!Boolean.TRUE.equals(wave.getIsActive())) {
            statusText = "TẠM KHÓA";
        } else if (now.isBefore(wave.getStartTime())) {
            statusText = "SẮP DIỄN RA";
        } else if (now.isAfter(wave.getEndTime())) {
            statusText = "ĐÃ KẾT THÚC";
        } else {
            statusText = "ĐANG MỞ";
        }

        return RegistrationWaveResponse.builder()
                .id(wave.getId())
                .semesterId(wave.getSemester().getId())
                .semesterName(wave.getSemester().getSemesterName())
                .name(wave.getName())
                .shiftName(wave.getShiftName())
                .cohortId(wave.getCohort() != null ? wave.getCohort().getId() : null)
                .cohortCode(wave.getCohort() != null ? wave.getCohort().getCode() : null)
                .cohortName(wave.getCohort() != null ? wave.getCohort().getName() : "Tất cả các khóa")
                .departmentId(wave.getDepartment() != null ? wave.getDepartment().getId() : null)
                .departmentName(wave.getDepartment() != null ? wave.getDepartment().getName() : "Tất cả các khoa")
                .majorId(wave.getMajor() != null ? wave.getMajor().getId() : null)
                .majorCode(wave.getMajor() != null ? wave.getMajor().getCode() : null)
                .majorName(wave.getMajor() != null ? wave.getMajor().getName() : "Tất cả các ngành")
                .startTime(wave.getStartTime())
                .endTime(wave.getEndTime())
                .description(wave.getDescription())
                .isActive(wave.getIsActive())
                .isCurrent(isCurrent)
                .statusText(statusText)
                .createdAt(wave.getCreatedAt())
                .build();
    }
}
