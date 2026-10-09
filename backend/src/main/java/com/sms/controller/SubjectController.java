package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.SubjectRequest;
import com.sms.dto.response.SubjectResponse;
import com.sms.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(subjectService.findAll().stream()
                .map(SubjectResponse::from).toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(SubjectResponse.from(subjectService.findById(id))));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.search(keyword).stream()
                .map(SubjectResponse::from).toList()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubjectResponse>> create(@Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo môn học thành công",
                SubjectResponse.from(subjectService.create(request))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> update(@PathVariable Integer id,
                                                       @Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật môn học thành công",
                SubjectResponse.from(subjectService.update(id, request))));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Integer id) {
        subjectService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công"));
    }
}
