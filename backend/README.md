# 🧠 BACKEND - HỆ THỐNG QUẢN LÝ ĐÀO TẠO (SMS)
**Spring Boot 3.5.6 · Java 23 · RESTful API & Business Core**

Tầng Backend đảm nhiệm toàn bộ xử lý nghiệp vụ, bảo mật, xác thực người dùng và tính toán học chế tín chỉ cho dự án.

---

## 🛠️ Công nghệ cốt lõi

* **Ngôn ngữ:** Java 23 (LTS features)
* **Framework:** Spring Boot 3.5.6 (Spring Web, Spring Data JPA, Spring Security, Spring Validation)
* **Xác thực:** JWT (JSON Web Token) kép (Access Token + Refresh Token), Password Encryptor BCrypt
* **CSDL & ORM:** MySQL Connector 8.0, Hibernate ORM
* **Báo cáo & Tiện ích:** Apache POI (xử lý Import/Export file Excel)
* **Kiểm thử:** JUnit 5, Mockito

---

## 📁 Cấu trúc mã nguồn

```text
backend/
├── src/main/java/com/sms/
│   ├── config/             # Cấu hình CORS, OpenAPI/Swagger, Rate Limit Filter, Async
│   ├── controller/         # REST Controllers tiếp nhận request từ Client (Admin, Lecturer, Student, Auth)
│   ├── dto/                # Data Transfer Objects & Validation annotations
│   ├── entity/             # Các JPA Entities tương ứng với 18 bảng CSDL
│   ├── exception/          # GlobalExceptionHandler & Custom Business Exceptions
│   ├── repository/         # Spring Data JPA Repositories & Native SQL Queries
│   ├── security/           # JwtAuthenticationFilter, UserDetailsService, SecurityConfig
│   └── service/            # Business Logic layer (Auth, Enrollment, Grade, Schedule, Curriculum...)
├── src/main/resources/
│   ├── application.properties # Cấu hình cổng (8080), kết nối MySQL, JWT Secret, Hibernate
│   └── static/             # Tài nguyên tĩnh & template
├── src/test/java/com/sms/  # Bộ kiểm thử đơn vị & tích hợp (Unit & Service Tests)
├── Dockerfile              # Docker build nhiều tầng (Multi-stage build)
└── pom.xml                 # Khai báo dependency Maven
```

---

## ⚡ Hướng dẫn khởi chạy

### Yêu cầu:
* JDK 23 đã cài đặt và cấu hình `JAVA_HOME`.
* Maven 3.9+ (hoặc dùng `mvnw`).
* MySQL 8.0 đang chạy tại cổng `3306` (hoặc `3308` Docker).

### Khởi chạy Backend:
```bash
cd backend
mvn clean spring-boot:run
```
> Server sẽ khởi chạy tại: `http://localhost:8080`  
> API Base URL: `http://localhost:8080/api`  
> Swagger Documentation: `http://localhost:8080/swagger-ui.html`

### Chạy kiểm thử tự động:
```bash
cd backend
mvn test
```
