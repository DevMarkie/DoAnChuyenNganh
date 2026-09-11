package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.StudentRequest;
import com.sms.entity.Student;
import com.sms.security.UserPrincipal;
import com.sms.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Student>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(studentService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Student>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findById(id)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Student>> getMyProfile(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findByUserId(user.getId())));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Student>>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(studentService.search(keyword)));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<Student>>> getByClass(@PathVariable Integer classId) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findByClass(classId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Student>> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thêm sinh viên thành công", studentService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Student>> update(@PathVariable Long id,
                                                       @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sinh viên thành công", studentService.update(id, request)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(@PathVariable Long id,
                                                          @RequestParam String status) {
        studentService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công"));
    }
}
