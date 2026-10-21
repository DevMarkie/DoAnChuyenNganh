package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.LecturerRequest;
import com.sms.entity.Lecturer;
import com.sms.security.UserPrincipal;
import com.sms.service.LecturerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lecturers")
@RequiredArgsConstructor
public class LecturerController {

    private final LecturerService lecturerService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Lecturer>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(lecturerService.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Lecturer>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(lecturerService.findById(id)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Lecturer>> getMyProfile(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(lecturerService.findByUserId(user.getId())));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Lecturer>>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(lecturerService.search(keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Lecturer>> create(@Valid @RequestBody LecturerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thêm giảng viên thành công", lecturerService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Lecturer>> update(@PathVariable Long id,
                                                        @Valid @RequestBody LecturerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật giảng viên thành công", lecturerService.update(id, request)));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        lecturerService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công"));
    }
}
