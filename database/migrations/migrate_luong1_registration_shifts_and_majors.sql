-- Migration: Bổ sung khung chia ca và phân bổ theo Ngành (Major) cho Đợt đăng ký tín chỉ
ALTER TABLE registration_waves
ADD COLUMN shift_name VARCHAR(100) NULL AFTER name,
ADD COLUMN major_id INT NULL AFTER department_id;

ALTER TABLE registration_waves
ADD CONSTRAINT fk_reg_waves_major FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL;

CREATE INDEX idx_reg_waves_major ON registration_waves (major_id);
