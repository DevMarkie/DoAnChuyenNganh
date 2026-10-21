package com.sms.service;

import com.sms.dto.request.DepartmentRequest;
import com.sms.entity.Department;
import com.sms.exception.*;
import com.sms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Cacheable(value = "departments", key = "'all'")
    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    @Cacheable(value = "departments", key = "'active'")
    public List<Department> findActive() {
        return departmentRepository.findByIsActiveTrue();
    }

    public Department findById(Integer id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa với ID: " + id));
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public Department create(DepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Mã khoa đã tồn tại: " + request.getCode());
        }
        if (departmentRepository.existsByName(request.getName())) {
            throw new BadRequestException("Tên khoa đã tồn tại: " + request.getName());
        }

        Department dept = new Department();
        dept.setCode(request.getCode());
        dept.setName(request.getName());
        dept.setDescription(request.getDescription());
        dept.setIsActive(true);
        return departmentRepository.save(dept);
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public Department update(Integer id, DepartmentRequest request) {
        Department dept = findById(id);
        dept.setName(request.getName());
        dept.setDescription(request.getDescription());
        return departmentRepository.save(dept);
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public void toggleActive(Integer id) {
        Department dept = findById(id);
        dept.setIsActive(!dept.getIsActive());
        departmentRepository.save(dept);
    }

    public List<Department> search(String keyword) {
        return departmentRepository.findByNameContainingIgnoreCase(keyword);
    }
}
