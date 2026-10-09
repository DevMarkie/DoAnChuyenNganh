package com.sms.service;

import com.sms.dto.request.ClassRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.Department;
import com.sms.exception.*;
import com.sms.repository.ClassRepository;
import com.sms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassService {

    private final ClassRepository classRepository;
    private final DepartmentRepository departmentRepository;

    public List<ClassEntity> findAll() {
        return classRepository.findAll();
    }

    public ClassEntity findById(Integer id) {
        return classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp với ID: " + id));
    }

    public List<ClassEntity> findByDepartment(Integer departmentId) {
        return classRepository.findByDepartmentId(departmentId);
    }

    @Transactional
    public ClassEntity create(ClassRequest request) {
        if (classRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Mã lớp đã tồn tại: " + request.getCode());
        }

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));

        ClassEntity cls = new ClassEntity();
        cls.setCode(request.getCode());
        cls.setName(request.getName());
        cls.setDepartment(dept);
        cls.setAcademicYear(request.getAcademicYear());
        cls.setIsActive(true);
        return classRepository.save(cls);
    }

    @Transactional
    public ClassEntity update(Integer id, ClassRequest request) {
        ClassEntity cls = findById(id);
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));

        cls.setName(request.getName());
        cls.setDepartment(dept);
        cls.setAcademicYear(request.getAcademicYear());
        return classRepository.save(cls);
    }

    @Transactional
    public void toggleActive(Integer id) {
        ClassEntity cls = findById(id);
        cls.setIsActive(!cls.getIsActive());
        classRepository.save(cls);
    }

    /**
     * Tự động sinh danh sách lớp sinh hoạt theo Khóa và Năm học cho các khoa.
     */
    @Transactional
    public List<ClassEntity> batchGenerate(com.sms.dto.request.BatchClassRequest request) {
        List<Department> departments = (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty())
                ? departmentRepository.findAllById(request.getDepartmentIds())
                : departmentRepository.findByIsActiveTrue();

        List<ClassEntity> created = new java.util.ArrayList<>();
        String cohort = request.getCohort().trim().toUpperCase();
        String academicYear = request.getAcademicYear().trim();
        int count = Math.max(1, request.getClassesPerDepartment());

        for (Department dept : departments) {
            for (int i = 1; i <= count; i++) {
                String code = String.format("%s%02d-%s", dept.getCode().trim().toUpperCase(), i, cohort);
                if (classRepository.existsByCode(code)) {
                    continue;
                }
                String name = String.format("%s %d - %s", dept.getName().trim(), i, cohort);
                ClassEntity cls = new ClassEntity();
                cls.setCode(code);
                cls.setName(name);
                cls.setDepartment(dept);
                cls.setAcademicYear(academicYear);
                cls.setIsActive(true);
                created.add(classRepository.save(cls));
            }
        }
        return created;
    }
}
