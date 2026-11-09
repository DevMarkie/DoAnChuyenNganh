package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.ClassRequest;
import com.sms.entity.ClassEntity;
import com.sms.entity.Student;
import com.sms.security.UserPrincipal;
import com.sms.service.ClassService;
import com.sms.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassEntity>>> getAll(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(classService.findAll(user)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassEntity>> getById(@PathVariable Integer id,
                                                            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(classService.findById(id, user)));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<ClassEntity>>> getByDepartment(@PathVariable Integer departmentId,
                                                                          @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(classService.findByDepartment(departmentId, user)));
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<Student>>> getStudentsInClass(@PathVariable Integer id,
                                                                         @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findByClass(id, user)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClassEntity>> create(@Valid @RequestBody ClassRequest request,
                                                           @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success("Tạo lớp thành công", classService.create(request, user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassEntity>> update(@PathVariable Integer id,
                                                           @Valid @RequestBody ClassRequest request,
                                                           @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lớp thành công", classService.update(id, request, user)));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Integer id,
                                                          @AuthenticationPrincipal UserPrincipal user) {
        classService.toggleActive(id, user);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công"));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<ClassEntity>>> batchGenerate(@Valid @RequestBody com.sms.dto.request.BatchClassRequest request,
                                                                        @AuthenticationPrincipal UserPrincipal user) {
        List<ClassEntity> result = classService.batchGenerate(request, user);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo tự động " + result.size() + " lớp sinh hoạt thành công", result));
    }
}
