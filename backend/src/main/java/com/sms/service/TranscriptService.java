package com.sms.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.Grade;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.GradeRepository;
import com.sms.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TranscriptService {

    public static String classifyAcademicStanding(BigDecimal gpa) {
        if (gpa == null) return "Chưa xếp loại";
        if (gpa.compareTo(new BigDecimal("3.60")) >= 0) return "Xuất sắc";
        if (gpa.compareTo(new BigDecimal("3.20")) >= 0) return "Giỏi";
        if (gpa.compareTo(new BigDecimal("2.50")) >= 0) return "Khá";
        if (gpa.compareTo(new BigDecimal("2.00")) >= 0) return "Trung bình";
        if (gpa.compareTo(new BigDecimal("1.00")) >= 0) return "Yếu";
        return "Kém";
    }

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
                        .enrollmentId(grade.getEnrollment().getId())
                        .finalizedAt(grade.getFinalizedAt())
                        .subjectCode(subject.getSubjectCode())
                        .subjectName(subject.getSubjectName())
                        .credits(credits)
                        .cc1Score(grade.getCc1Score())
                        .cc2Score(grade.getCc2Score())
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
                    .semesterClassification(classifyAcademicStanding(semesterGpa))
                    .isSemesterWarning(isSemesterWarning(semesterGpa))
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
            // Tín chỉ tích luỹ tính từ D (1.0/4.0) trở lên; F vẫn không đạt.
            if (grade.getGpaPoint().compareTo(new BigDecimal("1.0")) >= 0) {
                totalCredits += credits;
                completedCourses++;
            }
        }

        BigDecimal cumulativeGpa = gpaCredits > 0
                ? cpaWeighted.divide(BigDecimal.valueOf(gpaCredits), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int warningLevel = calculateWarningLevel(semesterGrades, cumulativeGpa);
        String warningNotice = warningLevel > 0
                ? buildWarningNotice(semesterGrades.get(semesterGrades.size() - 1), warningLevel, cumulativeGpa)
                : null;

        return TranscriptResponse.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .className(student.getClassEntity() != null ? student.getClassEntity().getName() : "Chưa xếp lớp")
                .cumulativeGpa(cumulativeGpa)
                .academicStanding(classifyAcademicStanding(cumulativeGpa))
                .warningLevel(warningLevel)
                .warningNotice(warningNotice)
                .totalCredits(totalCredits)
                .completedCourses(completedCourses)
                .semesters(semesterGrades)
                .build();
    }

    private static boolean isSemesterWarning(BigDecimal semesterGpa) {
        return semesterGpa != null && semesterGpa.compareTo(BigDecimal.ONE) < 0;
    }

    private static int calculateWarningLevel(List<TranscriptResponse.SemesterGrade> semesters,
                                             BigDecimal cumulativeGpa) {
        if (semesters.isEmpty()) return 0;
        int consecutiveWarnings = 0;
        for (int index = semesters.size() - 1; index >= 0; index--) {
            TranscriptResponse.SemesterGrade semester = semesters.get(index);
            if (!Boolean.TRUE.equals(semester.isSemesterWarning())) break;
            consecutiveWarnings++;
        }
        // CPA < 2.0 is applicable from the second recorded semester onward.
        boolean cpaWarning = semesters.size() >= 2
                && cumulativeGpa != null
                && cumulativeGpa.compareTo(new BigDecimal("2.00")) < 0;
        if (cpaWarning) {
            consecutiveWarnings = Math.max(consecutiveWarnings, 1);
        }
        return Math.min(consecutiveWarnings, 3);
    }

    private static String buildWarningNotice(TranscriptResponse.SemesterGrade semester,
                                             int level, BigDecimal cumulativeGpa) {
        boolean lowSemesterGpa = semester.getSemesterGpa() != null
                && semester.getSemesterGpa().compareTo(BigDecimal.ONE) < 0;
        boolean lowCpa = cumulativeGpa != null && cumulativeGpa.compareTo(new BigDecimal("2.00")) < 0;
        String reason = lowSemesterGpa && lowCpa
                ? "GPA học kỳ < 1.0 và CPA tích lũy < 2.0"
                : lowSemesterGpa ? "GPA học kỳ < 1.0" : "CPA tích lũy < 2.0 từ học kỳ thứ 2";
        return "Cảnh báo học vụ mức " + level + " do " + reason;
    }
}
