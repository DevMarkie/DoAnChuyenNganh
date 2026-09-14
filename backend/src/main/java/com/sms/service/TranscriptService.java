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
        BigDecimal totalWeightedGpa = BigDecimal.ZERO;
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

                if (grade.getGpaPoint() != null) {
                    semWeightedGpa = semWeightedGpa.add(
                            grade.getGpaPoint().multiply(BigDecimal.valueOf(credits)));
                    semCredits += credits;
                    completedCourses++;
                }
            }

            BigDecimal semesterGpa = semCredits > 0
                    ? semWeightedGpa.divide(BigDecimal.valueOf(semCredits), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            totalWeightedGpa = totalWeightedGpa.add(semWeightedGpa);
            totalCredits += semCredits;

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

        BigDecimal cumulativeGpa = totalCredits > 0
                ? totalWeightedGpa.divide(BigDecimal.valueOf(totalCredits), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return TranscriptResponse.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .className(student.getClassEntity().getName())
                .cumulativeGpa(cumulativeGpa)
                .totalCredits(totalCredits)
                .completedCourses(completedCourses)
                .semesters(semesterGrades)
                .build();
    }
}
