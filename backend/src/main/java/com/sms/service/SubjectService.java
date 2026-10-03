package com.sms.service;

import com.sms.dto.request.SubjectRequest;
import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;

    @Cacheable(value = "subjects", key = "'all'")
    public List<Subject> findAll() {
        return subjectRepository.findAll();
    }

    public Subject findById(Integer id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học với ID: " + id));
    }

    public List<Subject> search(String keyword) {
        return subjectRepository.search(keyword);
    }

    @Transactional
    @CacheEvict(value = "subjects", allEntries = true)
    public Subject create(SubjectRequest request) {
        if (subjectRepository.existsBySubjectCode(request.getSubjectCode())) {
            throw new BadRequestException("Mã môn học đã tồn tại");
        }
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));

        Subject subject = new Subject();
        subject.setSubjectCode(request.getSubjectCode());
        subject.setSubjectName(request.getSubjectName());
        subject.setCredits(request.getCredits());
        subject.setDescription(request.getDescription());
        subject.setDepartment(dept);
        subject.setIsActive(true);
        subject.setPrerequisites(resolvePrerequisites(request.getPrerequisiteIds(), null));
        return subjectRepository.save(subject);
    }

    @Transactional
    @CacheEvict(value = "subjects", allEntries = true)
    public Subject update(Integer id, SubjectRequest request) {
        Subject subject = findById(id);
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));

        subject.setSubjectName(request.getSubjectName());
        subject.setCredits(request.getCredits());
        subject.setDescription(request.getDescription());
        subject.setDepartment(dept);
        subject.setPrerequisites(resolvePrerequisites(request.getPrerequisiteIds(), id));
        return subjectRepository.save(subject);
    }

    private Set<Subject> resolvePrerequisites(List<Integer> prerequisiteIds, Integer subjectId) {
        if (prerequisiteIds == null || prerequisiteIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        Set<Integer> uniqueIds = new LinkedHashSet<>(prerequisiteIds);
        if (subjectId != null && uniqueIds.contains(subjectId)) {
            throw new BadRequestException("Môn học không thể là tiên quyết của chính nó");
        }

        List<Subject> found = subjectRepository.findAllById(uniqueIds);
        Set<Integer> foundIds = new HashSet<>();
        for (Subject prerequisite : found) {
            foundIds.add(prerequisite.getId());
        }
        if (foundIds.size() != uniqueIds.size()) {
            Set<Integer> missingIds = new LinkedHashSet<>(uniqueIds);
            missingIds.removeAll(foundIds);
            throw new ResourceNotFoundException("Không tìm thấy môn tiên quyết: " + missingIds);
        }

        if (subjectId != null) {
            for (Subject prerequisite : found) {
                if (reachesSubject(prerequisite, subjectId)) {
                    throw new BadRequestException(
                            "Không thể lưu môn tiên quyết vì tạo ra chu trình môn học");
                }
            }
        }
        return new LinkedHashSet<>(found);
    }

    /** Returns true when the prerequisite graph eventually points back to subjectId. */
    private boolean reachesSubject(Subject start, Integer subjectId) {
        Deque<Subject> pending = new ArrayDeque<>();
        Set<Integer> visited = new HashSet<>();
        pending.push(start);
        while (!pending.isEmpty()) {
            Subject current = pending.pop();
            if (current.getId() == null || !visited.add(current.getId())) {
                continue;
            }
            if (current.getId().equals(subjectId)) {
                return true;
            }
            if (current.getPrerequisites() != null) {
                pending.addAll(current.getPrerequisites());
            }
        }
        return false;
    }

    @Transactional
    @CacheEvict(value = "subjects", allEntries = true)
    public void toggleActive(Integer id) {
        Subject subject = findById(id);
        subject.setIsActive(!subject.getIsActive());
        subjectRepository.save(subject);
    }
}
