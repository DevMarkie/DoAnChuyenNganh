package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.CourseSectionRequest;
import com.sms.entity.CourseSection;
import com.sms.security.UserPrincipal;
import com.sms.service.CourseSectionService;
import com.sms.service.LecturerService;
import com.sms.service.RedisCourseSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/course-sections")
@RequiredArgsConstructor
public class CourseSectionController {

    private final CourseSectionService courseSectionService;
    private final LecturerService lecturerService;
    private final com.sms.service.ExcelExportService excelExportService;
    private final com.sms.service.EnrollmentService enrollmentService;
    private final RedisCourseSectionService redisCourseSectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseSection>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(courseSectionService.findAll()));
    }

    /**
     * Endpoint phân trang với filter: ?keyword=&semesterId=&status=&page=0&size=20
     */
    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Page<CourseSection>>> getPaged(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1]))
                ? Sort.Direction.ASC : Sort.Direction.DESC;

        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        return ResponseEntity.ok(ApiResponse.success(
                courseSectionService.findPaged(keyword, semesterId, status, pageable)));
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
    @PreAuthorize("hasRole('LECTURER')")
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

    /**
     * Batch Warm-up: Nạp sẵn danh sách lớp của học kỳ vào Redis Cache trước giờ G.
     */
    @PostMapping("/semester/{semesterId}/warmup-cache")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<String>> warmUpCache(@PathVariable Integer semesterId) {
        int count = redisCourseSectionService.warmUpSemesterSections(semesterId);
        return ResponseEntity.ok(ApiResponse.success("Đã nạp sẵn " + count + " lớp học phần vào Redis cache", "LOADED_" + count));
    }

    @GetMapping("/{id}/export-students")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_AFFAIRS','LECTURER')")
    public ResponseEntity<byte[]> exportStudents(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id) throws java.io.IOException {
        enrollmentService.assertCanViewSection(user.getId(), id);
        byte[] excelData = excelExportService.exportSectionStudentList(id);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=danh_sach_sv_" + id + ".xlsx")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }
}
