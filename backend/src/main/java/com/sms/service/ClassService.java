package com.sms.service;

import com.sms.dto.request.ClassRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.Department;
import com.sms.exception.*;
import com.sms.repository.ClassRepository;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.LecturerRepository;
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
    private final com.sms.repository.MajorRepository majorRepository;
    private final com.sms.repository.CohortRepository cohortRepository;
    private final LecturerRepository lecturerRepository;

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

        if (request.getMajorId() != null) {
            cls.setMajor(majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyên ngành")));
        }
        if (request.getCohortId() != null) {
            cls.setCohort(cohortRepository.findById(request.getCohortId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học")));
        }
        if (request.getAdvisorId() != null) {
            cls.setAdvisor(lecturerRepository.findById(request.getAdvisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên cố vấn")));
        }

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

        if (request.getMajorId() != null) {
            cls.setMajor(majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyên ngành")));
        }
        if (request.getCohortId() != null) {
            cls.setCohort(cohortRepository.findById(request.getCohortId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học")));
        }
        if (request.getAdvisorId() != null) {
            cls.setAdvisor(lecturerRepository.findById(request.getAdvisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên cố vấn")));
        }

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
        String cohortStr = request.getCohort().trim().toUpperCase();
        String academicYear = request.getAcademicYear().trim();
        int count = Math.max(1, request.getClassesPerDepartment());

        com.sms.entity.Cohort cohortEntity = cohortRepository.findByCode(cohortStr).orElse(null);

        for (Department dept : departments) {
            com.sms.entity.Major primaryMajor = majorRepository.findByDepartmentId(dept.getId()).stream().findFirst().orElse(null);
            for (int i = 1; i <= count; i++) {
                String code = String.format("%s%02d-%s", dept.getCode().trim().toUpperCase(), i, cohortStr);
                if (classRepository.existsByCode(code)) {
                    continue;
                }
                String name = String.format("%s %d - %s", dept.getName().trim(), i, cohortStr);
                ClassEntity cls = new ClassEntity();
                cls.setCode(code);
                cls.setName(name);
                cls.setDepartment(dept);
                cls.setAcademicYear(academicYear);
                cls.setIsActive(true);
                cls.setCohort(cohortEntity);
                cls.setMajor(primaryMajor);
                created.add(classRepository.save(cls));
            }
        }
        return created;
    }
}
