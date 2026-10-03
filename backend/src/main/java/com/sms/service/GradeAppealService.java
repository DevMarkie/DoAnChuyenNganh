package com.sms.service;

import com.sms.dto.request.GradeAppealRequest;
import com.sms.dto.request.GradeAppealReviewRequest;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeAppealService {
    private final GradeAppealRepository appealRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final GradeRepository gradeRepository;
    private final UserRepository userRepository;
    private final LecturerRepository lecturerRepository;

    public List<GradeAppeal> findMine(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        return appealRepository.findByStudentIdWithDetails(student.getId());
    }

    public List<GradeAppeal> findAll(Long requesterUserId, Long sectionId,
                                     GradeAppeal.AppealStatus status, Integer semesterId) {
        Lecturer lecturer = lecturerRepository.findByUserId(requesterUserId).orElse(null);
        return appealRepository.findAllWithDetails().stream()
                .filter(a -> lecturer == null
                        || (a.getEnrollment().getSection().getLecturer() != null
                        && lecturer.getId().equals(a.getEnrollment().getSection().getLecturer().getId())))
                .filter(a -> sectionId == null || sectionId.equals(a.getEnrollment().getSection().getId()))
                .filter(a -> status == null || status == a.getStatus())
                .filter(a -> semesterId == null || semesterId.equals(a.getEnrollment().getSection().getSemester().getId()))
                .toList();
    }

    @Transactional
    public GradeAppeal create(Long userId, GradeAppealRequest request) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký học phần"));
        if (!student.getId().equals(enrollment.getStudent().getId())) {
            throw new BadRequestException("Bạn không có quyền gửi phúc khảo cho đăng ký này");
        }

        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElseThrow(() -> new BadRequestException("Học phần chưa có bảng điểm để phúc khảo"));
        if (!Boolean.TRUE.equals(grade.getIsFinalized())) {
            throw new BadRequestException("Chỉ được phúc khảo học phần đã chốt điểm");
        }
        if (grade.isEditWindowExpired()) {
            throw new BadRequestException("Đã quá thời hạn phúc khảo kể từ khi chốt điểm");
        }
        BigDecimal currentScore = readScore(grade, request.getScoreComponent());
        if (currentScore == null) {
            throw new BadRequestException("Cột điểm được chọn chưa có điểm để phúc khảo");
        }
        if (appealRepository.countByStudentIdAndEnrollmentSectionSubjectIdAndStatus(
                student.getId(), enrollment.getSection().getSubject().getId(), GradeAppeal.AppealStatus.PENDING) > 0) {
            throw new BadRequestException("Bạn đã có đơn phúc khảo đang chờ xử lý cho học phần này");
        }

        GradeAppeal appeal = new GradeAppeal();
        appeal.setEnrollment(enrollment);
        appeal.setStudent(student);
        appeal.setScoreComponent(request.getScoreComponent());
        appeal.setCurrentScore(currentScore);
        appeal.setDesiredScore(request.getDesiredScore());
        appeal.setReason(request.getReason().trim());
        appeal.setStatus(GradeAppeal.AppealStatus.PENDING);
        return appealRepository.save(appeal);
    }

    @Transactional
    public GradeAppeal review(Long reviewerUserId, Long appealId, GradeAppealReviewRequest request) {
        GradeAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn phúc khảo"));
        if (appeal.getStatus() != GradeAppeal.AppealStatus.PENDING
                && appeal.getStatus() != GradeAppeal.AppealStatus.IN_REVIEW) {
            throw new BadRequestException("Đơn phúc khảo này đã được xử lý");
        }

        Lecturer lecturer = lecturerRepository.findByUserId(reviewerUserId).orElse(null);
        if (lecturer != null) {
            var sectionLecturer = appeal.getEnrollment().getSection().getLecturer();
            if (sectionLecturer == null || !lecturer.getId().equals(sectionLecturer.getId())) {
                throw new BadRequestException("Bạn không phụ trách học phần của đơn phúc khảo này");
            }
        }
        User reviewer = userRepository.findById(reviewerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người xử lý"));

        if (request.getStatus() == GradeAppeal.AppealStatus.REJECTED
                && (request.getReviewNotes() == null || request.getReviewNotes().isBlank())) {
            throw new BadRequestException("Bắt buộc nhập lý do từ chối");
        }
        if (request.getStatus() == GradeAppeal.AppealStatus.APPROVED && request.getNewScore() == null) {
            throw new BadRequestException("Bắt buộc nhập điểm mới khi chấp thuận");
        }
        if (request.getStatus() != GradeAppeal.AppealStatus.APPROVED
                && request.getStatus() != GradeAppeal.AppealStatus.REJECTED) {
            throw new BadRequestException("Trạng thái xử lý không hợp lệ");
        }

        appeal.setReviewer(reviewer);
        appeal.setReviewNotes(request.getReviewNotes());
        appeal.setReviewedAt(LocalDateTime.now());
        appeal.setStatus(request.getStatus());
        if (request.getStatus() == GradeAppeal.AppealStatus.APPROVED) {
            Grade grade = gradeRepository.findByEnrollmentId(appeal.getEnrollment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng điểm"));
            applyNewScore(grade, appeal.getScoreComponent(), request.getNewScore());
            appeal.setNewScore(request.getNewScore());
            gradeRepository.save(grade);
        }
        return appealRepository.save(appeal);
    }

    private BigDecimal readScore(Grade grade, GradeAppeal.ScoreComponent component) {
        return switch (component) {
            case CC2 -> grade.getCc2Score();
            case MIDTERM -> grade.getMidtermScore();
            case FINAL -> grade.getFinalScore();
            case ALL -> grade.getTotalScore();
        };
    }

    private void applyNewScore(Grade grade, GradeAppeal.ScoreComponent component, BigDecimal newScore) {
        // ALL is represented by the final exam score because the final component
        // drives the published total score and is the only single score accepted
        // by the review contract.
        switch (component) {
            case CC2 -> grade.setCc2Score(newScore);
            case MIDTERM -> grade.setMidtermScore(newScore);
            case FINAL, ALL -> grade.setFinalScore(newScore);
        }
        grade.calculateTotalScore();
    }
}
