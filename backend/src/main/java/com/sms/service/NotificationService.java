package com.sms.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.sms.dto.response.NotificationResponse;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Notification;
import com.sms.entity.Notification.NotificationType;
import com.sms.entity.Student;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.NotificationRepository;
import com.sms.repository.StudentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final StudentRepository studentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final EnrollmentRepository enrollmentRepository;

    /** Map lưu các SseEmitter đang hoạt động của mỗi sinh viên (theo studentId) */
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emittersByStudentId = new ConcurrentHashMap<>();

    /**
     * Sinh viên đăng ký kết nối SSE để nhận thông báo đẩy thời gian thực.
     */
    public SseEmitter subscribe(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chỉ tài khoản sinh viên mới hỗ trợ nhận thông báo đẩy"));

        Long studentId = student.getId();
        // Timeout 60 phút
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L);

        emittersByStudentId.computeIfAbsent(studentId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(studentId, emitter));
        emitter.onTimeout(() -> removeEmitter(studentId, emitter));
        emitter.onError(e -> removeEmitter(studentId, emitter));

        try {
            long unread = notificationRepository.countByStudentIdAndIsReadFalse(studentId);
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data(Map.of(
                            "status", "CONNECTED",
                            "studentCode", student.getStudentCode(),
                            "unreadCount", unread
                    )));
        } catch (IOException e) {
            log.warn("Lỗi khi gửi sự kiện INIT cho studentId={}: {}", studentId, e.getMessage());
            removeEmitter(studentId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(Long studentId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = emittersByStudentId.get(studentId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emittersByStudentId.remove(studentId);
            }
        }
    }

    /**
     * Heartbeat ping mỗi 25 giây để duy trì kết nối qua proxies, load balancers, Cloudflare tunnel.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (emittersByStudentId.isEmpty()) {
            return;
        }

        for (Map.Entry<Long, CopyOnWriteArrayList<SseEmitter>> entry : emittersByStudentId.entrySet()) {
            Long studentId = entry.getKey();
            List<SseEmitter> failed = new ArrayList<>();

            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    failed.add(emitter);
                }
            }

            for (SseEmitter emitter : failed) {
                removeEmitter(studentId, emitter);
            }
        }
    }

    /**
     * Tạo và đẩy thông báo cho tất cả sinh viên trong lớp học phần khi giảng viên cập nhật hoặc chốt điểm.
     */
    @Transactional
    public void notifySectionGradeEvent(Long sectionId, boolean isFinalized) {
        CourseSection section = courseSectionRepository.findById(sectionId).orElse(null);
        if (section == null) {
            return;
        }

        List<Enrollment> enrollments = enrollmentRepository.findActiveBySectionId(sectionId);
        if (enrollments.isEmpty()) {
            return;
        }

        String subjectName = section.getSubject() != null ? section.getSubject().getSubjectName() : "Học phần";
        String sectionCode = section.getSectionCode();

        String title;
        String message;
        NotificationType type;

        if (isFinalized) {
            title = "Công bố bảng điểm: " + subjectName;
            message = "Giảng viên đã chốt bảng điểm học phần " + sectionCode + " (" + subjectName
                    + "). Bạn có 7 ngày để kiểm tra điểm danh (CC1), điểm quá trình (CC2, GK) và điểm thi (CK) để nộp đơn phúc khảo nếu có sai sót.";
            type = NotificationType.GRADE_FINALIZED;
        } else {
            title = "Cập nhật điểm: " + subjectName;
            message = "Giảng viên vừa cập nhật điểm học phần " + sectionCode + " (" + subjectName
                    + "). Vui lòng vào kiểm tra lại kết quả chuyên cần và điểm quá trình của bạn.";
            type = NotificationType.GRADE_UPDATED;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Notification> notificationsToSave = new ArrayList<>(enrollments.size());

        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            if (student == null) continue;

            Notification n = Notification.builder()
                    .student(student)
                    .title(title)
                    .message(message)
                    .type(type)
                    .relatedId(sectionId)
                    .isRead(false)
                    .createdAt(now)
                    .build();
            notificationsToSave.add(n);
        }

        List<Notification> saved = notificationRepository.saveAll(notificationsToSave);

        // Đẩy SSE realtime cho các sinh viên đang online
        for (Notification n : saved) {
            NotificationResponse resp = NotificationResponse.from(n);
            pushRealtime(n.getStudent().getId(), resp);
        }

        log.info("Đã tạo {} thông báo (isFinalized={}) cho sinh viên lớp {}", saved.size(), isFinalized, sectionCode);
    }

    /**
     * Gửi event SSE đến các kết nối đang hoạt động của sinh viên
     */
    private void pushRealtime(Long studentId, NotificationResponse response) {
        CopyOnWriteArrayList<SseEmitter> list = emittersByStudentId.get(studentId);
        if (list == null || list.isEmpty()) {
            return;
        }

        List<SseEmitter> failed = new ArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(response));
            } catch (Exception e) {
                failed.add(emitter);
            }
        }

        for (SseEmitter emitter : failed) {
            removeEmitter(studentId, emitter);
        }
    }

    /**
     * Lấy danh sách thông báo của sinh viên đang đăng nhập (mặc định lấy 30 thông báo mới nhất)
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId, int limit) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin sinh viên"));

        int max = limit > 0 && limit <= 100 ? limit : 30;
        List<Notification> list = notificationRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, max));

        return list.stream().map(NotificationResponse::from).toList();
    }

    /**
     * Đếm số lượng thông báo chưa đọc của sinh viên
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin sinh viên"));
        return notificationRepository.countByStudentIdAndIsReadFalse(student.getId());
    }

    /**
     * Đánh dấu 1 thông báo là đã đọc
     */
    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin sinh viên"));
        notificationRepository.markAsRead(notificationId, student.getId());
    }

    /**
     * Đánh dấu tất cả thông báo của sinh viên là đã đọc
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin sinh viên"));
        notificationRepository.markAllAsRead(student.getId());
    }
}
