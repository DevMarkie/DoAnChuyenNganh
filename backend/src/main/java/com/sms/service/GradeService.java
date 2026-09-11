package com.sms.service;

import com.sms.dto.request.GradeRequest;
import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
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

        // BR-07: Check lecturer authorization
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        if (lecturer != null) {
            CourseSection section = enrollment.getSection();
            if (!section.getLecturer().getId().equals(lecturer.getId())) {
                throw new BadRequestException("Bạn không có quyền nhập điểm cho học phần này");
            }
        }

        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElseGet(() -> {
                    Grade g = new Grade();
                    g.setEnrollment(enrollment);
                    return g;
                });

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
        } else if (lecturer == null && Boolean.FALSE.equals(request.getFinalize())) {
            // Admin can explicitly unfinalize / unlock
            grade.setIsFinalized(false);
        }

        return gradeRepository.save(grade);
    }

    /**
     * Nhập điểm hàng loạt cho một học phần
     */
    @Transactional
    public void saveGrades(Long userId, List<GradeRequest> requests) {
        for (GradeRequest request : requests) {
            saveGrade(userId, request);
        }
    }
}
