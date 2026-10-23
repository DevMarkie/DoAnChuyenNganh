-- Migration: Nâng cấp bảng notifications hỗ trợ thông báo đẩy in-app thời gian thực
-- Kịch bản: Bổ sung title, type, related_id, is_read và các index tăng tốc

ALTER TABLE notifications
    ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Thông báo' AFTER student_id,
    ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'GRADE_UPDATED' AFTER message,
    ADD COLUMN related_id BIGINT NULL AFTER type,
    ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE AFTER related_id;

-- Mở rộng độ dài cột message lên 1000 ký tự
ALTER TABLE notifications MODIFY COLUMN message VARCHAR(1000) NOT NULL;

-- Indexes tối ưu truy vấn đếm unread và lấy thông báo mới nhất theo sinh viên
CREATE INDEX idx_notifications_student_read ON notifications (student_id, is_read);
CREATE INDEX idx_notifications_student_created ON notifications (student_id, created_at DESC);
