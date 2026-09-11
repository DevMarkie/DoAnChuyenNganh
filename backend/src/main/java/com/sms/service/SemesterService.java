package com.sms.service;

import com.sms.dto.request.SemesterRequest;
import com.sms.entity.Semester;
import com.sms.exception.*;
import com.sms.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;

    @Cacheable(value = "semesters", key = "'all'")
    public List<Semester> findAll() {
        return semesterRepository.findAllByOrderByStartDateDesc();
    }

    public Semester findById(Integer id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ với ID: " + id));
    }

    @Cacheable(value = "semesters", key = "'current'")
    public Semester findCurrent() {
        return semesterRepository.findByIsCurrentTrue()
                .orElseThrow(() -> new ResourceNotFoundException("Không có học kỳ hiện tại"));
    }

    @Transactional
    @CacheEvict(value = "semesters", allEntries = true)
    public Semester create(SemesterRequest request) {
        if (semesterRepository.existsBySemesterCode(request.getSemesterCode())) {
            throw new BadRequestException("Mã học kỳ đã tồn tại");
        }

        Semester semester = new Semester();
        mapRequestToEntity(request, semester);
        if (Boolean.TRUE.equals(request.getIsCurrent())) {
            clearCurrentSemester(null);
            semester.setIsCurrent(true);
        }
        return semesterRepository.save(semester);
    }

    @Transactional
    @CacheEvict(value = "semesters", allEntries = true)
    public Semester update(Integer id, SemesterRequest request) {
        Semester semester = findById(id);
        mapRequestToEntity(request, semester);
        // The edit form always sends false when it does not expose a current
        // toggle. Do not accidentally unset the active semester on edit.
        if (Boolean.TRUE.equals(request.getIsCurrent())) {
            clearCurrentSemester(id);
            semester.setIsCurrent(true);
        }
        return semesterRepository.save(semester);
    }

    @Transactional
    @CacheEvict(value = "semesters", allEntries = true)
    public void setCurrent(Integer id) {
        clearCurrentSemester(id);
        // Set new current
        Semester semester = findById(id);
        semester.setIsCurrent(true);
        semesterRepository.save(semester);
    }

    private void mapRequestToEntity(SemesterRequest request, Semester semester) {
        LocalDate startDate = LocalDate.parse(request.getStartDate());
        LocalDate endDate = LocalDate.parse(request.getEndDate());
        if (!endDate.isAfter(startDate)) {
            throw new BadRequestException("Ngày kết thúc học kỳ phải sau ngày bắt đầu");
        }

        boolean hasRegistrationStart = request.getRegistrationStart() != null
                && !request.getRegistrationStart().isBlank();
        boolean hasRegistrationEnd = request.getRegistrationEnd() != null
                && !request.getRegistrationEnd().isBlank();
        if (hasRegistrationStart != hasRegistrationEnd) {
            throw new BadRequestException("Cần nhập cả ngày mở và ngày kết thúc đăng ký");
        }

        semester.setSemesterCode(request.getSemesterCode());
        semester.setSemesterName(request.getSemesterName());
        semester.setAcademicYear(request.getAcademicYear());
        semester.setSemesterNumber(request.getSemesterNumber());
        semester.setStartDate(startDate);
        semester.setEndDate(endDate);
        if (hasRegistrationStart) {
            LocalDate registrationStart = LocalDate.parse(request.getRegistrationStart());
            LocalDate registrationEnd = LocalDate.parse(request.getRegistrationEnd());
            if (registrationEnd.isBefore(registrationStart)) {
                throw new BadRequestException("Hạn đăng ký không thể trước ngày mở đăng ký");
            }
            semester.setRegistrationStart(registrationStart);
            semester.setRegistrationEnd(registrationEnd);
        } else {
            // An admin can deliberately clear a previously configured window.
            semester.setRegistrationStart(null);
            semester.setRegistrationEnd(null);
        }
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                semester.setStatus(Semester.SemesterStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Trạng thái học kỳ không hợp lệ");
            }
        }
    }

    private void clearCurrentSemester(Integer exceptId) {
        semesterRepository.findByIsCurrentTrue().ifPresent(current -> {
            if (!current.getId().equals(exceptId)) {
                current.setIsCurrent(false);
                semesterRepository.save(current);
            }
        });
    }
}
