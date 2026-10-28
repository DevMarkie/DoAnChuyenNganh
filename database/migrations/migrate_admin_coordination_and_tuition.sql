-- Migration: Admin Coordination, Cashier Desk & Tuition Deadline
-- Bổ sung các trường phục vụ thu ngân tiền mặt và hạn nộp học phí

ALTER TABLE semesters
    ADD COLUMN tuition_deadline DATE NULL AFTER registration_end;

ALTER TABLE student_invoices
    ADD COLUMN paid_at DATETIME NULL AFTER status,
    ADD COLUMN paid_method VARCHAR(30) NULL DEFAULT 'CASH' AFTER paid_at,
    ADD COLUMN receipt_number VARCHAR(50) NULL AFTER paid_method,
    ADD COLUMN cashier_user_id BIGINT NULL AFTER receipt_number,
    ADD COLUMN extended_deadline DATE NULL AFTER cashier_user_id,
    ADD COLUMN extension_reason VARCHAR(255) NULL AFTER extended_deadline;

-- Khởi tạo hóa đơn học phí ban đầu cho các enrollments hiện có mà chưa có hóa đơn
INSERT IGNORE INTO student_invoices (student_id, section_id, credits, base_rate, coefficient, amount, status, created_at)
SELECT 
    e.student_id,
    e.section_id,
    COALESCE(sub.credits, 3) AS credits,
    CASE 
        WHEN cs.base_tuition_rate > 0 THEN cs.base_tuition_rate 
        ELSE 450000.00 
    END AS base_rate,
    COALESCE(cs.scale_coefficient, 1.00) AS coefficient,
    (COALESCE(sub.credits, 3) * CASE WHEN cs.base_tuition_rate > 0 THEN cs.base_tuition_rate ELSE 450000.00 END * COALESCE(cs.scale_coefficient, 1.00)) AS amount,
    'UNPAID' AS status,
    NOW() AS created_at
FROM enrollments e
JOIN course_sections cs ON e.section_id = cs.id
JOIN subjects sub ON cs.subject_id = sub.id
WHERE e.status = 'ENROLLED';
