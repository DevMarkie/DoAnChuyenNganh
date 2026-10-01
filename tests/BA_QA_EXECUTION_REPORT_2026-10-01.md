# BA/QA EXECUTION REPORT

**Ngày chạy:** 2026-10-01  
**Target:** `http://localhost:8080/api`  
**Suite:** `tests/comprehensive_system_test.js`  
**Kết quả lần đầu:** **47/56 PASS, 9 FAIL, 83.9%**  
**Kết quả sau khi khôi phục toàn bộ mật khẩu:** **51/56 PASS, 5 FAIL, 91.1%**
**Kết quả sau khi sửa test contract và cấu hình CORS:** **56/56 PASS, 0 FAIL, 100%**

Mật khẩu mặc định đã được khôi phục cho **626/626 tài khoản** về `123456`; tài khoản Admin và các tài khoản mẫu đã được xác minh đăng nhập thành công.

CORS LAN được truyền vào container qua `docker-compose.override.yml` bằng `CORS_ALLOWED_ORIGINS`; backend được recreate trước khi chạy lần cuối.

## 1.1 Baseline đăng ký học phần

Topology: một backend Spring Boot + một MySQL container, section test `36`, trạng thái `OPEN`, sức chứa `20`.

| Concurrent clients | Requests | Thành công | Từ chối nghiệp vụ | HTTP 5xx | Sĩ số sau test |  Throughput |
| -----------------: | -------: | ---------: | ----------------: | -------: | -------------: | ----------: |
|                100 |      100 |         20 |                80 |        0 |          20/20 | 11.44 req/s |
|                475 |      475 |         20 |               455 |        0 |          20/20 | 17.73 req/s |

Kết luận: baseline hiện tại không oversell và không phát sinh lỗi server trong hai lần chạy. Đây chưa phải bằng chứng hệ thống chịu được 5.000 concurrent users; cần benchmark tiếp với dữ liệu scale và nhiều lớp học phần hot.

## 1. Kết quả tổng quan

| Nhóm                    | Pass | Fail | Nhận xét                                                  |
| ----------------------- | ---: | ---: | --------------------------------------------------------- |
| Security & Auth         |   11 |    1 | Lệch tài khoản fixture sinh viên                          |
| RBAC                    |   10 |    0 | Đạt                                                       |
| Data Boundary           |   10 |    0 | Đạt                                                       |
| Lecturer & Grades       |    6 |    3 | Test gửi sai field điểm; cần chạy lại sau khi sửa fixture |
| Enrollment & Schedule   |    3 |    2 | Có lỗi phụ thuộc token sinh viên không được tạo           |
| Transcript & GPA        |    2 |    1 | Có lỗi phụ thuộc token sinh viên                          |
| Password Reset          |    1 |    1 | Hành vi chống user enumeration chưa thống nhất với test   |
| Concurrency & Standards |    4 |    1 | CORS test cần xác minh cấu hình Origin thực tế            |

## 2. Các lỗi ghi nhận

### FAIL-01: SEC-04 - Tài khoản sinh viên fixture không đăng nhập được

- **Hiện trạng:** `2500001 / 123456` thất bại, trong khi `2500002` thành công.
- **Phân loại ban đầu:** Test data/state issue.
- **Rủi ro:** Các test dùng `studentToken` bị kéo fail theo.
- **Xử lý đề xuất:** Dùng một tài khoản được xác nhận trong database hiện tại hoặc dùng tài khoản sinh từ `scale_seed.sql`; không hard-code nhiều bộ mã sinh viên khác nhau trong các suite.

### FAIL-02 đến FAIL-04: GRD-04, GRD-06, GRD-07 - Contract nhập điểm lệch

- **Hiện trạng:** Suite gửi `attendanceScore`.
- **Backend contract hiện tại:** `cc1Score`, `cc2Score`, `midtermScore`, `finalScore` trong `GradeRequest`.
- **Phân loại ban đầu:** Test defect, chưa kết luận product defect.
- **Xử lý đề xuất:** Sửa test dùng đúng field API, sau đó chạy lại cả GRD-04, GRD-06 và GRD-07.
- **Lưu ý BA:** Cần chốt rõ “chuyên cần” là một điểm hay hai thành phần CC1/CC2.

### FAIL-05 đến FAIL-07: ENR-01, ENR-02, TRA-01 - Không có student token hợp lệ

- **Hiện trạng:** Các test phụ thuộc `studentToken` thất bại sau SEC-04.
- **Phân loại ban đầu:** Cascade failure từ fixture đăng nhập.
- **Xử lý đề xuất:** Dừng nhóm test phụ thuộc nếu bước login nền không tạo được token; ghi `BLOCKED` thay vì đánh dấu fail nghiệp vụ.

### FAIL-08: RST-01 - Reset mật khẩu tài khoản không tồn tại

- **Hiện trạng:** Test kỳ vọng hệ thống từ chối; API đang trả response thành công chung.
- **Phân loại:** Requirement/test contract mismatch.
- **Nhận xét bảo mật:** Trả thông báo chung cho tài khoản tồn tại và không tồn tại là hướng chống user enumeration đúng hơn. Test nên kiểm tra không lộ thông tin thay vì bắt buộc HTTP fail.
- **Cần BA chốt:** API có tạo request giả hay chỉ trả thông báo chung mà không tạo bản ghi.

### FAIL-09: STRESS-04 - CORS thiếu header

- **Hiện trạng:** Preflight từ `http://192.168.1.130:5173` không nhận `Access-Control-Allow-Origin`.
- **Phân loại:** Có khả năng cấu hình môi trường chưa cho phép LAN origin.
- **Xử lý đề xuất:** Đưa LAN origin vào biến `CORS_ALLOWED_ORIGINS` khi chạy môi trường LAN; test phải đọc origin từ biến môi trường, không hard-code IP.

## 3. Kết luận release hiện tại

- **Không sign-off theo báo cáo 56/56 cũ.** Kết quả runtime hiện tại là 47/56.
- RBAC và validation dữ liệu đang có bằng chứng tốt.
- Chưa thể kết luận đăng ký chịu được 5.000 người đồng thời; suite hiện tại mới có 20 request đọc đồng thời, chưa phải 5.000 POST đăng ký.
- Chưa thể kết luận công thức điểm từ lần chạy này vì test gửi sai field request.
- Cần sửa test fixture/contract rồi chạy lại trước khi sửa product code.

## 4. Thứ tự xử lý đề xuất

1. Chuẩn hóa tài khoản test và reset trạng thái dữ liệu trước mỗi run.
2. Sửa field điểm trong `comprehensive_system_test.js`.
3. Cho các test phụ thuộc chuyển sang `BLOCKED` khi login nền thất bại.
4. Chốt hành vi `forgot-password` với BA.
5. Cấu hình CORS theo environment và chạy lại preflight test.
6. Import dữ liệu scale, tạo 5.000 JWT khác nhau và chạy `enrollment_load_test.js`.
7. Đối soát database sau load test: không enrollment trùng và không vượt sĩ số.
