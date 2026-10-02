package com.sms.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sms.dto.request.GradeRequest;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Lecturer;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
     * BR-07 (đọc): giảng viên chỉ được xem/xuất bảng điểm của lớp mình phụ trách.
     * Admin (không có bản ghi Lecturer) được xem mọi lớp. Ném lỗi nếu không có quyền.
     */
    public void assertCanViewSection(Long userId, Long sectionId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        if (lecturer == null) {
            return; // admin — toàn quyền xem
        }
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (section.getLecturer() == null || !section.getLecturer().getId().equals(lecturer.getId())) {
            throw new BadRequestException("Bạn không có quyền xem bảng điểm của lớp học phần này");
        }
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

        applyScores(userId, request, enrollment, grade, lecturer);

        // Activity #14: chỉ được chốt khi cả lớp học phần đã có điểm đầy đủ (100%).
        if (Boolean.TRUE.equals(request.getFinalize())) {
            if (grade.getTotalScore() == null && grade.getSpecialGrade() == Grade.SpecialGrade.NONE) {
                throw new BadRequestException("Không thể chốt điểm khi chưa nhập đủ điểm thành phần");
            }
            verifyAllStudentsGraded(enrollment.getSection().getId(),
                    Map.of(enrollment.getId(), grade));
            grade.setIsFinalized(true);
            // Đặt mốc ân hạn ở lần chốt đầu tiên; sửa trong cửa sổ không được gia hạn thêm.
            if (grade.getFinalizedAt() == null) {
                grade.setFinalizedAt(LocalDateTime.now());
            }
            log.info("AUDIT: userId={} finalized grade for enrollmentId={} (section={})",
                    userId, enrollment.getId(), enrollment.getSection().getSectionCode());
        }
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

        // BA-02: chốt điểm theo TỪNG lớp học phần — chỉ khoá những section thực sự
        // có yêu cầu finalize, thay vì khoá cả loạt khi bất kỳ dòng nào bật cờ.
        java.util.Set<Long> finalizeSectionIds = requests.stream()
                .filter(r -> Boolean.TRUE.equals(r.getFinalize()))
                .map(r -> enrollmentsById.get(r.getEnrollmentId()))
                .filter(java.util.Objects::nonNull)
                .map(e -> e.getSection().getId())
                .collect(Collectors.toSet());

        // Phase 1: apply component scores + recompute totals (no locking yet).
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
            applyScores(userId, request, enrollment, grade, lecturer);
            toSave.add(grade);
        }

        // Phase 2 (Activity #14): chỉ chốt được khi MỌI sinh viên trong lớp đã có
        // điểm tổng kết. Kiểm tra đủ 100% trước khi khoá bảng điểm.
        if (!finalizeSectionIds.isEmpty()) {
            for (Long sectionId : finalizeSectionIds) {
                verifyAllStudentsGraded(sectionId, gradesByEnrollmentId);
            }
            LocalDateTime now = LocalDateTime.now();
            toSave.stream()
                    .filter(g -> finalizeSectionIds.contains(g.getEnrollment().getSection().getId()))
                    .forEach(g -> {
                        g.setIsFinalized(true);
                        // Mốc ân hạn chỉ đặt ở lần chốt đầu; chốt lại không gia hạn.
                        if (g.getFinalizedAt() == null) {
                            g.setFinalizedAt(now);
                        }
                    });
            log.info("AUDIT: userId={} finalized grade sheet for sectionIds={}", userId, finalizeSectionIds);
        }

        gradeRepository.saveAll(toSave);
    }

    /**
     * Apply a grade request's component scores onto a (possibly new) Grade in memory
     * and recompute the total. Enforces BR-07 (lecturer only edits their own sections)
     * and blocks a lecturer from touching an already-finalized grade. Does NOT finalize —
     * locking is handled by the callers after the section-completeness gate. Admin may
     * explicitly reopen (unlock) a finalized grade by sending finalize=false.
     */
    private void applyScores(Long userId, GradeRequest request, Enrollment enrollment,
                             Grade grade, Lecturer lecturer) {
        // BR-07: Check lecturer authorization
        if (lecturer != null) {
            CourseSection section = enrollment.getSection();
            if (!section.getLecturer().getId().equals(lecturer.getId())) {
                throw new BadRequestException("Bạn không có quyền nhập điểm cho học phần này");
            }
        }

        // Sau khi chốt, giảng viên VẪN sửa được trong cửa sổ ân hạn (EDIT_GRACE_DAYS
        // ngày). Hết hạn thì khoá cứng — chỉ Quản trị viên mở lại được. Admin không bị chặn.
        if (lecturer != null && grade.isEditWindowExpired()) {
            throw new BadRequestException("Đã quá " + Grade.EDIT_GRACE_DAYS
                    + " ngày kể từ khi chốt nên bảng điểm đã khoá, không thể sửa. "
                    + "Vui lòng liên hệ Quản trị viên để mở lại.");
        }

        if (request.getCc1Score() != null) {
            grade.setCc1Score(request.getCc1Score());
        }
        if (request.getCc2Score() != null) {
            grade.setCc2Score(request.getCc2Score());
        }
        if (request.getMidtermScore() != null) {
            grade.setMidtermScore(request.getMidtermScore());
        }
        if (request.getFinalScore() != null) {
            grade.setFinalScore(request.getFinalScore());
        }

        if (request.getSpecialGrade() != null) {
            grade.setSpecialGrade(request.getSpecialGrade());
        }

        // Auto-calculate total score
        grade.calculateTotalScore();

        if (grade.getSpecialGrade() != null) {
            switch (grade.getSpecialGrade()) {
                case V -> {
                    grade.setTotalScore(java.math.BigDecimal.ZERO);
                    grade.setLetterGrade("F");
                    grade.setGpaPoint(java.math.BigDecimal.ZERO);
                }
                case I -> {
                    grade.setTotalScore(null);
                    grade.setLetterGrade(null);
                    grade.setGpaPoint(null);
                }
                case M -> {
                    grade.setTotalScore(null);
                    grade.setLetterGrade("M");
                    grade.setGpaPoint(null);
                }
                case NONE -> {
                    // Numeric component scores remain authoritative.
                }
            }
        }

        // Admin can explicitly unfinalize / unlock a grade. Xoá luôn mốc ân hạn để
        // lần chốt sau bắt đầu một cửa sổ 7 ngày mới.
        if (lecturer == null && Boolean.FALSE.equals(request.getFinalize())) {
            grade.setIsFinalized(false);
            grade.setFinalizedAt(null);
            log.info("AUDIT: adminUserId={} unlocked grade for enrollmentId={}", userId, enrollment.getId());
        }
    }

    /**
     * Activity #14 precondition: every non-cancelled enrollment in the section must
     * already have a complete total score before the sheet can be finalized. Grades
     * modified in the current transaction are read from {@code pending}; the rest are
     * loaded from the database. Throws if any student is still ungraded.
     */
    private void verifyAllStudentsGraded(Long sectionId, Map<Long, Grade> pending) {
        List<Enrollment> active = enrollmentRepository.findActiveBySectionId(sectionId);
        List<String> ungraded = new ArrayList<>();
        for (Enrollment e : active) {
            Grade g = pending.get(e.getId());
            if (g == null) {
                g = gradeRepository.findByEnrollmentId(e.getId()).orElse(null);
            }
            if (g == null || (g.getTotalScore() == null && g.getSpecialGrade() == Grade.SpecialGrade.NONE)) {
                ungraded.add(e.getStudent().getStudentCode());
            }
        }
        if (!ungraded.isEmpty()) {
            throw new BadRequestException(
                    "Không thể chốt điểm: còn " + ungraded.size() + " sinh viên chưa nhập đủ điểm ("
                    + String.join(", ", ungraded) + "). Vui lòng hoàn tất nhập điểm cho tất cả "
                    + "sinh viên trước khi chốt & công bố.");
        }
    }
}
