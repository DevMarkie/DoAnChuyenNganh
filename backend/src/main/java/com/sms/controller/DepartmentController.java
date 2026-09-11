package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.DepartmentRequest;
import com.sms.entity.Department;
import com.sms.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.findAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Department>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.findActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.findById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Department>>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.search(keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Department>> create(@Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo khoa thành công", departmentService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> update(@PathVariable Integer id,
                                                          @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khoa thành công", departmentService.update(id, request)));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Integer id) {
        departmentService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công"));
    }
}
