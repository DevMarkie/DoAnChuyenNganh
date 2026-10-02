-- Phase 1 core academic rules.
-- Run once after schema.sql and before importing new application code.
USE student_management;

CREATE TABLE IF NOT EXISTS subject_prerequisites (
    subject_id INT NOT NULL,
    prerequisite_id INT NOT NULL,
    PRIMARY KEY (subject_id, prerequisite_id),
    CONSTRAINT fk_subject_prereq_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT fk_subject_prereq_required FOREIGN KEY (prerequisite_id) REFERENCES subjects(id),
    CONSTRAINT ck_subject_prereq_not_self CHECK (subject_id <> prerequisite_id)
);

ALTER TABLE enrollments
    ADD COLUMN enrollment_type ENUM('FIRST_TIME', 'RETAKE', 'IMPROVE') NOT NULL DEFAULT 'FIRST_TIME';

-- Add finalized_at if not present from older migrations
ALTER TABLE grades
    ADD COLUMN IF NOT EXISTS finalized_at DATETIME NULL AFTER is_finalized;

ALTER TABLE grades
    ADD COLUMN IF NOT EXISTS special_grade ENUM('NONE', 'V', 'I', 'M') NOT NULL DEFAULT 'NONE';

CREATE INDEX IF NOT EXISTS idx_subject_prerequisites_required ON subject_prerequisites (prerequisite_id);