package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.CourseSectionRequest;
import com.sms.entity.CourseSection;
import com.sms.security.UserPrincipal;
import com.sms.service.CourseSectionService;
import com.sms.service.LecturerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/course-sections")
@RequiredArgsConstructor
public class CourseSectionController {

    private final CourseSectionService courseSectionService;
    private final LecturerService lecturerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseSection>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(courseSectionService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseSection>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(courseSectionService.findById(id)));
    }

    @GetMapping("/semester/{semesterId}")
    public ResponseEntity<ApiResponse<List<CourseSection>>> getBySemester(@PathVariable Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(courseSectionService.findBySemester(semesterId)));
    }

    @GetMapping("/semester/{semesterId}/open")
    public ResponseEntity<ApiResponse<List<CourseSection>>> getOpenBySemester(@PathVariable Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(courseSectionService.findOpenBySemester(semesterId)));
    }

    @GetMapping("/my-sections")
    public ResponseEntity<ApiResponse<List<CourseSection>>> getMySections(@AuthenticationPrincipal UserPrincipal user) {
        var lecturer = lecturerService.findByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(courseSectionService.findByLecturer(lecturer.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CourseSection>> create(@Valid @RequestBody CourseSectionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Mở học phần thành công", courseSectionService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseSection>> update(@PathVariable Long id,
                                                             @Valid @RequestBody CourseSectionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật học phần thành công", courseSectionService.update(id, request)));
    }
}
