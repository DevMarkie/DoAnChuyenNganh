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
import java.util.List;

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
        return subjectRepository.save(subject);
    }

    @Transactional
    @CacheEvict(value = "subjects", allEntries = true)
    public void toggleActive(Integer id) {
        Subject subject = findById(id);
        subject.setIsActive(!subject.getIsActive());
        subjectRepository.save(subject);
    }
}
