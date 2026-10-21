package com.sms.service;

import com.sms.dto.response.CurriculumResponse;
import com.sms.dto.response.CurriculumResponse.SubjectStatus;
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

    public CurriculumResponse getMyCurriculum(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
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

        int completedCredits = blocks.stream().flatMap(block -> block.getSubjects().stream())
                .filter(subject -> subject.getStatus() == SubjectStatus.PASSED)
                .collect(Collectors.toMap(CurriculumResponse.SubjectSummary::getId,
                        CurriculumResponse.SubjectSummary::getCredits, (first, duplicate) -> first)).values().stream()
                .mapToInt(Integer::intValue).sum();
        int inProgressCredits = blocks.stream().flatMap(block -> block.getSubjects().stream())
                .filter(subject -> subject.getStatus() == SubjectStatus.ENROLLED)
                .collect(Collectors.toMap(CurriculumResponse.SubjectSummary::getId,
                        CurriculumResponse.SubjectSummary::getCredits, (first, duplicate) -> first)).values().stream()
                .mapToInt(Integer::intValue).sum();
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
