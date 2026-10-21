USE student_management;

-- Activity #14 — cửa sổ ân hạn sau khi chốt điểm.
-- Giảng viên vẫn sửa được điểm trong 7 ngày kể từ lúc chốt; hết hạn thì khoá cứng
-- (chỉ Quản trị viên mở lại được).

ALTER TABLE grades
    ADD COLUMN finalized_at DATETIME NULL
    COMMENT 'Thời điểm chốt; GV được sửa trong 7 ngày kể từ mốc này'
    AFTER is_finalized;

-- Dữ liệu cũ đã chốt: lấy updated_at làm mốc chốt (thường đã quá 7 ngày -> khoá).
UPDATE grades
SET finalized_at = updated_at
WHERE is_finalized = TRUE AND finalized_at IS NULL;
