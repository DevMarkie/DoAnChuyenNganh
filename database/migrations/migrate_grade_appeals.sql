-- Task 3: grade appeal workflow
CREATE TABLE IF NOT EXISTS grade_appeals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    enrollment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    score_component ENUM('CC2', 'MIDTERM', 'FINAL', 'ALL') NOT NULL DEFAULT 'FINAL',
    current_score DECIMAL(4,2) NOT NULL,
    desired_score DECIMAL(4,2) NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewer_id BIGINT NULL,
    review_notes TEXT NULL,
    new_score DECIMAL(4,2) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    CONSTRAINT pk_grade_appeals PRIMARY KEY (id),
    CONSTRAINT fk_appeal_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE,
    CONSTRAINT fk_appeal_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_appeal_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id)
);
CREATE INDEX idx_appeals_student ON grade_appeals (student_id);
CREATE INDEX idx_appeals_status ON grade_appeals (status);
