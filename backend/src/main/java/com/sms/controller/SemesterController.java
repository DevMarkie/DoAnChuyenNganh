package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.SemesterRequest;
import com.sms.entity.Semester;
import com.sms.service.SemesterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Semester>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(semesterService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Semester>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(semesterService.findById(id)));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<Semester>> getCurrent() {
        return ResponseEntity.ok(ApiResponse.success(semesterService.findCurrent()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Semester>> create(@Valid @RequestBody SemesterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo học kỳ thành công", semesterService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Semester>> update(@PathVariable Integer id,
                                                        @Valid @RequestBody SemesterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật học kỳ thành công", semesterService.update(id, request)));
    }

    @PutMapping("/{id}/set-current")
    public ResponseEntity<ApiResponse<Void>> setCurrent(@PathVariable Integer id) {
        semesterService.setCurrent(id);
        return ResponseEntity.ok(ApiResponse.success("Đã đặt học kỳ hiện tại"));
    }
}
