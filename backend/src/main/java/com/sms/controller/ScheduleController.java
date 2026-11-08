package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.ScheduleRequest;
import com.sms.entity.Schedule;
import com.sms.security.UserPrincipal;
import com.sms.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Schedule>>> getSchedules(
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) Integer classId,
            @RequestParam(required = false) Long sectionId
    ) {
        if (sectionId != null) {
            return ResponseEntity.ok(ApiResponse.success(scheduleService.findBySectionId(sectionId)));
        }
        if (semesterId != null) {
            return ResponseEntity.ok(ApiResponse.success(scheduleService.findBySemester(semesterId)));
        }
        if (classId != null) {
            return ResponseEntity.ok(ApiResponse.success(scheduleService.findByClass(classId)));
        }
        return ResponseEntity.ok(ApiResponse.success(scheduleService.findAll()));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<ApiResponse<Schedule>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.findById(id)));
    }

    /**
     * Alias endpoint cho cả sinh viên và giảng viên
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Schedule>>> getMyScheduleAlias(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long semesterId
    ) {
        if ("LECTURER".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.ok(ApiResponse.success(scheduleService.getLecturerSchedule(user.getId(), semesterId)));
        }
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getStudentSchedule(user.getId(), semesterId)));
    }

    /**
     * Thời khóa biểu cá nhân của sinh viên
     */
    @GetMapping("/my-schedule")
    @PreAuthorize("hasRole('STUDENT')")
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
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<ApiResponse<List<Schedule>>> getLecturerSchedule(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long semesterId
    ) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getLecturerSchedule(user.getId(), semesterId)));
    }

    /**
     * Xuất tệp iCalendar (.ics) đồng bộ Google Calendar / Outlook
     */
    @GetMapping("/my/export-ics")
    public ResponseEntity<byte[]> exportMyIcs(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long semesterId
    ) {
        byte[] icsData;
        if ("LECTURER".equalsIgnoreCase(user.getRole())) {
            icsData = scheduleService.exportLecturerIcs(user.getId(), semesterId);
        } else {
            icsData = scheduleService.exportStudentIcs(user.getId(), semesterId);
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"timetable.ics\"")
                .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
                .body(icsData);
    }

    /**
     * Xuất tệp Excel (.xlsx) thời khóa biểu
     */
    @GetMapping("/my/export-excel")
    public ResponseEntity<byte[]> exportMyExcel(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long semesterId
    ) throws IOException {
        byte[] excelData;
        if ("LECTURER".equalsIgnoreCase(user.getRole())) {
            excelData = scheduleService.exportLecturerExcel(user.getId(), semesterId);
        } else {
            excelData = scheduleService.exportStudentExcel(user.getId(), semesterId);
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"timetable.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
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
