package com.sms.service;

import com.sms.dto.response.PrerequisiteGraphResponse;
import com.sms.dto.response.PrerequisiteGraphResponse.*;
import com.sms.entity.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Component
public class PrerequisiteGraphEngine {

    /**
     * Build the complete Prerequisite DAG Graph for a student and program.
     */
    public PrerequisiteGraphResponse buildGraph(
            Student student,
            CurriculumProgram program,
            List<CurriculumBlock> blocks,
            List<CurriculumBlockSubject> blockSubjects,
            Map<Integer, Grade> bestGrades,
            Map<Integer, Enrollment> activeEnrollments) {

        // Collect all subjects in program
        Map<Integer, Subject> subjectMap = new HashMap<>();
        Map<Integer, CurriculumBlockSubject> blockSubjectMap = new HashMap<>();
        Map<Integer, CurriculumBlock> blockMap = new HashMap<>();

        for (CurriculumBlock block : blocks) {
            blockMap.put(block.getId().intValue(), block);
        }

        for (CurriculumBlockSubject cbs : blockSubjects) {
            Subject s = cbs.getSubject();
            if (s != null) {
                subjectMap.put(s.getId(), s);
                blockSubjectMap.put(s.getId(), cbs);
            }
        }

        // Build adjacency list: prerequisiteId -> list of dependentSubjectIds
        // and dependency list: subjectId -> set of direct prerequisiteIds
        Map<Integer, Set<Integer>> directPrereqMap = new HashMap<>();
        for (Subject subject : subjectMap.values()) {
            Set<Integer> prereqIds = new HashSet<>();
            if (subject.getPrerequisites() != null) {
                for (Subject p : subject.getPrerequisites()) {
                    prereqIds.add(p.getId());
                }
            }
            directPrereqMap.put(subject.getId(), prereqIds);
        }

        // Precompute levels for all subjects (memoized depth in DAG)
        Map<Integer, Integer> levelMap = new HashMap<>();
        for (Subject s : subjectMap.values()) {
            calculateDepthLevel(s.getId(), directPrereqMap, subjectMap, levelMap, new HashSet<>());
        }

        // Identify passed subject IDs for the student
        Set<Integer> passedSubjectIds = new HashSet<>();
        for (Map.Entry<Integer, Grade> entry : bestGrades.entrySet()) {
            if (isGradePassed(entry.getValue())) {
                passedSubjectIds.add(entry.getKey());
            }
        }

        // Build Nodes
        List<NodeDto> nodes = new ArrayList<>();
        for (Subject subject : subjectMap.values()) {
            CurriculumBlockSubject link = blockSubjectMap.get(subject.getId());
            CurriculumBlock block = link != null && link.getBlock() != null ? link.getBlock() : null;

            Grade grade = bestGrades.get(subject.getId());
            Enrollment activeEnrollment = activeEnrollments.get(subject.getId());

            // Check missing direct & indirect prerequisites in DAG
            List<String> missingPrereqCodes = new ArrayList<>();
            findMissingAncestors(subject.getId(), directPrereqMap, subjectMap, passedSubjectIds, missingPrereqCodes, new HashSet<>());

            SubjectStatus status;
            if (passedSubjectIds.contains(subject.getId())) {
                status = SubjectStatus.PASSED;
            } else if (activeEnrollment != null && activeEnrollment.getStatus() == Enrollment.EnrollmentStatus.ENROLLED) {
                status = SubjectStatus.ENROLLED;
            } else if (grade != null && !isGradePassed(grade)) {
                status = SubjectStatus.RETAKE_REQUIRED;
            } else if (missingPrereqCodes.isEmpty()) {
                status = SubjectStatus.ELIGIBLE;
            } else {
                status = SubjectStatus.LOCKED;
            }

            List<String> directPrereqCodes = new ArrayList<>();
            Set<Integer> prereqIds = directPrereqMap.getOrDefault(subject.getId(), Collections.emptySet());
            for (Integer pId : prereqIds) {
                Subject p = subjectMap.get(pId);
                if (p != null) {
                    directPrereqCodes.add(p.getSubjectCode());
                }
            }
            Collections.sort(directPrereqCodes);

            GradeSummary gradeSummary = null;
            if (grade != null) {
                gradeSummary = GradeSummary.builder()
                        .letterGrade(grade.getLetterGrade())
                        .gpaPoint(grade.getGpaPoint())
                        .finalScore(grade.getFinalScore())
                        .build();
            }

            nodes.add(NodeDto.builder()
                    .id(subject.getId())
                    .code(subject.getSubjectCode())
                    .name(subject.getSubjectName())
                    .credits(subject.getCredits())
                    .blockCode(block != null ? block.getCode() : "N/A")
                    .blockName(block != null ? block.getName() : "N/A")
                    .blockType(block != null ? block.getBlockType().name() : "COMPULSORY")
                    .level(levelMap.getOrDefault(subject.getId(), 1))
                    .status(status)
                    .bestGrade(gradeSummary)
                    .directPrerequisites(directPrereqCodes)
                    .missingPrerequisites(missingPrereqCodes)
                    .build());
        }

        // Sort nodes by level, then code
        nodes.sort(Comparator.comparingInt(NodeDto::getLevel).thenComparing(NodeDto::getCode));

        // Build Edges
        List<EdgeDto> edges = new ArrayList<>();
        for (Subject subject : subjectMap.values()) {
            Set<Integer> prereqs = directPrereqMap.getOrDefault(subject.getId(), Collections.emptySet());
            for (Integer pId : prereqs) {
                Subject prereqSub = subjectMap.get(pId);
                if (prereqSub != null) {
                    edges.add(EdgeDto.builder()
                            .source(pId)
                            .target(subject.getId())
                            .sourceCode(prereqSub.getSubjectCode())
                            .targetCode(subject.getSubjectCode())
                            .isFulfilled(passedSubjectIds.contains(pId))
                            .build());
                }
            }
        }

        String majorCode = program.getMajor() != null ? program.getMajor().getCode() : "";
        String majorName = program.getMajor() != null ? program.getMajor().getName() : "";
        String cohortName = program.getCohort() != null ? program.getCohort().getName() : "";

        return PrerequisiteGraphResponse.builder()
                .majorCode(majorCode)
                .majorName(majorName)
                .cohortName(cohortName)
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .nodes(nodes)
                .edges(edges)
                .build();
    }

    /**
     * Recursively calculate depth level in the prerequisite graph.
     * Root subjects (no prerequisites) have Level = 1.
     * Subject with prerequisites has Level = max(prerequisite levels) + 1.
     */
    private int calculateDepthLevel(
            Integer subjectId,
            Map<Integer, Set<Integer>> directPrereqMap,
            Map<Integer, Subject> subjectMap,
            Map<Integer, Integer> levelMap,
            Set<Integer> visiting) {

        if (levelMap.containsKey(subjectId)) {
            return levelMap.get(subjectId);
        }
        if (visiting.contains(subjectId)) {
            // Cycle detected - fallback to level 1 to prevent infinite loop
            log.warn("Cycle detected in prerequisite graph at subject ID {}", subjectId);
            return 1;
        }

        visiting.add(subjectId);
        Set<Integer> prereqIds = directPrereqMap.getOrDefault(subjectId, Collections.emptySet());
        int maxParentLevel = 0;
        for (Integer pId : prereqIds) {
            int pLevel = calculateDepthLevel(pId, directPrereqMap, subjectMap, levelMap, visiting);
            if (pLevel > maxParentLevel) {
                maxParentLevel = pLevel;
            }
        }
        visiting.remove(subjectId);

        int level = maxParentLevel + 1;
        levelMap.put(subjectId, level);
        return level;
    }

    /**
     * Traverse deep ancestor chain to find all direct and indirect missing prerequisites.
     */
    public void findMissingAncestors(
            Integer subjectId,
            Map<Integer, Set<Integer>> directPrereqMap,
            Map<Integer, Subject> subjectMap,
            Set<Integer> passedSubjectIds,
            List<String> missingPrereqCodes,
            Set<Integer> visited) {

        if (!visited.add(subjectId)) {
            return;
        }

        Set<Integer> prereqIds = directPrereqMap.getOrDefault(subjectId, Collections.emptySet());
        for (Integer pId : prereqIds) {
            Subject prereqSub = subjectMap.get(pId);
            String pCode = prereqSub != null ? prereqSub.getSubjectCode() : ("ID:" + pId);
            if (!passedSubjectIds.contains(pId)) {
                if (!missingPrereqCodes.contains(pCode)) {
                    missingPrereqCodes.add(pCode);
                }
            }
            // Recurse to ancestor
            findMissingAncestors(pId, directPrereqMap, subjectMap, passedSubjectIds, missingPrereqCodes, visited);
        }
    }

    /**
     * Validates deep recursive prerequisite chain for enrollment.
     * Throws an exception or returns list of all missing prerequisites (both direct & indirect).
     */
    public List<Subject> validateDeepPrerequisites(Subject targetSubject, Set<Integer> passedSubjectIds) {
        List<Subject> missingList = new ArrayList<>();
        Set<Integer> visited = new HashSet<>();
        Queue<Subject> queue = new LinkedList<>();

        if (targetSubject.getPrerequisites() != null) {
            queue.addAll(targetSubject.getPrerequisites());
        }

        while (!queue.isEmpty()) {
            Subject current = queue.poll();
            if (current == null || !visited.add(current.getId())) {
                continue;
            }

            if (!passedSubjectIds.contains(current.getId())) {
                missingList.add(current);
            }

            if (current.getPrerequisites() != null) {
                queue.addAll(current.getPrerequisites());
            }
        }

        return missingList;
    }

    public boolean isGradePassed(Grade grade) {
        if (grade == null) return false;
        if (grade.getSpecialGrade() == Grade.SpecialGrade.M) return true;
        if (grade.getSpecialGrade() == Grade.SpecialGrade.V) return false;
        if (grade.getGpaPoint() == null) return false;
        // Total score >= 4.0 and GPA >= 1.0 (D) and final score >= 3.0 (BR-Course01)
        boolean finalScorePassed = grade.getFinalScore() == null || grade.getFinalScore().compareTo(BigDecimal.valueOf(3.0)) >= 0;
        return grade.getGpaPoint().compareTo(BigDecimal.ONE) >= 0 && finalScorePassed;
    }
}
