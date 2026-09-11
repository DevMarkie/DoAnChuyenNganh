package com.sms.service;

import com.sms.dto.request.ClassRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.Department;
import com.sms.exception.*;
import com.sms.repository.ClassRepository;
import com.sms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
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

    public ClassEntity update(Integer id, ClassRequest request) {
        ClassEntity cls = findById(id);
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));

        cls.setName(request.getName());
        cls.setDepartment(dept);
        cls.setAcademicYear(request.getAcademicYear());
        return classRepository.save(cls);
    }

    public void toggleActive(Integer id) {
        ClassEntity cls = findById(id);
        cls.setIsActive(!cls.getIsActive());
        classRepository.save(cls);
    }
}
