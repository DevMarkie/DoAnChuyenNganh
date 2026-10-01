-- ============================================================
-- Migration: Thêm cột must_change_password vào bảng users
-- Ngày: 2026-09-25
-- Mô tả: Bắt buộc sinh viên/giảng viên đổi mật khẩu lần đầu
--         hoặc sau khi được Admin cấp lại mật khẩu tạm.
-- ============================================================

-- Chạy lệnh này nếu cột chưa tồn tại trong DB hiện tại:
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Đặt flag cho tất cả user đang có mật khẩu mặc định '123456' (BCrypt hash)
-- Lưu ý: Vì BCrypt không thể so sánh ngược, bỏ qua bước này nếu không xác định được.
-- Admin có thể kích hoạt thủ công: UPDATE users SET must_change_password = TRUE WHERE id IN (...);
