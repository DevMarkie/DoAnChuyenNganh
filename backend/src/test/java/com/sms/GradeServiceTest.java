package com.sms;

import com.sms.dto.request.GradeRequest;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Lecturer;
import com.sms.exception.BadRequestException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.service.GradeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Locks in the N+1 fix in {@link GradeService#saveGrades}: a bulk save must
 * resolve the lecturer once and batch-load enrollments/grades, then persist in a
 * single saveAll — not run ~4 queries per row via repeated saveGrade calls.
 */
@ExtendWith(MockitoExtension.class)
class GradeServiceTest {

    @Mock private GradeRepository gradeRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private CourseSectionRepository courseSectionRepository;
    @Mock private LecturerRepository lecturerRepository;
    @InjectMocks private GradeService gradeService;

    private static Enrollment enrollment(long id) {
        CourseSection section = new CourseSection();
        section.setId(100 + id);
        section.setSectionCode("SEC" + id);
        Enrollment e = new Enrollment();
        e.setId(id);
        e.setSection(section);
        return e;
    }

    private static GradeRequest req(long enrollmentId) {
        GradeRequest r = new GradeRequest();
        r.setEnrollmentId(enrollmentId);
        r.setCc1Score(new BigDecimal("9.0"));
        r.setCc2Score(new BigDecimal("9.0"));
        r.setMidtermScore(new BigDecimal("8.0"));
        r.setFinalScore(new BigDecimal("7.5"));
        return r;
    }

    @Test
    void saveGrades_resolvesLecturerOnce_batchLoads_andSavesAllInOneCall() {
        long adminUserId = 500L;
        List<GradeRequest> requests = List.of(req(1L), req(2L), req(3L));

        // Admin (no lecturer profile) → BR-07 authorisation is skipped.
        when(lecturerRepository.findByUserId(adminUserId)).thenReturn(Optional.empty());
        when(enrollmentRepository.findByIdInWithSection(anyList()))
                .thenReturn(List.of(enrollment(1L), enrollment(2L), enrollment(3L)));
        when(gradeRepository.findByEnrollmentIdIn(anyList())).thenReturn(List.of()); // all new
        when(gradeRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        gradeService.saveGrades(adminUserId, requests);

        // Lecturer resolved exactly once for the whole batch (was once per row).
        verify(lecturerRepository, times(1)).findByUserId(adminUserId);
        // Batch loads, not per-row lookups.
        verify(enrollmentRepository, times(1)).findByIdInWithSection(anyList());
        verify(gradeRepository, times(1)).findByEnrollmentIdIn(anyList());
        verify(enrollmentRepository, never()).findById(anyLong());
        verify(gradeRepository, never()).findByEnrollmentId(anyLong());

        // Single bulk persist of all three grades.
        ArgumentCaptor<List<Grade>> saved = ArgumentCaptor.forClass(List.class);
        verify(gradeRepository, times(1)).saveAll(saved.capture());
        verify(gradeRepository, never()).save(any());
        assertThat(saved.getValue()).hasSize(3);
    }

    @Test
    void saveGrades_emptyList_isNoOp() {
        gradeService.saveGrades(1L, List.of());

        verify(lecturerRepository, never()).findByUserId(anyLong());
        verify(gradeRepository, never()).saveAll(anyList());
    }

    private static final long LECT_USER = 42L;

    private static Enrollment lecturerEnrollment(long id, Lecturer lecturer) {
        CourseSection section = new CourseSection();
        section.setId(100 + id);
        section.setSectionCode("SEC" + id);
        section.setLecturer(lecturer);
        Enrollment e = new Enrollment();
        e.setId(id);
        e.setSection(section);
        return e;
    }

    private static Grade finalizedGrade(Enrollment e, LocalDateTime finalizedAt) {
        Grade g = new Grade();
        g.setEnrollment(e);
        g.setIsFinalized(true);
        g.setFinalizedAt(finalizedAt);
        return g;
    }

    /** Activity #14: trong 7 ngày kể từ khi chốt, giảng viên vẫn sửa được điểm đã chốt. */
    @Test
    void lecturer_canEditFinalizedGrade_withinGraceWindow() {
        Lecturer lecturer = new Lecturer();
        lecturer.setId(7L);
        Enrollment e = lecturerEnrollment(1L, lecturer);
        Grade existing = finalizedGrade(e, LocalDateTime.now().minusDays(2));

        when(lecturerRepository.findByUserId(LECT_USER)).thenReturn(Optional.of(lecturer));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(e));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(existing));
        when(gradeRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Grade saved = gradeService.saveGrade(LECT_USER, req(1L));

        assertThat(saved.getMidtermScore()).isEqualByComparingTo("8.0");
        verify(gradeRepository, times(1)).save(any());
    }

    /** Quá 7 ngày kể từ khi chốt thì bảng điểm khoá cứng — giảng viên không sửa được nữa. */
    @Test
    void lecturer_cannotEditFinalizedGrade_afterGraceWindow() {
        Lecturer lecturer = new Lecturer();
        lecturer.setId(7L);
        Enrollment e = lecturerEnrollment(1L, lecturer);
        Grade existing = finalizedGrade(e, LocalDateTime.now().minusDays(8));

        when(lecturerRepository.findByUserId(LECT_USER)).thenReturn(Optional.of(lecturer));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(e));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> gradeService.saveGrade(LECT_USER, req(1L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("khoá");

        verify(gradeRepository, never()).save(any());
    }
}
