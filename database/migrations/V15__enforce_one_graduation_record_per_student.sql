-- V15__enforce_one_graduation_record_per_student.sql
-- Keep the most recently updated row for each student, then prevent future
-- duplicates.  The nested subquery makes this safe for MySQL's target-table
-- restriction when deleting from a table selected by the same statement.

DELETE FROM graduation_records
WHERE id IN (
    SELECT duplicate_id
    FROM (
        SELECT id AS duplicate_id,
               ROW_NUMBER() OVER (
                   PARTITION BY student_id
                   ORDER BY updated_at DESC, id DESC
               ) AS duplicate_rank
        FROM graduation_records
    ) AS ranked_records
    WHERE duplicate_rank > 1
);

ALTER TABLE graduation_records
    ADD CONSTRAINT uk_graduation_records_student UNIQUE (student_id);
