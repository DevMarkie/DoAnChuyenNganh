USE student_management;

-- Keep capacity consistent with existing registrations loaded by the seed data.
UPDATE course_sections cs
SET enrolled_count = (
    SELECT COUNT(*)
    FROM enrollments e
    WHERE e.section_id = cs.id
      AND e.status <> 'CANCELLED'
),
max_students = GREATEST(
    cs.max_students,
    (
        SELECT COUNT(*)
        FROM enrollments e
        WHERE e.section_id = cs.id
          AND e.status <> 'CANCELLED'
    )
)
WHERE EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.section_id = cs.id
);