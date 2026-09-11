package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.ScheduleRequest;
import com.sms.entity.Schedule;
import com.sms.security.UserPrincipal;
import com.sms.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Schedule>>> getSchedules(
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) Integer classId
    ) {
        if (semesterId != null) {
            return ResponseEntity.ok(ApiResponse.success(scheduleService.findBySemester(semesterId)));
        }
        if (classId != null) {
            return ResponseEntity.ok(ApiResponse.success(scheduleService.findByClass(classId)));
        }
        return ResponseEntity.ok(ApiResponse.success(scheduleService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Schedule>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.findById(id)));
    }

    /**
     * Thời khóa biểu cá nhân của sinh viên
     */
    @GetMapping("/my-schedule")
    public ResponseEntity<ApiResponse<List<Schedule>>> getMySchedule(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long semesterId
    ) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getStudentSchedule(user.getId(), semesterId)));
    }

    /**
     * Lịch giảng dạy cá nhân của giảng viên
     */
    @GetMapping("/lecturer-schedule")
    public ResponseEntity<ApiResponse<List<Schedule>>> getLecturerSchedule(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long semesterId
    ) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getLecturerSchedule(user.getId(), semesterId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Schedule>> create(@Valid @RequestBody ScheduleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Xếp lịch học thành công", scheduleService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Schedule>> update(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lịch học thành công", scheduleService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa lịch học thành công"));
    }
}
