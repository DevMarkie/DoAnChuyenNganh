package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.AchievementDisciplineRequest;
import com.sms.dto.request.TrainingPointRequest;
import com.sms.entity.Student;
import com.sms.entity.StudentAchievementDiscipline;
import com.sms.entity.StudentTrainingPoint;
import com.sms.security.UserPrincipal;
import com.sms.service.StudentConductService;
import com.sms.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-conduct")
@RequiredArgsConstructor
public class StudentConductController {

    private final StudentConductService studentConductService;
    private final StudentService studentService;

    // --- KHEN THƯỞNG & KỶ LUẬT (ADMIN) ---

    @GetMapping("/achievements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentAchievementDiscipline>>> getAchievementsDisciplines(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(
                studentConductService.searchAchievementsDisciplines(studentId, type, semesterId)));
    }

    @PostMapping("/achievements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentAchievementDiscipline>> createAchievementDiscipline(
            @Valid @RequestBody AchievementDisciplineRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thêm hồ sơ khen thưởng/kỷ luật thành công",
                studentConductService.createRecord(request)));
    }

    @PutMapping("/achievements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentAchievementDiscipline>> updateAchievementDiscipline(
            @PathVariable Long id,
            @Valid @RequestBody AchievementDisciplineRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ khen thưởng/kỷ luật thành công",
                studentConductService.updateRecord(id, request)));
    }

    @DeleteMapping("/achievements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAchievementDiscipline(@PathVariable Long id) {
        studentConductService.deleteRecord(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa hồ sơ thành công", null));
    }

    // --- ĐIỂM RÈN LUYỆN (ADMIN) ---

    @GetMapping("/training-points")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentTrainingPoint>>> getTrainingPoints(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(
                studentConductService.searchTrainingPoints(studentId, semesterId)));
    }

    @PostMapping("/training-points")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentTrainingPoint>> saveTrainingPoint(
            @Valid @RequestBody TrainingPointRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm rèn luyện thành công",
                studentConductService.saveTrainingPoint(request)));
    }

    @DeleteMapping("/training-points/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTrainingPoint(@PathVariable Long id) {
        studentConductService.deleteTrainingPoint(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa điểm rèn luyện thành công", null));
    }

    // --- CỔNG SINH VIÊN (STUDENT) ---

    @GetMapping("/me/achievements")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentAchievementDiscipline>>> getMyAchievements(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Student student = studentService.findByUserId(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(studentConductService.getStudentRecords(student.getId())));
    }

    @GetMapping("/me/training-points")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentTrainingPoint>>> getMyTrainingPoints(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Student student = studentService.findByUserId(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(studentConductService.getStudentTrainingPoints(student.getId())));
    }
}
