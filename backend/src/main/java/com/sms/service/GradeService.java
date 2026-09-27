package com.sms.service;

import com.sms.dto.request.GradeRequest;
import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeService {

    private final GradeRepository gradeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final LecturerRepository lecturerRepository;

    public List<Grade> findBySection(Long sectionId) {
        return gradeRepository.findBySectionId(sectionId);
    }

    /**
     * Nhập/cập nhật điểm cho một enrollment
     * BR-07: Giảng viên chỉ được nhập điểm cho HP mình phụ trách
     */
    @Transactional
    public Grade saveGrade(Long userId, GradeRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký"));

        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);

        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElseGet(() -> {
                    Grade g = new Grade();
                    g.setEnrollment(enrollment);
                    return g;
                });

        applyGradeChanges(userId, request, enrollment, grade, lecturer);
        return gradeRepository.save(grade);
    }

    /**
     * Nhập điểm hàng loạt cho một học phần.
     * Bulk-fetches the lecturer, enrollments and existing grades up front so the
     * whole batch runs in a handful of queries instead of ~4 per row (N+1).
     */
    @Transactional
    public void saveGrades(Long userId, List<GradeRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return;
        }

        // Resolve the lecturer once — userId is constant for the whole batch.
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);

        List<Long> enrollmentIds = requests.stream()
                .map(GradeRequest::getEnrollmentId)
                .distinct()
                .toList();

        Map<Long, Enrollment> enrollmentsById = enrollmentRepository.findByIdInWithSection(enrollmentIds)
                .stream()
                .collect(Collectors.toMap(Enrollment::getId, Function.identity()));

        Map<Long, Grade> gradesByEnrollmentId = gradeRepository.findByEnrollmentIdIn(enrollmentIds)
                .stream()
                .collect(Collectors.toMap(g -> g.getEnrollment().getId(), Function.identity()));

        List<Grade> toSave = new ArrayList<>(requests.size());
        for (GradeRequest request : requests) {
            Enrollment enrollment = enrollmentsById.get(request.getEnrollmentId());
            if (enrollment == null) {
                throw new ResourceNotFoundException("Không tìm thấy đăng ký: " + request.getEnrollmentId());
            }
            Grade grade = gradesByEnrollmentId.computeIfAbsent(enrollment.getId(), id -> {
                Grade g = new Grade();
                g.setEnrollment(enrollment);
                return g;
            });
            applyGradeChanges(userId, request, enrollment, grade, lecturer);
            toSave.add(grade);
        }

        gradeRepository.saveAll(toSave);
    }

    /**
     * Apply a grade request onto a (possibly new) Grade entity in memory.
     * Enforces BR-07 (lecturer only edits their own sections' grades) and the
     * finalize/unlock rules. Does not persist — the caller saves.
     */
    private void applyGradeChanges(Long userId, GradeRequest request, Enrollment enrollment,
                                   Grade grade, Lecturer lecturer) {
        // BR-07: Check lecturer authorization
        if (lecturer != null) {
            CourseSection section = enrollment.getSection();
            if (!section.getLecturer().getId().equals(lecturer.getId())) {
                throw new BadRequestException("Bạn không có quyền nhập điểm cho học phần này");
            }
        }

        // Only block Lecturer from editing finalized grades. Admin can always edit or reopen/unlock.
        if (Boolean.TRUE.equals(grade.getIsFinalized()) && lecturer != null) {
            throw new BadRequestException("Điểm đã được chốt, không thể sửa. Vui lòng liên hệ Quản trị viên để mở lại.");
        }

        if (request.getAttendanceScore() != null) {
            grade.setAttendanceScore(request.getAttendanceScore());
        }
        if (request.getMidtermScore() != null) {
            grade.setMidtermScore(request.getMidtermScore());
        }
        if (request.getFinalScore() != null) {
            grade.setFinalScore(request.getFinalScore());
        }

        // Auto-calculate total score
        grade.calculateTotalScore();

        if (Boolean.TRUE.equals(request.getFinalize())) {
            if (grade.getTotalScore() == null) {
                throw new BadRequestException("Không thể chốt điểm khi chưa nhập đủ điểm thành phần");
            }
            grade.setIsFinalized(true);
            log.info("AUDIT: userId={} finalized grade for enrollmentId={} (section={})",
                    userId, enrollment.getId(), enrollment.getSection().getSectionCode());
        } else if (lecturer == null && Boolean.FALSE.equals(request.getFinalize())) {
            // Admin can explicitly unfinalize / unlock
            grade.setIsFinalized(false);
            log.info("AUDIT: adminUserId={} unlocked grade for enrollmentId={}", userId, enrollment.getId());
        }
    }
}
