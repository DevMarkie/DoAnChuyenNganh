package com.sms.service;

import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.*;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TranscriptService {

    private final StudentRepository studentRepository;
    private final GradeRepository gradeRepository;

    /**
     * Lấy bảng điểm tổng hợp của sinh viên
     * BR-08: Sinh viên chỉ được xem kết quả của chính mình
     */
    public TranscriptResponse getTranscript(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        List<Grade> grades = gradeRepository.findFinalizedByStudentId(studentId);

        // Group by semester
        Map<Integer, List<Grade>> bySemester = grades.stream()
                .collect(Collectors.groupingBy(g ->
                        g.getEnrollment().getSection().getSemester().getId()));

        List<TranscriptResponse.SemesterGrade> semesterGrades = new ArrayList<>();
        int totalCredits = 0;
        int completedCourses = 0;

        for (Map.Entry<Integer, List<Grade>> entry : bySemester.entrySet()) {
            List<Grade> semGrades = entry.getValue();
            Semester semester = semGrades.get(0).getEnrollment().getSection().getSemester();

            BigDecimal semWeightedGpa = BigDecimal.ZERO;
            int semCredits = 0;
            List<TranscriptResponse.CourseGrade> courseGrades = new ArrayList<>();

            for (Grade grade : semGrades) {
                Subject subject = grade.getEnrollment().getSection().getSubject();
                int credits = subject.getCredits();

                courseGrades.add(TranscriptResponse.CourseGrade.builder()
                        .subjectCode(subject.getSubjectCode())
                        .subjectName(subject.getSubjectName())
                        .credits(credits)
                        .attendanceScore(grade.getAttendanceScore())
                        .midtermScore(grade.getMidtermScore())
                        .finalScore(grade.getFinalScore())
                        .totalScore(grade.getTotalScore())
                        .letterGrade(grade.getLetterGrade())
                        .gpaPoint(grade.getGpaPoint())
                        .build());

                // Semester GPA includes every graded attempt of that term
                // (an F counts as 0.0 here — that is a correct semester GPA).
                if (grade.getGpaPoint() != null) {
                    semWeightedGpa = semWeightedGpa.add(
                            grade.getGpaPoint().multiply(BigDecimal.valueOf(credits)));
                    semCredits += credits;
                }
            }

            BigDecimal semesterGpa = semCredits > 0
                    ? semWeightedGpa.divide(BigDecimal.valueOf(semCredits), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            semesterGrades.add(TranscriptResponse.SemesterGrade.builder()
                    .semesterId(semester.getId())
                    .semesterName(semester.getSemesterName())
                    .academicYear(semester.getAcademicYear())
                    .semesterGpa(semesterGpa)
                    .semesterCredits(semCredits)
                    .courses(courseGrades)
                    .build());
        }

        // Sort by semester
        semesterGrades.sort(Comparator.comparing(TranscriptResponse.SemesterGrade::getSemesterId));

        // BA-03 — Quy chế học lại: bảng điểm tích luỹ lấy LẦN THI CÓ ĐIỂM CAO NHẤT
        // cho mỗi môn (không phải lần mới nhất), nên học lại luôn có lợi và một lần
        // rớt về sau không làm mất tín chỉ đã đạt. Nếu quy chế trường khác (ví dụ
        // "lấy lần mới nhất"), chỉ cần đổi điều kiện so sánh bên dưới.
        Map<String, Grade> bestBySubject = new LinkedHashMap<>();
        for (Grade grade : grades) {
            if (grade.getGpaPoint() == null) continue;
            Subject subject = grade.getEnrollment().getSection().getSubject();
            Grade current = bestBySubject.get(subject.getSubjectCode());
            if (current == null
                    || grade.getGpaPoint().compareTo(current.getGpaPoint()) > 0) {
                bestBySubject.put(subject.getSubjectCode(), grade);
            }
        }

        BigDecimal cpaWeighted = BigDecimal.ZERO;
        int gpaCredits = 0; // Mẫu số CPA — lần thi tốt nhất; nếu vẫn F thì tính 0.0
        for (Grade grade : bestBySubject.values()) {
            int credits = grade.getEnrollment().getSection().getSubject().getCredits();
            cpaWeighted = cpaWeighted.add(grade.getGpaPoint().multiply(BigDecimal.valueOf(credits)));
            gpaCredits += credits;
            // Tín chỉ tích luỹ chỉ tính học phần ĐẠT. Theo quy chế học lại, D (1.0) và
            // F (0.0) đều trượt, nên chỉ cộng khi đạt tối thiểu D+ (gpaPoint >= 1.5).
            if (grade.getGpaPoint().compareTo(new BigDecimal("1.5")) >= 0) {
                totalCredits += credits;
                completedCourses++;
            }
        }

        BigDecimal cumulativeGpa = gpaCredits > 0
                ? cpaWeighted.divide(BigDecimal.valueOf(gpaCredits), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return TranscriptResponse.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .className(student.getClassEntity() != null ? student.getClassEntity().getName() : "Chưa xếp lớp")
                .cumulativeGpa(cumulativeGpa)
                .totalCredits(totalCredits)
                .completedCourses(completedCourses)
                .semesters(semesterGrades)
                .build();
    }
}
