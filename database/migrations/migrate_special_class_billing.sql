-- BA feature: regular-section cancellation and special-class billing.
-- Run after the base schema and before deploying the matching backend.

ALTER TABLE course_sections
    ADD COLUMN section_type ENUM('REGULAR', 'SPECIAL') NOT NULL DEFAULT 'REGULAR',
    ADD COLUMN min_students INT NOT NULL DEFAULT 1,
    ADD COLUMN scale_coefficient DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    ADD COLUMN base_tuition_rate DECIMAL(12,2) NOT NULL DEFAULT 0.00;

ALTER TABLE course_sections
    MODIFY COLUMN status ENUM('OPEN', 'ACTIVE', 'CLOSED', 'CANCELLED', 'PENDING_FEE', 'LOCKED_BILLING')
        NOT NULL DEFAULT 'OPEN';

CREATE TABLE class_opening_requests (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    student_id   BIGINT       NOT NULL,
    subject_id   INT          NOT NULL,
    semester_id  INT          NOT NULL,
    request_type ENUM('LEARN_AGAIN', 'IMPROVE', 'NEW') NOT NULL,
    status       ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_class_opening_requests PRIMARY KEY (id),
    CONSTRAINT uq_opening_request_student_course_semester UNIQUE (student_id, subject_id, semester_id),
    CONSTRAINT fk_opening_request_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_opening_request_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_opening_request_semester FOREIGN KEY (semester_id) REFERENCES semesters (id)
);

CREATE TABLE fee_scale_rules (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    min_students INT          NOT NULL,
    max_students INT          NOT NULL,
    coefficient  DECIMAL(3,2) NOT NULL,
    CONSTRAINT pk_fee_scale_rules PRIMARY KEY (id),
    CONSTRAINT ck_fee_scale_range CHECK (min_students >= 0 AND max_students >= min_students),
    CONSTRAINT ck_fee_scale_coefficient CHECK (coefficient > 0)
);

INSERT INTO fee_scale_rules (min_students, max_students, coefficient)
VALUES (0, 4, 2.00), (5, 9, 1.50), (10, 19, 1.30),
       (20, 29, 1.20), (30, 39, 1.10), (40, 2147483647, 1.00);

CREATE TABLE student_invoices (
    id          BIGINT         NOT NULL AUTO_INCREMENT,
    student_id  BIGINT         NOT NULL,
    section_id  BIGINT         NOT NULL,
    credits     INT            NOT NULL,
    base_rate   DECIMAL(12,2)  NOT NULL,
    coefficient DECIMAL(3,2)   NOT NULL,
    amount      DECIMAL(14,2)  NOT NULL,
    status      ENUM('UNPAID', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
    created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_student_invoices PRIMARY KEY (id),
    CONSTRAINT uq_invoice_student_section UNIQUE (student_id, section_id),
    CONSTRAINT fk_invoice_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_invoice_section FOREIGN KEY (section_id) REFERENCES course_sections (id)
);

CREATE TABLE notifications (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    student_id BIGINT       NOT NULL,
    message    VARCHAR(500) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notifications_student FOREIGN KEY (student_id) REFERENCES students (id)
);
