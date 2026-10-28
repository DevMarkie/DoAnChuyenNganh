package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.TuitionBatchPaymentRequest;
import com.sms.dto.request.TuitionExtensionRequest;
import com.sms.dto.request.TuitionPaymentRequest;
import com.sms.dto.response.OverdueStudentDto;
import com.sms.dto.response.ReceiptResponse;
import com.sms.dto.response.TuitionBatchPaymentResponse;
import com.sms.dto.response.TuitionOverviewResponse;
import com.sms.dto.response.TuitionSummaryResponse;
import com.sms.entity.Student;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.StudentRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.TuitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/tuition", "/api/tuition"})
@RequiredArgsConstructor
public class TuitionController {

    private final TuitionService tuitionService;
    private final StudentRepository studentRepository;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<TuitionOverviewResponse>> getOverview(
            @RequestParam(required = false) Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(
                tuitionService.getTuitionOverview(semesterId)));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<TuitionSummaryResponse>> getStudentTuition(
            @PathVariable Long studentId,
            @RequestParam(required = false) Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(
                tuitionService.getStudentTuitionSummary(studentId, semesterId)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<TuitionSummaryResponse>> getMyTuition(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Integer semesterId) {
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        return ResponseEntity.ok(ApiResponse.success(
                tuitionService.getStudentTuitionSummary(student.getId(), semesterId)));
    }

    @PostMapping("/simulate-pay")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ReceiptResponse>> simulatePay(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody(required = false) com.sms.dto.request.SimulatePayRequest request) {
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        ReceiptResponse receipt = tuitionService.simulateStudentPayment(student.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Giả lập thanh toán học phí thành công! Đã gạch nợ và gỡ cấm đăng ký.", receipt));
    }

    @PostMapping("/collect-cash")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReceiptResponse>> collectCash(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody TuitionPaymentRequest request) {
        ReceiptResponse receipt = tuitionService.collectCashPayment(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận thu tiền mặt thành công", receipt));
    }

    @PostMapping("/collect-batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TuitionBatchPaymentResponse>> collectBatchCash(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody TuitionBatchPaymentRequest request) {
        TuitionBatchPaymentResponse res = tuitionService.collectBatchCashPayment(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận thu tiền mặt hàng loạt thành công", res));
    }

    @PostMapping("/extend-deadline")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> extendDeadline(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody TuitionExtensionRequest request) {
        tuitionService.extendTuitionDeadline(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã gia hạn nộp học phí thành công", null));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<List<OverdueStudentDto>>> scanOverdue(
            @RequestParam Integer semesterId,
            @RequestParam(required = false) String deadline) {
        return ResponseEntity.ok(ApiResponse.success(
                tuitionService.scanOverdueStudents(semesterId, deadline)));
    }

    @PostMapping("/cancel-overdue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> cancelOverdue(@RequestBody List<Long> invoiceIds) {
        int cancelledCount = tuitionService.cancelOverdueInvoices(invoiceIds);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã hủy thành công " + cancelledCount + " học phần nợ học phí quá hạn", cancelledCount));
    }

    /**
     * Quy tắc liên thông B: Quản trị viên kích hoạt quét và áp dụng chế tài FINANCIAL_HOLD
     */
    @PostMapping("/trigger-financial-holds")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> triggerFinancialHolds() {
        int appliedCount = tuitionService.triggerFinancialHoldEvaluation();
        return ResponseEntity.ok(ApiResponse.success(
                "Đã quét và kích hoạt FINANCIAL_HOLD thành công cho " + appliedCount + " sinh viên nợ quá hạn", appliedCount));
    }
}
