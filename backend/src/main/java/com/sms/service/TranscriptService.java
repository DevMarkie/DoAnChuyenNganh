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
import com.sms.entity.Department;
import com.sms.entity.Grade;
import com.sms.entity.Lecturer;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
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
    private final LecturerRepository lecturerRepository;

    /**
     * Lấy bảng điểm tổng hợp của sinh viên
     * BR-08: Sinh viên chỉ được xem kết quả của chính mình
     */
    public TranscriptResponse getTranscript(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        return buildTranscript(student, gradeRepository.findFinalizedByStudentId(studentId));
    }

    /** Bảng điểm cho nhiều SV trong 2 truy vấn thay vì N+1 (màn cảnh báo học vụ). */
    public List<TranscriptResponse> getTranscripts(List<Student> students) {
        if (students.isEmpty()) return List.of();
        Map<Long, List<Grade>> byStudent = gradeRepository
                .findFinalizedByStudentIdIn(students.stream().map(Student::getId).toList()).stream()
                .collect(Collectors.groupingBy(g -> g.getEnrollment().getStudent().getId()));
        return students.stream()
                .map(s -> buildTranscript(s, byStudent.getOrDefault(s.getId(), List.of())))
                .toList();
    }

    private TranscriptResponse buildTranscript(Student student, List<Grade> grades) {
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

            // Kỳ không có tín chỉ tính điểm -> GPA null (chưa xếp loại), KHÔNG phải 0.0,
            // tránh cảnh báo học vụ nhầm cho kỳ chưa có điểm (isSemesterWarning null-safe).
            BigDecimal semesterGpa = semCredits > 0
                    ? semWeightedGpa.divide(BigDecimal.valueOf(semCredits), 2, RoundingMode.HALF_UP)
                    : null;

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
                .advisorContact(buildAdvisorContact(student, warningLevel))
                .build();
    }

    public TranscriptResponse.AdvisorContact buildAdvisorContact(Student student, int warningLevel) {
        Lecturer advisor = null;
        Department dept = null;

        if (student != null && student.getClassEntity() != null) {
            dept = student.getClassEntity().getDepartment();
            advisor = student.getClassEntity().getAdvisor();
        }

        // Fallback: Nếu lớp chưa gán advisor, lấy giảng viên đang hoạt động trong Khoa
        if (advisor == null && dept != null && lecturerRepository != null) {
            List<Lecturer> deptLecturers = lecturerRepository.findByDepartmentId(dept.getId());
            if (deptLecturers != null) {
                advisor = deptLecturers.stream()
                        .filter(l -> Boolean.TRUE.equals(l.getIsActive()))
                        .findFirst()
                        .orElse(null);
            }
        }

        // Fallback: Nếu vẫn chưa có, lấy giảng viên đang hoạt động bất kỳ
        if (advisor == null && lecturerRepository != null) {
            List<Lecturer> activeLecturers = lecturerRepository.findByIsActiveTrue();
            if (activeLecturers != null && !activeLecturers.isEmpty()) {
                advisor = activeLecturers.get(0);
            }
        }

        String advisorName = advisor != null ? advisor.getFullName() : "TS. Nguyễn Hoàng Long";
        String advisorCode = advisor != null ? advisor.getLecturerCode() : "1000001";
        String advisorEmail = advisor != null ? advisor.getEmail() : "1000001@sms.edu.vn";
        String advisorPhone = (advisor != null && advisor.getPhone() != null) ? advisor.getPhone() : "0912345001";
        String advisorDegree = (advisor != null && advisor.getDegree() != null) ? advisor.getDegree() : "TS";
        String specialization = (advisor != null && advisor.getSpecialization() != null)
                ? advisor.getSpecialization()
                : "Cố vấn học tập & Quản lý sinh viên";
        String consultationHours = "Thứ 2 & Thứ 4 (14h00 - 16h30)";
        String advisorOffice = "Phòng 402 - Tòa nhà A1";

        String deptCode = (dept != null && dept.getCode() != null) ? dept.getCode().toUpperCase() : "CNTT";
        String deptName;
        String assistantName;
        String assistantEmail;
        String assistantPhone;
        String departmentOffice;

        switch (deptCode) {
            case "KT_QTKD":
                deptName = "Khoa Kinh tế & Quản trị Kinh doanh";
                assistantName = "ThS. Phạm Thị Lan (Trợ lý Giáo vụ)";
                assistantEmail = "vpk.ktqtkd@sms.edu.vn";
                assistantPhone = "(024) 3754 7502";
                departmentOffice = "Văn phòng Khoa KT&QTKD - P.405 Tòa nhà B";
                break;
            case "KT_TDH":
                deptName = "Khoa Kỹ thuật & Công nghệ Tự động";
                assistantName = "KS. Lê Đình Quân (Trợ lý Giáo vụ)";
                assistantEmail = "vpk.kttdh@sms.edu.vn";
                assistantPhone = "(024) 3754 7503";
                departmentOffice = "Văn phòng Khoa TĐH - P.201 Tòa nhà C";
                break;
            case "COKHI":
                deptName = "Khoa Cơ khí & Công nghệ Ô tô";
                assistantName = "ThS. Vũ Văn Minh (Trợ lý Giáo vụ)";
                assistantEmail = "vpk.cokhi@sms.edu.vn";
                assistantPhone = "(024) 3754 7504";
                departmentOffice = "Văn phòng Khoa Cơ khí - P.305 Tòa nhà C";
                break;
            case "NN":
                deptName = "Khoa Ngoại ngữ";
                assistantName = "ThS. Đỗ Thu Thảo (Trợ lý Giáo vụ)";
                assistantEmail = "vpk.ngoaingu@sms.edu.vn";
                assistantPhone = "(024) 3754 7505";
                departmentOffice = "Văn phòng Khoa Ngoại ngữ - P.502 Tòa nhà A2";
                break;
            case "CNTT":
            default:
                deptName = (dept != null && dept.getName() != null) ? dept.getName() : "Khoa Công nghệ Thông tin & Máy tính";
                assistantName = "ThS. Hoàng Văn Nam (Trợ lý Giáo vụ)";
                assistantEmail = "vpk.cntt@sms.edu.vn";
                assistantPhone = "(024) 3754 7501";
                departmentOffice = "Văn phòng Khoa CNTT - P.302 Tòa nhà A1";
                break;
        }

        String supportNotes = warningLevel > 0
                ? "Sinh viên đang thuộc diện Cảnh báo học vụ Mức " + warningLevel
                  + ". Hãy chủ động liên hệ Cố vấn học tập và Trợ lý Khoa trước hạn chót điều chỉnh học phần để nhận hướng dẫn xây dựng lộ trình cải thiện điểm số."
                : "Vui lòng liên hệ Cố vấn học tập hoặc Trợ lý khoa khi cần hỗ trợ về tiến độ và kết quả học tập.";

        return TranscriptResponse.AdvisorContact.builder()
                .advisorName(advisorName)
                .advisorCode(advisorCode)
                .advisorEmail(advisorEmail)
                .advisorPhone(advisorPhone)
                .advisorDegree(advisorDegree)
                .specialization(specialization)
                .consultationHours(consultationHours)
                .advisorOffice(advisorOffice)
                .departmentName(deptName)
                .departmentCode(deptCode)
                .assistantName(assistantName)
                .assistantEmail(assistantEmail)
                .assistantPhone(assistantPhone)
                .departmentOffice(departmentOffice)
                .studentSupportNotes(supportNotes)
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
