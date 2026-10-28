package com.sms.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.sms.entity.Cohort;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Enrollment.AttendanceStatus;
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
    private final TuitionService tuitionService;
    private final SystemConfigService systemConfigService;

    /**
     * Lấy bảng điểm tổng hợp của sinh viên
     * BR-08: Sinh viên chỉ được xem kết quả của chính mình
     */
    public TranscriptResponse getTranscript(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        TranscriptResponse response = buildTranscript(student, gradeRepository.findAllByStudentId(studentId));

        // BR-Tuition & Quy tắc liên thông B: Nếu sinh viên bị FINANCIAL_HOLD hoặc nợ học phí quá hạn quy định: không hiển thị bảng điểm thi kết thúc học kỳ
        if (student.isFinancialHold() || (tuitionService != null && tuitionService.isTuitionOverdue(studentId))) {
            response.setIsLockedDueToTuition(true);
            response.setLockReason("Bảng điểm kết thúc học kỳ bị tạm khóa (FINANCIAL HOLD) do sinh viên chưa hoàn thành nghĩa vụ học phí. Vui lòng liên hệ Phòng Kế hoạch - Tài chính để mở khóa tra cứu.");
            if (response.getSemesters() != null) {
                for (TranscriptResponse.SemesterGrade sem : response.getSemesters()) {
                    sem.setSemesterGpa(null);
                    sem.setSemesterClassification("Tạm khóa do nợ học phí");
                    if (sem.getCourses() != null) {
                        for (TranscriptResponse.CourseGrade course : sem.getCourses()) {
                            course.setFinalScore(null);
                            course.setTotalScore(null);
                            course.setLetterGrade("Đã khóa");
                            course.setGpaPoint(null);
                            course.setStatus("LOCKED_DEBT");
                        }
                    }
                }
            }
            response.setCumulativeGpa(null);
            response.setAcademicStanding("Tạm khóa do nợ học phí");
        }
        return response;
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
                CourseSection section = grade.getEnrollment().getSection();
                int credits = subject.getCredits();
                boolean isFinalized = Boolean.TRUE.equals(grade.getIsFinalized());
                LocalDateTime pubAt = section.getPublishedAt() != null ? section.getPublishedAt() : grade.getFinalizedAt();
                boolean appealWindowValid = isFinalized && pubAt != null && pubAt.plusDays(7).isAfter(LocalDateTime.now());

                courseGrades.add(TranscriptResponse.CourseGrade.builder()
                        .enrollmentId(grade.getEnrollment().getId())
                        .sectionId(section != null ? section.getId() : null)
                        .sectionCode(section != null ? section.getSectionCode() : null)
                        .finalizedAt(isFinalized ? grade.getFinalizedAt() : null)
                        .publishedAt(pubAt)
                        .canAppeal(appealWindowValid)
                        .subjectCode(subject.getSubjectCode())
                        .subjectName(subject.getSubjectName())
                        .credits(credits)
                        .cc1Score(grade.getCc1Score())
                        .cc2Score(grade.getCc2Score())
                        .midtermScore(grade.getMidtermScore())
                        .finalScore(isFinalized ? grade.getFinalScore() : null)
                        .totalScore(isFinalized ? grade.getTotalScore() : null)
                        .letterGrade(isFinalized ? grade.getLetterGrade() : "Đang học / Chưa công bố")
                        .gpaPoint(isFinalized ? grade.getGpaPoint() : null)
                        .isFinalized(isFinalized)
                        .status(isFinalized ? "PUBLISHED" : "IN_PROGRESS")
                        .attendanceStatus(grade.getEnrollment() != null && grade.getEnrollment().getAttendanceStatus() != null ? grade.getEnrollment().getAttendanceStatus().name() : "QUALIFIED")
                        .isDisqualified(grade.getEnrollment() != null && grade.getEnrollment().getAttendanceStatus() == AttendanceStatus.DISQUALIFIED)
                        .build());

                if (isFinalized && grade.getGpaPoint() != null) {
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

            boolean isFirst = (semesterGrades.isEmpty());
            boolean isWarning = isSemesterWarning(semesterGpa, isFirst);

            semesterGrades.add(TranscriptResponse.SemesterGrade.builder()
                    .semesterId(semester.getId())
                    .semesterName(semester.getSemesterName())
                    .academicYear(semester.getAcademicYear())
                    .semesterNumber(semester.getSemesterNumber())
                    .semesterGpa(semesterGpa)
                    .semesterClassification(classifyAcademicStanding(semesterGpa))
                    .isSemesterWarning(isWarning)
                    .semesterCredits(semCredits)
                    .courses(courseGrades)
                    .build());
        }

        // Sort by semester
        semesterGrades.sort(Comparator.comparing(TranscriptResponse.SemesterGrade::getSemesterId));

        // BR-Grade04 — Khử trùng lặp khi tính CPA:
        // Cấu hình qua system_configs: HIGHEST_SCORE (mặc định) hoặc LATEST_ATTEMPT (lần thi gần nhất)
        String deduplicationStrategy = "HIGHEST_SCORE";
        if (systemConfigService != null) {
            deduplicationStrategy = systemConfigService.getValue("cpa_deduplication_strategy", "HIGHEST_SCORE");
        }
        boolean isLatestAttempt = "LATEST_ATTEMPT".equalsIgnoreCase(deduplicationStrategy);

        Map<String, Grade> bestBySubject = new LinkedHashMap<>();
        for (Grade grade : grades) {
            // BA-03 & Security: Chỉ tính điểm đã chính thức chốt/khóa sổ (isFinalized=true)
            // vào điểm tích lũy CPA và tín chỉ tích luỹ; không để điểm nháp rò rỉ.
            if (!Boolean.TRUE.equals(grade.getIsFinalized())) continue;
            if (grade.getGpaPoint() == null) continue;
            Subject subject = grade.getEnrollment().getSection().getSubject();
            Grade current = bestBySubject.get(subject.getSubjectCode());
            if (current == null) {
                bestBySubject.put(subject.getSubjectCode(), grade);
            } else if (isLatestAttempt) {
                Integer currentSemId = current.getEnrollment().getSection().getSemester().getId();
                Integer gradeSemId = grade.getEnrollment().getSection().getSemester().getId();
                if (gradeSemId >= currentSemId) {
                    bestBySubject.put(subject.getSubjectCode(), grade);
                }
            } else {
                if (grade.getGpaPoint().compareTo(current.getGpaPoint()) > 0) {
                    bestBySubject.put(subject.getSubjectCode(), grade);
                }
            }
        }

        BigDecimal cpaWeighted = BigDecimal.ZERO;
        int gpaCredits = 0; // Mẫu số CPA — chỉ tính các môn ĐẠT (>= 1.0) theo chuẩn tín chỉ
        int debtCredits = 0; // Tổng tín chỉ nợ trượt chưa trả

        for (Grade grade : bestBySubject.values()) {
            int credits = grade.getEnrollment().getSection().getSubject().getCredits();
            // Quy tắc nghiệp vụ Mục 5: Điểm tích lũy CPA chỉ tính trên các môn đạt hoặc các môn lấy điểm cao nhất khi học cải thiện
            if (grade.getGpaPoint().compareTo(new BigDecimal("1.0")) >= 0) {
                cpaWeighted = cpaWeighted.add(grade.getGpaPoint().multiply(BigDecimal.valueOf(credits)));
                gpaCredits += credits;
                totalCredits += credits;
                completedCourses++;
            } else {
                // Điểm cao nhất của môn vẫn < 1.0 (tức F / trượt) -> tính vào tổng nợ tín chỉ
                debtCredits += credits;
            }
        }

        BigDecimal cumulativeGpa = gpaCredits > 0
                ? cpaWeighted.divide(BigDecimal.valueOf(gpaCredits), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int warningLevel = calculateWarningLevel(student, semesterGrades, cumulativeGpa, debtCredits);
        TranscriptResponse.SemesterGrade latestCompletedSemester = semesterGrades.stream()
                .filter(s -> s.getSemesterGpa() != null)
                .reduce((first, second) -> second)
                .orElse(semesterGrades.isEmpty() ? null : semesterGrades.get(semesterGrades.size() - 1));

        String warningNotice = warningLevel > 0
                ? buildWarningNotice(student, latestCompletedSemester, warningLevel, cumulativeGpa, debtCredits)
                : null;

        int maxAllowedCredits = switch (warningLevel) {
            case 3 -> 0; // Buộc thôi học / Khóa học vụ
            case 2 -> 10; // Cảnh báo mức 2: tối đa 10 TC
            case 1 -> 14; // Cảnh báo mức 1: tối đa 14 TC
            default -> 24; // Bình thường: tối đa 24 TC
        };

        return TranscriptResponse.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .className(student.getClassEntity() != null ? student.getClassEntity().getName() : "Chưa xếp lớp")
                .cumulativeGpa(cumulativeGpa)
                .academicStanding(classifyAcademicStanding(cumulativeGpa))
                .warningLevel(warningLevel)
                .warningNotice(warningNotice)
                .maxAllowedCredits(maxAllowedCredits)
                .totalCredits(totalCredits)
                .completedCourses(completedCourses)
                .debtCredits(debtCredits)
                .isLockedDueToTuition(false)
                .lockReason(null)
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

    public static boolean isSemesterWarning(BigDecimal semesterGpa, boolean isFirstSemester) {
        if (semesterGpa == null) return false;
        if (isFirstSemester) {
            return semesterGpa.compareTo(BigDecimal.ONE) < 0;
        } else {
            return semesterGpa.compareTo(new BigDecimal("1.20")) < 0;
        }
    }

    public static boolean isExceededMaxDuration(Student student) {
        if (student == null || student.getClassEntity() == null) return false;
        Integer admissionYear = null;
        int standardYears = 4;

        if (student.getClassEntity().getCohort() != null) {
            Cohort cohort = student.getClassEntity().getCohort();
            admissionYear = cohort.getAdmissionYear();
            if (cohort.getGraduationYear() != null && cohort.getGraduationYear() > admissionYear) {
                standardYears = cohort.getGraduationYear() - admissionYear;
            }
        } else if (student.getClassEntity().getAcademicYear() != null) {
            try {
                String acYear = student.getClassEntity().getAcademicYear();
                String firstPart = acYear.split("[-_]")[0].trim();
                admissionYear = Integer.parseInt(firstPart);
            } catch (Exception ignored) {}
        }

        if (admissionYear != null) {
            int maxYear = admissionYear + standardYears + 2;
            int currentYear = LocalDate.now().getYear();
            return currentYear > maxYear;
        }
        return false;
    }

    /**
     * Quy tắc nghiệp vụ Cảnh báo học vụ (Mục 5):
     * - Mức 1: Điểm trung bình học kỳ < 1.0 (kỳ đầu) hoặc < 1.2 (kỳ hai trở đi), hoặc nợ quá 24 tín chỉ.
     * - Mức 2: Bị cảnh báo mức 1 liên tiếp 2 học kỳ chính.
     * - Buộc thôi học (Mức 3): Bị cảnh báo mức 2 không tiến bộ hoặc vượt quá thời gian đào tạo tối đa (N + 2 năm tùy ngành).
     */
    public static int calculateWarningLevel(Student student,
                                            List<TranscriptResponse.SemesterGrade> semesters,
                                            BigDecimal cumulativeGpa,
                                            int debtCredits) {
        if (isExceededMaxDuration(student)) {
            return 3;
        }

        // Lọc các học kỳ chính (semesterNumber == 1 hoặc 2, bỏ qua hè) đã có điểm
        List<TranscriptResponse.SemesterGrade> mainSemesters = semesters.stream()
                .filter(s -> s.getSemesterGpa() != null)
                .filter(s -> s.getSemesterNumber() == null || s.getSemesterNumber() == 1 || s.getSemesterNumber() == 2)
                .toList();

        if (mainSemesters.isEmpty()) {
            return debtCredits > 24 ? 1 : 0;
        }

        int consecutiveMainWarnings = 0;
        for (int i = 0; i < mainSemesters.size(); i++) {
            TranscriptResponse.SemesterGrade sem = mainSemesters.get(i);
            BigDecimal gpa = sem.getSemesterGpa();
            boolean isFirst = (i == 0);
            boolean isLowGpa = (isFirst && gpa.compareTo(BigDecimal.ONE) < 0)
                    || (!isFirst && gpa.compareTo(new BigDecimal("1.20")) < 0);

            if (isLowGpa) {
                consecutiveMainWarnings++;
            } else {
                consecutiveMainWarnings = 0;
            }
        }

        boolean debtWarning = debtCredits > 24;

        if (consecutiveMainWarnings >= 3) {
            return 3; // Mức 2 tiếp tục không tiến bộ -> Buộc thôi học
        } else if (consecutiveMainWarnings == 2) {
            return 2; // Cảnh báo mức 1 liên tiếp 2 kỳ chính
        } else if (consecutiveMainWarnings == 1 || debtWarning) {
            return 1;
        }

        return 0;
    }

    public static String buildWarningNotice(Student student,
                                            TranscriptResponse.SemesterGrade semester,
                                            int level, BigDecimal cumulativeGpa, int debtCredits) {
        if (isExceededMaxDuration(student)) {
            return "Buộc thôi học: Đã vượt quá thời gian đào tạo tối đa (N + 2 năm theo quy chế)";
        }
        if (level == 3) {
            return "Buộc thôi học: Bị cảnh báo học vụ Mức 2 không tiến bộ trong các học kỳ chính liên tiếp";
        }
        if (level == 2) {
            return "Cảnh báo học vụ Mức 2: Bị cảnh báo Mức 1 trong 2 học kỳ chính liên tiếp";
        }
        if (level == 1) {
            List<String> reasons = new ArrayList<>();
            if (semester != null && semester.getSemesterGpa() != null) {
                boolean isFirstSem = (semester.getSemesterNumber() != null && semester.getSemesterNumber() == 1);
                if (semester.getSemesterGpa().compareTo(BigDecimal.ONE) < 0) {
                    reasons.add("GPA học kỳ < 1.0 (" + semester.getSemesterGpa() + ")");
                } else if (semester.getSemesterGpa().compareTo(new BigDecimal("1.20")) < 0) {
                    reasons.add("GPA học kỳ < 1.2 (" + semester.getSemesterGpa() + ")");
                }
            }
            if (debtCredits > 24) {
                reasons.add("Nợ quá 24 tín chỉ học phần (hiện nợ " + debtCredits + " TC)");
            }
            if (reasons.isEmpty()) {
                reasons.add("Kết quả học tập dưới chuẩn quy chế đào tạo tín chỉ");
            }
            return "Cảnh báo học vụ Mức 1: " + String.join(", ", reasons);
        }
        return "Bình thường";
    }
}
