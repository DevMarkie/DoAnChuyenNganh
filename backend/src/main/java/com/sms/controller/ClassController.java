package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.ClassRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.Student;
import com.sms.service.ClassService;
import com.sms.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassEntity>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(classService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassEntity>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(classService.findById(id)));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<ClassEntity>>> getByDepartment(@PathVariable Integer departmentId) {
        return ResponseEntity.ok(ApiResponse.success(classService.findByDepartment(departmentId)));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<ApiResponse<List<Student>>> getStudentsInClass(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findByClass(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClassEntity>> create(@Valid @RequestBody ClassRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo lớp thành công", classService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassEntity>> update(@PathVariable Integer id,
                                                           @Valid @RequestBody ClassRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lớp thành công", classService.update(id, request)));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Integer id) {
        classService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công"));
    }
}
