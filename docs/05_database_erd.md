# DATABASE ERD & DATA DICTIONARY

## 1. ERD (Entity Relationship Diagram)
```mermaid
erDiagram
    USERS ||--o| STUDENTS : "is a"
    USERS ||--o| LECTURERS : "is a"
    COURSES ||--o{ PREREQUISITES : "has"
    COURSES ||--o{ COURSE_CLASSES : "opens as"
    SEMESTERS ||--o{ COURSE_CLASSES : "held in"
    LECTURERS ||--o{ COURSE_CLASSES : "teaches"
    COURSE_CLASSES ||--o{ SCHEDULES : "has schedule"
    CLASSROOMS ||--o{ SCHEDULES : "takes place in"
    STUDENTS ||--o{ ENROLLMENTS : "registers"
    COURSE_CLASSES ||--o{ ENROLLMENTS : "contains"
    ENROLLMENTS ||--|| GRADES : "receives"

    USERS { int UserID PK string Role }
    STUDENTS { string StudentID PK string FullName }
    LECTURERS { string LecturerID PK }
    COURSES { string CourseID PK int Credits }
    SEMESTERS { string SemesterID PK }
    COURSE_CLASSES { string ClassID PK int MaxCapacity }
    SCHEDULES { int ScheduleID PK }
    CLASSROOMS { string RoomID PK }
    ENROLLMENTS { int EnrollmentID PK string Status }
    GRADES { int GradeID PK float FinalTotal }
```

## 2. Data Dictionary (Trọng yếu)

- **COURSE_CLASSES (Lớp học phần):**
  - `ClassID (PK)`: SE101.L01
  - `CourseID (FK)`: SE101
  - `Status`: IN ('Draft', 'Open', 'Closed', 'Graded')

- **ENROLLMENTS (Giao dịch Đăng ký):**
  - Bảng trung gian giải quyết quan hệ N-M giữa Sinh viên và Lớp học phần.
  - `EnrollmentID (PK)`: ID tự sinh.
  - `Status`: IN ('Enrolled', 'Dropped'). Cho phép Soft-delete.

- **GRADES (Bảng điểm):**
  - `EnrollmentID (FK)`: Unique relation 1-1 với Enrollment.
  - Điểm thành phần: `cc1_score`, `cc2_score`, `midterm_score`, `final_score`.
  - `total_score`, `letter_grade`, `gpa_point`: tính bằng Service Layer.
  - `is_finalized`: đã chốt & công bố cho sinh viên chưa.
  - `finalized_at`: mốc chốt; giảng viên được sửa trong 7 ngày kể từ mốc này, quá hạn thì khóa cứng.
