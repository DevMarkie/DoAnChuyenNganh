# TÀI LIỆU TỔNG QUAN DỰ ÁN — HỆ THỐNG QUẢN LÝ SINH VIÊN (SMS)

> **Student Management System** — Đồ án chuyên ngành.
> Tài liệu này mô tả **đầy đủ** kiến trúc, công nghệ, mô hình dữ liệu, phân quyền, API, quy tắc nghiệp vụ, kiểm thử và cách triển khai của hệ thống. Nội dung được rút trực tiếp từ mã nguồn (không phải từ README, vì README có vài chỗ lệch với seed thực tế — xem [Phần 14](#14-ghi-chú--khác-biệt-cần-lưu-ý)).

---

## Mục lục
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Mô hình dữ liệu (13 thực thể)](#5-mô-hình-dữ-liệu-13-thực-thể)
6. [Phân quyền & tài khoản](#6-phân-quyền--tài-khoản)
7. [Bảo mật](#7-bảo-mật)
8. [Danh sách API đầy đủ](#8-danh-sách-api-đầy-đủ)
9. [Quy tắc nghiệp vụ (Business Rules)](#9-quy-tắc-nghiệp-vụ-business-rules)
10. [Frontend (React)](#10-frontend-react)
11. [Kiểm thử](#11-kiểm-thử)
12. [Triển khai & chạy dự án](#12-triển-khai--chạy-dự-án)
13. [Biểu đồ UML](#13-biểu-đồ-uml)
14. [Ghi chú & khác biệt cần lưu ý](#14-ghi-chú--khác-biệt-cần-lưu-ý)

---

## 1. Giới thiệu tổng quan

Hệ thống Quản lý Sinh viên (SMS) là ứng dụng web phục vụ 3 nhóm người dùng: **Quản trị viên (ADMIN)**, **Giảng viên (LECTURER)** và **Sinh viên (STUDENT)**. Hệ thống cho phép:

- **Quản trị viên**: quản lý toàn bộ danh mục (sinh viên, giảng viên, khoa, lớp, môn học, học kỳ, lớp học phần, thời khóa biểu), xếp lớp học phần cho sinh viên (đơn lẻ / hàng loạt), duyệt yêu cầu cấp lại mật khẩu, xem bảng điểm bất kỳ, mở/khóa điểm.
- **Giảng viên**: xem lớp học phần phụ trách, xem danh sách sinh viên, nhập & khóa điểm, xuất bảng điểm Excel, xem lịch giảng dạy.
- **Sinh viên**: đăng ký / hủy đăng ký học phần, xem học phần đã đăng ký, xem thời khóa biểu, xem bảng điểm cá nhân (GPA/CPA), xem hồ sơ.

Kiến trúc **client–server tách rời**: frontend SPA (React) gọi REST API của backend (Spring Boot) qua JWT; dữ liệu lưu ở MySQL.

---

## 2. Công nghệ sử dụng

### 2.1 Backend
| Thành phần | Phiên bản / lựa chọn |
|---|---|
| Ngôn ngữ | **Java 21** |
| Framework | **Spring Boot 3.2.0** (`spring-boot-starter-web`, `data-jpa`, `security`, `validation`, `mail`) |
| Bảo mật | Spring Security + **JWT `io.jsonwebtoken` (jjwt) 0.12.6** |
| CSDL | **MySQL 8** (connector `mysql-connector-j`), JPA/Hibernate |
| Connection pool | **HikariCP** (max pool = 15) |
| Tài liệu API | **springdoc-openapi 2.3.0** (Swagger UI) |
| Xuất Excel | **Apache POI `poi-ooxml` 5.2.5** |
| Tiện ích | **Lombok 1.18.42**, spring-boot-devtools |
| Đóng gói | Maven (`com.sms:student-management:1.0.0`), main class `com.sms.StudentManagementApplication` (`@SpringBootApplication @EnableCaching`) |

> Không dùng MapStruct — việc map DTO ↔ entity làm thủ công bằng Lombok builder.

### 2.2 Frontend
| Thành phần | Phiên bản / lựa chọn |
|---|---|
| Thư viện UI | **React 19** |
| Build tool | **Vite 8** (`@vitejs/plugin-react`) |
| Định tuyến | **react-router-dom 7** |
| Quản lý state | **Zustand 5** |
| Gọi API | **Axios 1.19** (có interceptor) |
| JWT | **jwt-decode 4** |
| Biểu đồ | **Recharts 3** |
| Thông báo | **react-toastify 11** |
| Icon | **lucide-react** |
| Ngày tháng | **date-fns 4** |
| Kiểm thử | **Vitest 5** + **jsdom** |

> Styling dùng **CSS thuần** (không khai báo Tailwind/Bootstrap trong `package.json`).

### 2.3 Hạ tầng
- **Docker Compose**: 3 service — `db` (MySQL 8.0), `backend`, `frontend` (Nginx).
- Dockerfile đa tầng (multi-stage) cho cả backend (Temurin 21) và frontend (Node 20 build → Nginx serve).

## 3. Kiến trúc hệ thống

Backend tổ chức theo mô hình **phân tầng (layered)**:

```
Client (React SPA)
      │  HTTP + JWT (Authorization: Bearer)
      ▼
Controller  ──►  Service  ──►  Repository (Spring Data JPA)  ──►  MySQL
   (REST)       (nghiệp vụ)        (truy vấn)
      ▲
      └── Security: JwtAuthFilter → SecurityContext → @PreAuthorize
```

- **Controller**: nhận request, kiểm tra quyền (path rule + `@PreAuthorize`), trả về `ApiResponse<T>`.
- **Service**: chứa toàn bộ logic nghiệp vụ (đăng ký, tính điểm, khóa điểm, reset mật khẩu…).
- **Repository**: interface Spring Data JPA, có truy vấn tùy biến (`@Query`) và **khóa bi quan** cho đăng ký.
- **Security**: `JwtAuthFilter` (OncePerRequestFilter) đặt trước `UsernamePasswordAuthenticationFilter`, xác thực token và nạp `UserPrincipal` vào `SecurityContext`.
- **Xử lý lỗi tập trung**: `@RestControllerAdvice GlobalExceptionHandler`.

Frontend là **SPA** với định tuyến phía client, bảo vệ route theo vai trò (`ProtectedRoute`), lazy-load từng trang.

---

## 4. Cấu trúc thư mục

```
DoAnChuyenNganh/
├─ backend/                     # Spring Boot
│  ├─ src/main/java/com/sms/
│  │  ├─ controller/            # REST controllers
│  │  ├─ service/               # Nghiệp vụ
│  │  ├─ repository/            # Spring Data JPA
│  │  ├─ entity/                # 13 JPA entities
│  │  ├─ dto/                   # Request/Response DTO
│  │  ├─ config/                # SecurityConfig, ...
│  │  ├─ security/              # JwtAuthFilter, JwtUtil, UserPrincipal, UserDetailsServiceImpl
│  │  ├─ exception/             # GlobalExceptionHandler, BadRequestException, ResourceNotFoundException
│  │  └─ StudentManagementApplication.java
│  ├─ src/main/resources/application.properties
│  ├─ src/test/java/com/sms/    # JUnit tests
│  └─ Dockerfile
├─ frontend/                    # React + Vite
│  ├─ src/{pages,components,services,store,hooks}
│  └─ Dockerfile
├─ database/                    # schema.sql, seed.sql, migrate_*.sql
├─ tests/                       # Node E2E / stress test (.js) + report .md
├─ drawio/                      # Biểu đồ UML (.drawio)
├─ docs/                        # Tài liệu (file này)
├─ docker-compose.yml
├─ start_dev.bat / run_tests.bat
└─ README.md / DEPLOY_GUIDE.md
```

---

## 5. Mô hình dữ liệu (13 thực thể)

| # | Entity | Bảng | Trường/quan hệ chính |
|---|---|---|---|
| 1 | **User** | `users` | username(uniq), password(BCrypt), email(uniq), `isActive`, **`mustChangePassword`**, `@ManyToOne` Role |
| 2 | **Role** | `roles` | id, name(uniq) — ADMIN / LECTURER / STUDENT |
| 3 | **Student** | `students` | studentCode(uniq), fullName, dateOfBirth, gender, email, phone, address, status; `@OneToOne` User, `@ManyToOne` ClassEntity |
| 4 | **Lecturer** | `lecturers` | lecturerCode(uniq), fullName, email, phone, degree/title; `@OneToOne` User, `@ManyToOne` Department |
| 5 | **Department** | `departments` | code(uniq), name(uniq), isActive |
| 6 | **ClassEntity** | `classes` | code(uniq), name, academicYear, isActive; `@ManyToOne` Department |
| 7 | **Subject** | `subjects` | subjectCode(uniq), subjectName, **credits (số tín chỉ)**; `@ManyToOne` Department |
| 8 | **Semester** | `semesters` | semesterCode(uniq), academicYear, semesterNumber, start/end, **registrationStart/End**, isCurrent, status {UPCOMING, ACTIVE, COMPLETED}; `isRegistrationOpen()` |
| 9 | **CourseSection** | `course_sections` | sectionCode(uniq), maxStudents, **enrolledCount**, room, status(OPEN…); `@ManyToOne` Subject/Lecturer/Semester |
| 10 | **Enrollment** | `enrollments` | enrolledAt, status {ENROLLED, CANCELLED, …}; `@ManyToOne` Student/CourseSection |
| 11 | **Grade** | `grades` | attendanceScore, midtermScore, finalScore, totalScore, letterGrade, gpaPoint, **isFinalized**; `@OneToOne` Enrollment; `calculateTotalScore()`, `calculateLetterGrade()` |
| 12 | **Schedule** | `schedules` | dayOfWeek, startPeriod, endPeriod, room, start/end date; `@ManyToOne` CourseSection, `@ManyToOne` ClassEntity(nullable) |
| 13 | **PasswordResetRequest** | `password_reset_requests` | username, fullName, role, email, phone, reason, status {PENDING, APPROVED, REJECTED}, adminNotes, processedBy/At; `@ManyToOne` User |

**Quan hệ tóm tắt:** User 1–1 Student / Lecturer; User *–1 Role; Student *–1 ClassEntity; ClassEntity/Lecturer/Subject *–1 Department; CourseSection *–1 Subject/Lecturer/Semester; Enrollment *–1 Student và *–1 CourseSection; Grade 1–1 Enrollment; Schedule *–1 CourseSection.

Repository tương ứng: 13 interface Spring Data JPA. Đáng chú ý `CourseSectionRepository.findByIdForEnrollment(id)` dùng **`@Lock(PESSIMISTIC_WRITE)`** để chống tranh chấp khi nhiều SV đăng ký cùng lúc.

## 6. Phân quyền & tài khoản

Hệ thống dùng **RBAC** với 3 vai trò lưu ở bảng `roles`: `ADMIN`, `LECTURER`, `STUDENT`. Quyền được kiểm soát 2 lớp:
1. **Path rule** trong `SecurityConfig` (ví dụ `/api/admin/**` = ADMIN).
2. **Method-level** `@PreAuthorize("hasRole/hasAnyRole(...)")` trên controller.

### Tài khoản mẫu (từ `database/seed.sql`)
Tất cả tài khoản seed dùng chung mật khẩu **`123456`** (cùng một hash BCrypt).

| Vai trò | Tài khoản đăng nhập | Mật khẩu |
|---|---|---|
| Admin | `admin` | `123456` |
| Giảng viên | `1000001` … `1000025` (**25 giảng viên**) | `123456` |
| Sinh viên | `2300001`, `2300002`, … (email `@sv.sms.edu.vn`) | `123456` |

> ⚠️ **Lưu ý:** `README.md` và banner của `start_dev.bat` ghi mã sinh viên mẫu là `2500001` và giảng viên `1000001–1000015`, nhưng **seed thực tế** dùng sinh viên bắt đầu từ `2300001` và giảng viên `1000001–1000025`. Khi demo hãy đăng nhập bằng **`2300001`** (không phải 2500001). Xem [Phần 14](#14-ghi-chú--khác-biệt-cần-lưu-ý).

Seeding **hoàn toàn bằng SQL** (không có `DataInitializer`/`CommandLineRunner` trong Java). Docker nạp `schema.sql` (01) rồi `seed.sql` (02) qua entrypoint của MySQL.

---

## 7. Bảo mật

- **Xác thực JWT (stateless)**: thuật toán **HS512**; claim gồm `sub`(username), `role`, `userId`, `email`, `iat`, `exp`. Hạn token mặc định **86.400.000 ms = 24 giờ** (`app.jwt.expiration`, env `JWT_EXPIRATION`). Secret lấy từ env `JWT_SECRET` (base64); nếu để trống, hệ thống **tự sinh khóa HS512 ngẫu nhiên lúc khởi động** (token sẽ mất hiệu lực sau mỗi lần restart).
- **Mật khẩu**: mã hóa **BCrypt** (`BCryptPasswordEncoder`).
- **Chống dò mật khẩu (brute-force)**: `LoginAttemptService` khóa tài khoản sau **5 lần sai liên tiếp** trong **15 phút** (lưu bộ đếm in-memory theo username).
- **Chống dò tài khoản (user enumeration)**: `/api/auth/forgot-password` luôn trả về **cùng một thông báo chung** dù tài khoản có tồn tại hay không.
- **Chống chiếm tài khoản qua email**: khi admin duyệt reset, email gửi tới **email trên hồ sơ** (Student/Lecturer), **không** dùng email do người yêu cầu tự nhập; đặt `mustChangePassword=true`.
- **Session STATELESS**, tắt CSRF (vì dùng JWT), bật `@EnableMethodSecurity`.
- **CORS**: origin lấy từ `app.cors.allowed-origins` (mặc định `localhost:5173/3000`, `127.0.0.1:5173`, `*.trycloudflare.com`, `*.github.io`); cho phép GET/POST/PUT/DELETE/OPTIONS/PATCH, `allowCredentials=true`, exposed headers `Authorization/Link/X-Total-Count`.
- **Endpoint công khai**: `/api/auth/**` và Swagger (`/swagger-ui/**`, `/api-docs/**`, `/v3/api-docs/**`). Mọi `GET /api/**` yêu cầu đăng nhập; các thao tác ghi (POST/PUT/DELETE) yêu cầu vai trò phù hợp.
- **Khóa bi quan (pessimistic lock)** khi đăng ký học phần để tránh vượt sĩ số do đăng ký đồng thời.

### Định dạng phản hồi chuẩn — `ApiResponse<T>`
```json
{ "success": true, "message": "Thành công", "data": { } }
```
`GlobalExceptionHandler` ánh xạ lỗi: 404 (không tìm thấy), 400 (dữ liệu sai / validation), 401 (sai đăng nhập), 403 (không đủ quyền), 500 (lỗi hệ thống).

## 8. Danh sách API đầy đủ

Base URL: `http://localhost:8080/api`. Quyền: **Public** = không cần token; **Auth** = cần đăng nhập; còn lại ghi rõ vai trò.

### AuthController — `/api/auth`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| POST | `/login` | Đăng nhập, trả JWT + LoginResponse | Public |
| POST | `/forgot-password` | Gửi yêu cầu cấp lại mật khẩu (thông báo chung) | Public |
| PUT | `/change-password` | Đổi mật khẩu của chính mình | Auth |
| POST | `/logout` | Xác nhận đăng xuất (stateless) | Auth |

### StudentController — `/api/students`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| GET | `/`, `/paged`, `/{id}`, `/search`, `/class/{classId}` | Danh sách / phân trang / chi tiết / tìm kiếm | ADMIN |
| GET | `/me` | Hồ sơ sinh viên hiện tại | STUDENT |
| POST/PUT | `/`, `/{id}`, `/{id}/status` | Thêm / sửa / đổi trạng thái | ADMIN |

### LecturerController — `/api/lecturers`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| GET | `/`, `/{id}`, `/search` | Danh sách / chi tiết / tìm kiếm | ADMIN |
| GET | `/me` | Hồ sơ giảng viên hiện tại | LECTURER |
| POST/PUT | `/`, `/{id}`, `/{id}/toggle` | Thêm / sửa / bật-tắt | ADMIN |

### DepartmentController — `/api/departments`
| Method | Path | Quyền |
|---|---|---|
| GET | `/`, `/active`, `/{id}`, `/search` | Auth |
| POST/PUT/DELETE | `/`, `/{id}`, `/{id}/toggle` | ADMIN |

### ClassController — `/api/classes`
| Method | Path | Quyền |
|---|---|---|
| GET | `/`, `/{id}`, `/department/{departmentId}` | Auth |
| GET | `/{id}/students` | ADMIN, LECTURER |
| POST/PUT | `/`, `/{id}`, `/{id}/toggle` | ADMIN |

### SubjectController — `/api/subjects`
| Method | Path | Quyền |
|---|---|---|
| GET | `/`, `/{id}`, `/search` | Auth |
| POST/PUT | `/`, `/{id}`, `/{id}/toggle` | ADMIN |

### SemesterController — `/api/semesters`
| Method | Path | Quyền |
|---|---|---|
| GET | `/`, `/{id}`, `/current` | Auth |
| POST/PUT | `/`, `/{id}`, `/{id}/set-current` | ADMIN |

### CourseSectionController — `/api/course-sections`
| Method | Path | Quyền |
|---|---|---|
| GET | `/`, `/paged`, `/{id}`, `/semester/{semesterId}`, `/semester/{semesterId}/open`, `/my-sections` | Auth (my-sections: giảng viên) |
| POST/PUT | `/`, `/{id}` | ADMIN |

### ScheduleController — `/api/schedules`
| Method | Path | Quyền |
|---|---|---|
| GET | `/`, `/{id}`, `/my-schedule`, `/lecturer-schedule` | Auth |
| POST/PUT/DELETE | `/`, `/{id}` | ADMIN |

### EnrollmentController — `/api/enrollments`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| GET | `/my` | Học phần đã ĐK của SV | STUDENT |
| GET | `/section/{sectionId}` | DS đăng ký của lớp HP | ADMIN, LECTURER |
| POST | `/` | Đăng ký học phần | STUDENT |
| DELETE | `/{id}` | Hủy đăng ký | STUDENT |

### GradeController — `/api/grades`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| GET | `/section/{sectionId}` | Bảng điểm lớp HP | ADMIN, LECTURER |
| GET | `/section/{sectionId}/export` | Xuất Excel | ADMIN, LECTURER |
| PUT | `/`, `/batch` | Lưu điểm đơn / hàng loạt | ADMIN, LECTURER |

### TranscriptController — `/api/transcript`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| GET | `/me` | Bảng điểm cá nhân | STUDENT |
| GET | `/student/{studentId}` | Bảng điểm SV bất kỳ | ADMIN |

### DashboardController — `/api/dashboard`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| GET | `/` | Thống kê theo vai trò | Auth |

### AdminEnrollmentController — `/api/admin/enrollments`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| POST | `/assign` | Xếp 1 SV vào lớp HP | ADMIN |
| POST | `/batch-assign-class` | Xếp cả lớp vào lớp HP | ADMIN |

### AdminPasswordResetController — `/api/admin/password-resets`
| Method | Path | Chức năng | Quyền |
|---|---|---|---|
| GET | `/`, `/pending-count` | Danh sách / đếm chờ duyệt | ADMIN |
| POST | `/{id}/approve`, `/{id}/reject` | Duyệt / từ chối | ADMIN |
| POST | `/batch-approve`, `/batch-reject` | Xử lý hàng loạt | ADMIN |

## 9. Quy tắc nghiệp vụ (Business Rules)

### 9.1 Đăng ký học phần (`EnrollmentService.enroll`)
Đăng ký thành công phải qua **tất cả** kiểm tra sau (sai bất kỳ → ném `BadRequestException`, rollback):
1. **Thời gian đăng ký**: `Semester.isRegistrationOpen()` = isCurrent && status ACTIVE && hôm nay ∈ [registrationStart, registrationEnd]. Sai → "Hiện không trong thời gian đăng ký".
2. **Lớp HP đang mở**: `status = OPEN`. Sai → "Học phần đã đóng đăng ký".
3. **Chưa đăng ký trùng**: không có bản ghi ENROLLED cho cùng SV+lớp HP. Sai → "Sinh viên đã đăng ký học phần này". (Bản ghi CANCELLED sẽ được tái sử dụng khi đăng ký lại.)
4. **Còn chỗ**: `enrolledCount < maxStudents`. Sai → "Học phần đã đầy".
5. **Giới hạn tín chỉ**: tổng tín chỉ trong học kỳ **≤ 30** (`MAX_CREDITS_PER_SEMESTER = 30`). Vượt → "Vượt quá 30 tín chỉ/học kỳ".
6. **Không trùng lịch**: so lịch lớp mới với các lớp đã ĐK — cùng `dayOfWeek` và **giao nhau tiết học** → "Trùng lịch học!".
7. **Khóa bi quan**: `findByIdForEnrollment` khóa dòng lớp HP (`PESSIMISTIC_WRITE`) để tuần tự hóa thay đổi sĩ số.

**Hủy đăng ký** (`cancelEnrollment`): phải là chủ sở hữu; trạng thái đang ENROLLED; **không hủy được nếu đã có điểm** (kể cả điểm thành phần).

**Xếp lớp bởi Admin** (`adminAssign`, `adminBatchAssignClass`): kiểm tra sức chứa; xếp hàng loạt sẽ từ chối cả lớp nếu vượt sĩ số.

### 9.2 Tính điểm & xếp loại (`Grade`)
**Điểm tổng kết** = `Chuyên cần × 10% + Giữa kỳ × 30% + Cuối kỳ × 60%` (làm tròn HALF_UP 2 chữ số; chỉ tính khi đủ 3 thành phần).

| Điểm tổng kết | Xếp loại | Điểm hệ 4 |
|---|---|---|
| ≥ 8.5 | A | 4.0 |
| ≥ 8.0 | B+ | 3.5 |
| ≥ 7.0 | B | 3.0 |
| ≥ 6.5 | C+ | 2.5 |
| ≥ 5.5 | C | 2.0 |
| ≥ 5.0 | D+ | 1.5 |
| ≥ 4.0 | D | 1.0 |
| còn lại | F | 0.0 |

- **Điểm liệt**: nếu **điểm cuối kỳ < 3.0** → ép xếp loại **F / 0.0** bất kể tổng điểm.
- **Đạt**: tổng ≥ 4.0 **và** cuối kỳ ≥ 3.0.

### 9.3 Khóa / mở khóa điểm (`GradeService.applyGradeChanges`)
- **BR-07**: giảng viên chỉ nhập điểm cho **lớp mình phụ trách**; nếu không → 403.
- Nếu `isFinalized = true` và người thao tác là **giảng viên** → không sửa được ("liên hệ Quản trị viên").
- Khóa điểm (`finalize = true`): đặt `isFinalized = true` (sinh viên mới thấy điểm); yêu cầu đã có điểm tổng kết.
- **Admin** có thể **mở khóa** (gửi `finalize = false`) để sửa lại; có ghi log audit khi khóa/mở khóa.

### 9.4 Bảng điểm & GPA/CPA (`TranscriptService`)
- **GPA học kỳ**: trung bình có trọng số theo tín chỉ của mọi môn đã có điểm (F = 0).
- **CPA tích lũy**: khử trùng môn học lại (giữ lần thi mới nhất mỗi môn); tín chỉ tích lũy chỉ tính môn **đạt** (gpa > 0).
- Chỉ hiển thị các điểm **đã khóa** (`findFinalizedByStudentId`).

### 9.5 Đăng nhập & khóa tài khoản (`LoginAttemptService`)
- **5 lần** sai liên tiếp → khóa **15 phút**; đếm reset khi đăng nhập đúng hoặc hết hạn khóa.

### 9.6 Cấp lại / đổi mật khẩu
- **Quên mật khẩu**: chỉ STUDENT/LECTURER đủ điều kiện; tạo yêu cầu PENDING; thông báo chung (chống dò tài khoản). Có thể tra theo username / mã SV / mã GV.
- **Admin duyệt**: đặt mật khẩu mới (do admin nhập hoặc **random 8 ký tự** qua SecureRandom), BCrypt, `mustChangePassword=true`, gửi email tới **email trên hồ sơ** (che bớt), ghi processedBy/At.
- **Đổi mật khẩu** (`changePassword`): kiểm tra mật khẩu hiện tại (BCrypt), đặt mật khẩu mới, xóa cờ `mustChangePassword`.

## 10. Frontend (React)

### 10.1 Cấu trúc `frontend/src`
- `App.jsx`, `main.jsx` — điểm vào, khai báo route.
- `components/common/` — `ErrorBoundary`, `LoadingFallback`.
- `components/layout/` — `Header`, `Sidebar`, `Layout`.
- `pages/auth/` — PortalHub + 3 trang đăng nhập theo vai trò (Student/Lecturer/Admin) + PortalLogin.
- `pages/admin/` — 11 trang: Dashboard, Students, Departments, Classes, Subjects, Lecturers, Semesters, CourseSections, Schedules, Grades, PasswordResets.
- `pages/lecturer/` — Dashboard, MySections, LecturerSchedule, GradeEntry, LecturerProfile.
- `pages/student/` — Dashboard, StudentSchedule, Enroll, MyEnrollments, Transcript, StudentProfile.
- `services/` — `api.js` (axios), `dataService.js` (gói các endpoint).
- `store/` — `authStore.js` (Zustand), `themeStore.js`.
- `hooks/` — `useDebounce.js`.

### 10.2 Định tuyến & bảo vệ theo vai trò (`App.jsx`)
- Trang công khai: `/login` (PortalHub), `/student/login`, `/lecturer/login`, `/admin/login` (nếu đã đăng nhập sẽ chuyển về dashboard theo vai trò).
- `ProtectedRoute` bọc theo nhóm vai trò: chưa đăng nhập → chuyển về trang login phù hợp; sai vai trò → chuyển về dashboard của chính mình.
- Route ADMIN/LECTURER/STUDENT ứng với các trang ở mục 10.1. Catch-all `*` → điều hướng mặc định theo vai trò.
- Toàn bộ trang **lazy-load** (React.lazy) để giảm bundle ban đầu.

### 10.3 Quản lý token
- **`authStore.js`** (Zustand): lưu `token`, `user`, `isAuthenticated` trong bộ nhớ **và localStorage**. Khi nạp module sẽ dùng `jwt-decode` kiểm tra hạn (đệm 60s), xóa token hết hạn. `login()` lưu localStorage; `logout()` gọi API rồi xóa.
- **`api.js`** (axios, baseURL `VITE_API_URL || '/api'`, timeout 15s): **request interceptor** gắn `Authorization: Bearer <token>`; **response interceptor** thử lại 1 lần khi timeout/502/503, và khi **401 (hoặc 403 kèm token)** thì xóa token và chuyển về `#/`.

---

## 11. Kiểm thử

### 11.1 Backend — JUnit (`backend/src/test/java/com/sms/`)
`GradeServiceTest`, `TranscriptServiceTest`, `PasswordResetServiceTest`, `ApiSerializationTests`, `StudentManagementApplicationTests`.

### 11.2 Frontend — Vitest (`frontend/src`)
- `store/authStore.test.js` — khởi tạo/hết hạn token, login/logout, checkAuth.
- `services/dataService.test.js` — kiểm tra URL/method/payload của từng endpoint.
- Chạy: `npm run test` (vitest run) hoặc `npm run test:watch`.

### 11.3 Kiểm thử hệ thống — Node (`tests/`, chạy qua `run_tests.bat`)
| File | Nội dung |
|---|---|
| `comprehensive_system_test.js` | ~56–70 case: bảo mật (SQLi, XSS, buffer overflow, JWT giả mạo), RBAC & leo thang đặc quyền, validation/biên, nghiệp vụ BR-01…BR-08, transcript/GPA/CPA, đổi/quên mật khẩu, đồng thời. |
| `overload_stress_test.js` | Áp lực/tải: RPS, độ trễ p50/p90/p95/p99, hàng đợi HikariCP (pool = 15), BCrypt dưới tải, kịch bản đăng ký dồn dập, phục hồi sau stress. |
| `system_e2e_test.js` | 39 case E2E/tích hợp toàn stack. |

Báo cáo lưu tại `tests/COMPREHENSIVE_TEST_REPORT.md`, `OVERLOAD_TEST_REPORT.md`, `TEST_REPORT.md`.
> Yêu cầu: backend đang chạy ở cổng 8080 trước khi chạy test.

## 12. Triển khai & chạy dự án

### 12.1 Docker Compose (`docker-compose.yml`)
| Service | Image / Build | Cổng (host:container) | Ghi chú |
|---|---|---|---|
| `db` | mysql:8.0 | 3308:3306 | `MYSQL_ALLOW_EMPTY_PASSWORD=yes`, DB `student_management`, nạp `seed.sql` khi khởi tạo |
| `backend` | build `./backend` | 8080:8080 | phụ thuộc `db`, biến `SPRING_DATASOURCE_*`, `JWT_SECRET`, `APP_CORS_ALLOWED_ORIGINS` |
| `frontend` | build `./frontend` | 80:80 (và 5173 khi dev) | Nginx phục vụ bản build tĩnh |

### 12.2 Dockerfile
- **backend**: multi-stage — build bằng Maven + Temurin **JDK 21**, chạy trên JRE Temurin 21.
- **frontend**: build bằng **Node 20** (`npm run build`) → phục vụ bằng **Nginx** (`nginx.conf` proxy `/api` sang backend).

### 12.3 Chạy nhanh trên Windows
| Script | Tác dụng |
|---|---|
| `start_dev.bat` | Khởi động MySQL (docker) + backend (mvn) + frontend (vite) cho môi trường phát triển |
| `run_tests.bat` | Chạy bộ test Node trong `tests/` |

Chạy thủ công:
```bash
# Backend
cd backend && mvn spring-boot:run          # http://localhost:8080  (Swagger: /swagger-ui.html)
# Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

---

## 13. Biểu đồ UML (thư mục `drawio/`)
Mở bằng [draw.io](https://app.diagrams.net) (hoặc extension draw.io trong VS Code). Tất cả đã ép nền trắng (`background="#ffffff"`).

| File | Loại biểu đồ | Nội dung |
|---|---|---|
| `01_UseCase.drawio` | Use Case | 3 actor (Sinh viên/Giảng viên/Quản trị) + toàn bộ use case, quan hệ «extend» |
| `02_Sequence.drawio` | Tuần tự | 3 trang: Đăng nhập, Đăng ký học phần, Nhập & khóa điểm (có lifeline Boundary→Control→Service→Repository→Entity) |
| `03_Activity.drawio` | Hoạt động | 2 trang: Đăng ký học phần (6 điều kiện), Nhập & khóa điểm (điểm liệt + finalize) |
| `04_ClassBCE.drawio` | Lớp phân tích BCE | Boundary–Control–Entity + 13 thực thể và quan hệ (bội số) |

> **Lưu ý hiển thị:** nếu nền vẫn tối, chuyển giao diện draw.io sang **Light theme** (Extras → Theme), hoặc khi xuất ảnh chọn **Background: White**.

---

## 14. Ghi chú & khác biệt cần lưu ý

### 14.1 Tài khoản seed (⚠️ khác với README/`start_dev.bat`)
Dữ liệu thực trong `seed.sql`:
- **Sinh viên:** mã bắt đầu từ **2300001** (README ghi nhầm 2500001).
- **Giảng viên:** mã **1000001 – 1000025** (25 GV; README/bat ghi 15).
- **Mật khẩu mặc định:** `123456` cho mọi tài khoản seed.
- **Đăng nhập demo nên dùng:** SV `2300001` / MK `123456`.

### 14.2 Bảo mật cần chú ý khi triển khai thật
- `JWT_SECRET` để trống → khóa ký JWT **sinh ngẫu nhiên mỗi lần khởi động** (token cũ mất hiệu lực sau restart). Đặt biến môi trường `JWT_SECRET` cố định khi chạy production.
- MySQL trong docker dùng **mật khẩu root rỗng** (chỉ hợp cho môi trường học tập/local, KHÔNG dùng production).
- CORS lấy từ `app.cors.allowed-origins` — cần cấu hình đúng domain khi deploy.
- CSRF tắt do dùng JWT stateless; nên đặt sau reverse proxy HTTPS.

### 14.3 Giới hạn hiện tại
- Chưa có refresh token (token 24h, hết hạn phải đăng nhập lại).
- LoginAttemptService & lockout lưu **trong bộ nhớ** → reset khi restart và không chia sẻ giữa nhiều instance.
- "Quên mật khẩu" tạo yêu cầu chờ ADMIN duyệt (không gửi email tự động).

---

*Tài liệu này mô tả toàn bộ kiến trúc, công nghệ, nghiệp vụ, bảo mật, kiểm thử và triển khai của Hệ thống Quản lý Sinh viên. Cập nhật cùng mã nguồn khi có thay đổi.*






