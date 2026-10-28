package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.entity.Major;
import com.sms.repository.MajorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/majors")
@RequiredArgsConstructor
public class MajorController {

    private final MajorRepository majorRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Major>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(majorRepository.findAll()));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<Major>>> getByDepartment(@PathVariable Integer departmentId) {
        return ResponseEntity.ok(ApiResponse.success(majorRepository.findByDepartmentId(departmentId)));
    }
}
