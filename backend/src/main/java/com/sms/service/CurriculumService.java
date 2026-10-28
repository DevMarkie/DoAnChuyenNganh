package com.sms.service;

import com.sms.dto.response.CurriculumResponse;
import com.sms.dto.response.CurriculumResponse.SubjectStatus;
import com.sms.dto.response.DegreeAuditResponse;
import com.sms.dto.response.GraduationEligibilityResponse;
import com.sms.dto.response.PrerequisiteGraphResponse;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CurriculumService {
    private final StudentRepository studentRepository;
    private final CurriculumProgramRepository programRepository;
    private final CurriculumBlockRepository blockRepository;
    private final CurriculumBlockSubjectRepository blockSubjectRepository;
    private final GradeRepository gradeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PrerequisiteGraphEngine prerequisiteGraphEngine;
    private final DegreeAuditEngine degreeAuditEngine;

    public CurriculumResponse getMyCurriculum(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        return getCurriculumByStudent(student);
    }

    public CurriculumResponse getCurriculumByStudentId(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + studentId));
        return getCurriculumByStudent(student);
    }

    public CurriculumResponse getCurriculumByStudent(Student student) {
        ClassEntity classEntity = student.getClassEntity();
        if (classEntity == null || classEntity.getMajor() == null || classEntity.getCohort() == null) {
            throw new BadRequestException("Sinh viên chưa được gán chuyên ngành và khóa học để tra cứu chương trình đào tạo");
        }
        CurriculumProgram program = programRepository.findActiveByMajorAndCohort(
                        classEntity.getMajor().getId(), classEntity.getCohort().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình đào tạo của sinh viên"));

        List<Grade> finalizedGrades = gradeRepository.findFinalizedByStudentId(student.getId());
        Map<Integer, Grade> bestGrades = bestGradesBySubject(finalizedGrades);
        Map<Integer, Enrollment> activeEnrollments = enrollmentRepository.findActiveByStudentId(student.getId()).stream()
                .filter(enrollment -> enrollment.getSection().getSubject() != null
                        && enrollment.getSection().getSemester() != null
                        && Boolean.TRUE.equals(enrollment.getSection().getSemester().getIsCurrent()))
                .collect(Collectors.toMap(e -> e.getSection().getSubject().getId(), Function.identity(), (first, second) -> first));

        List<CurriculumResponse.BlockSummary> blocks = new ArrayList<>();

        for (CurriculumBlock block : blockRepository.findByProgramIdOrdered(program.getId())) {
            List<CurriculumResponse.SubjectSummary> subjects = new ArrayList<>();
            int completedCredits = 0;
            for (CurriculumBlockSubject link : blockSubjectRepository.findByBlockIdWithSubject(block.getId())) {
                Subject subject = link.getSubject();
                Grade grade = bestGrades.get(subject.getId());
                Enrollment enrollment = activeEnrollments.get(subject.getId());
                SubjectStatus status = resolveStatus(grade, enrollment);
                if (status == SubjectStatus.PASSED) {
                    completedCredits += subject.getCredits();
                }
                subjects.add(CurriculumResponse.SubjectSummary.builder()
                        .id(subject.getId())
                        .code(subject.getSubjectCode())
                        .name(subject.getSubjectName())
                        .credits(subject.getCredits())
                        .required(Boolean.TRUE.equals(link.getRequired()))
                        .status(status)
                        .grade(toGradeSummary(grade))
                        .prerequisites(subject.getPrerequisites().stream().map(Subject::getSubjectCode).sorted().toList())
                        .build());
            }
            int requiredCredits = block.getBlockType() == CurriculumBlock.BlockType.ELECTIVE
                    ? block.getElectiveCredits() : block.getRequiredCredits();
            blocks.add(CurriculumResponse.BlockSummary.builder()
                    .id(block.getId()).code(block.getCode()).name(block.getName())
                    .type(block.getBlockType().name()).requiredCredits(requiredCredits)
                    .completedCredits(completedCredits).completed(requiredCredits == 0 || completedCredits >= requiredCredits)
                    .subjects(subjects).build());
        }

        int completedCredits = 0;
        int inProgressCredits = 0;
        Set<Integer> countedSubjects = new HashSet<>();
        for (CurriculumResponse.BlockSummary b : blocks) {
            for (CurriculumResponse.SubjectSummary s : b.getSubjects()) {
                if (countedSubjects.add(s.getId())) {
                    if (s.getStatus() == SubjectStatus.PASSED) completedCredits += s.getCredits();
                    else if (s.getStatus() == SubjectStatus.ENROLLED) inProgressCredits += s.getCredits();
                }
            }
        }
        int requiredCredits = Optional.ofNullable(program.getTotalCredits()).orElse(0);
        BigDecimal percent = requiredCredits == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(completedCredits * 100.0 / requiredCredits).setScale(1, RoundingMode.HALF_UP);

        return CurriculumResponse.builder()
                .program(CurriculumResponse.ProgramSummary.builder()
                        .id(program.getId()).code(program.getCode()).name(program.getName())
                        .major(new CurriculumResponse.MajorSummary(program.getMajor().getId(), program.getMajor().getCode(), program.getMajor().getName()))
                        .cohort(new CurriculumResponse.CohortSummary(program.getCohort().getId(), program.getCohort().getCode(), program.getCohort().getName()))
                        .totalRequiredCredits(requiredCredits).build())
                .progress(CurriculumResponse.ProgressSummary.builder()
                        .requiredCredits(requiredCredits).completedCredits(completedCredits)
                        .inProgressCredits(inProgressCredits).remainingCredits(Math.max(0, requiredCredits - completedCredits))
                        .completionPercent(percent).build())
                .blocks(blocks).build();
    }

    /**
     * Get the Prerequisite DAG Graph for the current student.
     */
    public PrerequisiteGraphResponse getPrerequisiteGraphByUserId(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        return getPrerequisiteGraph(student);
    }

    /**
     * Get the Prerequisite DAG Graph for any student (Admin / Academic Affairs).
     */
    public PrerequisiteGraphResponse getPrerequisiteGraphByStudentId(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + studentId));
        return getPrerequisiteGraph(student);
    }

    public PrerequisiteGraphResponse getPrerequisiteGraph(Student student) {
        ClassEntity classEntity = student.getClassEntity();
        if (classEntity == null || classEntity.getMajor() == null || classEntity.getCohort() == null) {
            throw new BadRequestException("Sinh viên chưa được gán chuyên ngành và khóa học");
        }
        CurriculumProgram program = programRepository.findActiveByMajorAndCohort(
                        classEntity.getMajor().getId(), classEntity.getCohort().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình đào tạo của sinh viên"));

        List<CurriculumBlock> blocks = blockRepository.findByProgramIdOrdered(program.getId());
        List<CurriculumBlockSubject> blockSubjects = new ArrayList<>();
        for (CurriculumBlock b : blocks) {
            blockSubjects.addAll(blockSubjectRepository.findByBlockIdWithSubject(b.getId()));
        }

        List<Grade> finalizedGrades = gradeRepository.findFinalizedByStudentId(student.getId());
        Map<Integer, Grade> bestGrades = bestGradesBySubject(finalizedGrades);
        Map<Integer, Enrollment> activeEnrollments = enrollmentRepository.findActiveByStudentId(student.getId()).stream()
                .filter(enrollment -> enrollment.getSection().getSubject() != null
                        && enrollment.getSection().getSemester() != null
                        && Boolean.TRUE.equals(enrollment.getSection().getSemester().getIsCurrent()))
                .collect(Collectors.toMap(e -> e.getSection().getSubject().getId(), Function.identity(), (first, second) -> first));

        return prerequisiteGraphEngine.buildGraph(student, program, blocks, blockSubjects, bestGrades, activeEnrollments);
    }

    /**
     * Get Degree Audit according to BR-CUR-04 for the current student.
     */
    public DegreeAuditResponse getDegreeAuditByUserId(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        return getDegreeAudit(student);
    }

    /**
     * Get Degree Audit according to BR-CUR-04 for any student (Admin / Academic Affairs).
     */
    public DegreeAuditResponse getDegreeAuditByStudentId(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + studentId));
        return getDegreeAudit(student);
    }

    public DegreeAuditResponse getDegreeAudit(Student student) {
        ClassEntity classEntity = student.getClassEntity();
        if (classEntity == null || classEntity.getMajor() == null || classEntity.getCohort() == null) {
            throw new BadRequestException("Sinh viên chưa được gán chuyên ngành và khóa học");
        }
        CurriculumProgram program = programRepository.findActiveByMajorAndCohort(
                        classEntity.getMajor().getId(), classEntity.getCohort().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình đào tạo của sinh viên"));

        List<CurriculumBlock> blocks = blockRepository.findByProgramIdOrdered(program.getId());
        List<CurriculumBlockSubject> blockSubjects = new ArrayList<>();
        for (CurriculumBlock b : blocks) {
            blockSubjects.addAll(blockSubjectRepository.findByBlockIdWithSubject(b.getId()));
        }

        List<Grade> finalizedGrades = gradeRepository.findFinalizedByStudentId(student.getId());
        Map<Integer, Grade> bestGrades = bestGradesBySubject(finalizedGrades);

        return degreeAuditEngine.auditStudent(student, program, blocks, blockSubjects, bestGrades);
    }

    /**
     * BR-GRADUATION: Kiểm tra toàn diện điều kiện xét tốt nghiệp của sinh viên theo quy chế đào tạo tín chỉ:
     * Sử dụng DegreeAuditEngine (BR-CUR-04) để tách biệt Bắt buộc/Tự chọn và tối ưu hóa CPA.
     */
    public GraduationEligibilityResponse checkGraduationEligibility(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + studentId));

        DegreeAuditResponse audit = getDegreeAudit(student);

        String className = student.getClassEntity() != null ? student.getClassEntity().getName() : "";
        String programName = audit.getMajorName() + " - " + audit.getCohortName();

        int completedCredits = audit.getTotalCompletedCredits();
        int requiredCredits = audit.getTotalRequiredCredits();
        int remainingCredits = Math.max(0, requiredCredits - completedCredits);
        BigDecimal completionPercent = requiredCredits == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(completedCredits * 100.0 / requiredCredits).setScale(1, RoundingMode.HALF_UP);

        return GraduationEligibilityResponse.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .className(className)
                .programName(programName)
                .eligible(audit.getIsGraduationEligible())
                .completedCredits(completedCredits)
                .requiredCredits(requiredCredits)
                .remainingCredits(remainingCredits)
                .completionPercent(completionPercent)
                .cumulativeGpa(audit.getAuditCpa())
                .unsatisfiedReasons(audit.getUnsatisfiedReasons())
                .build();
    }

    /**
     * Ném ngoại lệ BadRequestException nếu sinh viên không đủ điều kiện tốt nghiệp.
     */
    public void validateGraduationEligibility(Long studentId) {
        GraduationEligibilityResponse eligibility = checkGraduationEligibility(studentId);
        if (!eligibility.isEligible()) {
            String reasons = String.join("; ", eligibility.getUnsatisfiedReasons());
            throw new BadRequestException("Sinh viên " + eligibility.getStudentName() + " (" + eligibility.getStudentCode()
                    + ") chưa đủ điều kiện tốt nghiệp! Lý do: " + reasons);
        }
    }

    private Map<Integer, Grade> bestGradesBySubject(List<Grade> grades) {
        Map<Integer, Grade> result = new HashMap<>();
        for (Grade grade : grades) {
            Integer subjectId = grade.getEnrollment().getSection().getSubject().getId();
            Grade current = result.get(subjectId);
            if (current == null || gradeScore(grade).compareTo(gradeScore(current)) > 0) result.put(subjectId, grade);
        }
        return result;
    }

    private BigDecimal gradeScore(Grade grade) {
        if (grade.getSpecialGrade() == Grade.SpecialGrade.M) return BigDecimal.valueOf(4);
        return Optional.ofNullable(grade.getGpaPoint()).orElse(BigDecimal.ZERO);
    }

    private SubjectStatus resolveStatus(Grade grade, Enrollment enrollment) {
        if (grade != null) return gradeScore(grade).compareTo(BigDecimal.ONE) >= 0 ? SubjectStatus.PASSED : SubjectStatus.RETAKE_REQUIRED;
        return enrollment != null && enrollment.getStatus() == Enrollment.EnrollmentStatus.ENROLLED
                ? SubjectStatus.ENROLLED : SubjectStatus.NOT_ENROLLED;
    }

    private CurriculumResponse.GradeSummary toGradeSummary(Grade grade) {
        return grade == null ? null : CurriculumResponse.GradeSummary.builder()
                .letterGrade(grade.getLetterGrade()).gpaPoint(grade.getGpaPoint()).build();
    }
}
