# BA/QA TEST PACK

## 1. Mục tiêu

Bộ test này kiểm tra hệ thống từ góc nhìn người dùng và nghiệp vụ, không chỉ kiểm tra API trả về `200`. Mỗi test phải xác minh cả quyền, dữ liệu sau giao dịch và thông báo cho người dùng.

Phạm vi:

- Đăng nhập, đổi mật khẩu và phân quyền.
- Quản lý dữ liệu đào tạo.
- Đăng ký/hủy học phần.
- Nhập, chốt và công bố điểm.
- Bảng điểm, GPA/CPA.
- Yêu cầu cấp lại mật khẩu.
- Tải đồng thời và toàn vẹn dữ liệu.

## 2. Personas

- **STU:** Sinh viên.
- **LEC:** Giảng viên.
- **ADM:** Admin/Phòng đào tạo.
- **QA:** Người kiểm thử.

## 3. User Stories và Acceptance Criteria

### US-001: Đăng nhập theo vai trò

**Là** người dùng, **tôi muốn** đăng nhập đúng cổng của mình, **để** chỉ truy cập được chức năng phù hợp với vai trò.

Acceptance Criteria:

- Tài khoản hợp lệ nhận được token và được chuyển tới dashboard đúng vai trò.
- Sai mật khẩu nhận `401` và không tạo session hợp lệ.
- Tài khoản bị khóa không thể đăng nhập.
- Token giả, hết hạn hoặc sai chữ ký bị từ chối.
- Người dùng không thể truy cập route/API của vai trò khác.

### US-002: Admin cấu hình kỳ học và lớp học phần

**Là** ADM, **tôi muốn** tạo kỳ học, môn học, lớp học phần, giảng viên và lịch học, **để** mở đợt đăng ký chính xác.

Acceptance Criteria:

- Không tạo được mã bị trùng hoặc dữ liệu bắt buộc bị thiếu.
- Sĩ số tối đa phải lớn hơn 0.
- Không xếp trùng phòng hoặc trùng lịch giảng viên.
- Chỉ kỳ học hiện hành trong thời gian đăng ký mới cho phép đăng ký.

### US-003: Sinh viên tìm và đăng ký học phần

**Là** STU, **tôi muốn** xem các lớp học phần phù hợp, **để** đăng ký kế hoạch học tập.

Acceptance Criteria:

- Chỉ hiển thị lớp đang mở trong kỳ đăng ký hiện hành.
- Đăng ký thành công tạo đúng một enrollment.
- Hệ thống chặn lớp đầy, trùng lịch, vượt tín chỉ, đăng ký trùng và không đạt tiên quyết.
- Hai sinh viên đăng ký chỗ cuối cùng không làm sĩ số vượt giới hạn.
- Thông báo lỗi phải nêu nguyên nhân nghiệp vụ cụ thể.

### US-004: Sinh viên hủy học phần

**Là** STU, **tôi muốn** hủy học phần đã đăng ký trong thời hạn, **để** điều chỉnh kế hoạch học tập.

Acceptance Criteria:

- Chỉ chủ sở hữu mới hủy được enrollment.
- Chỉ enrollment đang hoạt động mới hủy được.
- Hủy trong thời hạn làm giảm sĩ số đúng một lần.
- Không hủy được ngoài thời hạn hoặc khi đã có điểm thành phần.
- Hủy xong có thể đăng ký lại nếu nghiệp vụ cho phép.

### US-005: Giảng viên nhập và chốt điểm

**Là** LEC, **tôi muốn** nhập điểm cho lớp mình phụ trách, **để** công bố kết quả học tập.

Acceptance Criteria:

- Chỉ sửa được lớp do mình phụ trách.
- Điểm chỉ nhận giá trị từ 0 đến 10.
- Điểm tổng kết tự tính đúng trọng số đã được BA phê duyệt.
- Không chốt được khi còn sinh viên thiếu điểm.
- Sau khi chốt, điểm được công bố theo đúng quy định.
- Cửa sổ chỉnh sửa 7 ngày và quyền mở khóa của ADM phải được thống nhất, kiểm thử đúng theo quyết định BA.

### US-006: Sinh viên xem bảng điểm

**Là** STU, **tôi muốn** xem điểm và GPA/CPA của mình, **để** theo dõi kết quả học tập.

Acceptance Criteria:

- Sinh viên chỉ xem được dữ liệu của chính mình.
- Điểm chưa công bố không xuất hiện trong bảng điểm.
- GPA được tính theo tín chỉ.
- Môn học lại và môn không đạt được xử lý theo quy chế đã chốt.
- Điểm chữ, điểm hệ 4 và trạng thái đạt/trượt nhất quán.

### US-007: Admin xử lý ngoại lệ

**Là** ADM, **tôi muốn** mở khóa điểm, xử lý reset mật khẩu và override trường hợp đặc biệt, **để** vận hành được các tình huống thực tế.

Acceptance Criteria:

- Mọi thao tác ngoại lệ yêu cầu lý do.
- Có người thực hiện và thời gian thực hiện.
- Không thể dùng quyền ngoại lệ để bỏ qua xác thực người dùng.
- Admin chỉ xem/sửa dữ liệu trong phạm vi quyền được cấp.

## 4. Test Cases chức năng

### 4.1 Authentication và RBAC

| ID      | Priority | Test case                           | Expected result                                     |
| ------- | -------- | ----------------------------------- | --------------------------------------------------- |
| AUTH-01 | P0       | Đăng nhập bằng tài khoản ADM hợp lệ | Nhận token, vào Admin Dashboard                     |
| AUTH-02 | P0       | Đăng nhập bằng tài khoản LEC hợp lệ | Nhận token, vào Lecturer Dashboard                  |
| AUTH-03 | P0       | Đăng nhập bằng tài khoản STU hợp lệ | Nhận token, vào Student Dashboard                   |
| AUTH-04 | P0       | Sai mật khẩu                        | `401`, không tạo phiên đăng nhập                    |
| AUTH-05 | P1       | Username không tồn tại              | Thông báo không làm lộ tài khoản tồn tại hay không  |
| AUTH-06 | P0       | STU gọi API tạo khoa                | `403`, database không thay đổi                      |
| AUTH-07 | P0       | LEC sửa điểm lớp của LEC khác       | Bị từ chối, điểm không thay đổi                     |
| AUTH-08 | P1       | Token sai chữ ký/hết hạn            | `401`, không truy cập dữ liệu                       |
| AUTH-09 | P1       | Sai 5 lần mật khẩu liên tiếp        | Tài khoản bị khóa theo thời gian BA quy định        |
| AUTH-10 | P1       | Đổi mật khẩu mới                    | Mật khẩu cũ không dùng được, mật khẩu mới dùng được |

### 4.2 Admin và dữ liệu đào tạo

| ID     | Priority | Test case                                  | Expected result                                       |
| ------ | -------- | ------------------------------------------ | ----------------------------------------------------- |
| ADM-01 | P0       | Tạo môn học hợp lệ                         | Tạo thành công và xuất hiện trong danh sách           |
| ADM-02 | P1       | Tạo môn trùng mã                           | Bị từ chối, không tạo bản ghi thứ hai                 |
| ADM-03 | P1       | Tạo môn có 0 hoặc hơn giới hạn tín chỉ     | Bị validation từ chối                                 |
| ADM-04 | P0       | Tạo lớp học phần với sĩ số hợp lệ          | Tạo thành công ở trạng thái đúng                      |
| ADM-05 | P1       | Tạo lớp học phần sĩ số 0/âm                | Bị từ chối                                            |
| ADM-06 | P0       | Xếp trùng phòng cùng ngày/ca               | Bị từ chối và nêu lớp đang xung đột                   |
| ADM-07 | P0       | Xếp trùng lịch giảng viên                  | Bị từ chối                                            |
| ADM-08 | P1       | Tìm kiếm và phân trang danh sách 10.000 SV | Kết quả đúng, không tải toàn bộ dữ liệu vào một trang |

### 4.3 Đăng ký học phần

| ID     | Priority | Test case                                        | Expected result                                          |
| ------ | -------- | ------------------------------------------------ | -------------------------------------------------------- |
| ENR-01 | P0       | STU xem lớp mở trong kỳ hiện tại                 | Chỉ thấy lớp đúng kỳ, đúng trạng thái                    |
| ENR-02 | P0       | Đăng ký lớp còn chỗ                              | Tạo một enrollment `ENROLLED`, tăng sĩ số một lần        |
| ENR-03 | P0       | Đăng ký lại cùng lớp                             | Bị từ chối, không tạo bản ghi trùng                      |
| ENR-04 | P0       | Đăng ký lớp đã đầy                               | Bị từ chối bằng lỗi nghiệp vụ, sĩ số không đổi           |
| ENR-05 | P0       | Đăng ký ngoài thời gian                          | Bị từ chối                                               |
| ENR-06 | P0       | Đăng ký lớp đã đóng                              | Bị từ chối                                               |
| ENR-07 | P0       | Đăng ký hai lớp trùng tiết                       | Bị từ chối và nêu lớp bị trùng                           |
| ENR-08 | P1       | Đăng ký hai lớp cùng tiết nhưng khác khoảng ngày | Xử lý theo quyết định BA về khoảng ngày                  |
| ENR-09 | P0       | Đăng ký vượt tín chỉ tối đa                      | Bị từ chối                                               |
| ENR-10 | P1       | Đăng ký không đạt môn tiên quyết                 | Bị từ chối và nêu môn tiên quyết                         |
| ENR-11 | P0       | STU hủy enrollment của STU khác                  | `403/400`, dữ liệu không đổi                             |
| ENR-12 | P0       | Hủy enrollment của chính mình trong hạn          | Trạng thái thành `CANCELLED`, sĩ số giảm một lần         |
| ENR-13 | P0       | Hủy enrollment đã có điểm                        | Bị từ chối                                               |
| ENR-14 | P1       | Nhấn nút đăng ký hai lần nhanh                   | Chỉ có một enrollment                                    |
| ENR-15 | P0       | 5.000 STU cùng đăng ký lớp còn 40 chỗ            | Tối đa 40 thành công, không oversell, không lỗi HTTP 5xx |

### 4.4 Điểm và bảng điểm

| ID     | Priority | Test case                          | Expected result                          |
| ------ | -------- | ---------------------------------- | ---------------------------------------- |
| GRD-01 | P0       | LEC nhập điểm trong khoảng 0-10    | Lưu thành công và tính tổng              |
| GRD-02 | P0       | Nhập điểm âm hoặc lớn hơn 10       | Bị validation từ chối                    |
| GRD-03 | P0       | Nhập thiếu một thành phần điểm     | Chưa có tổng điểm hoàn chỉnh             |
| GRD-04 | P0       | Kiểm tra công thức tổng kết        | Kết quả đúng trọng số BA phê duyệt       |
| GRD-05 | P1       | Kiểm tra ngưỡng A/B+/B/C+/C/D+/D/F | Quy đổi đúng bảng quy chế                |
| GRD-06 | P0       | Chốt khi còn SV thiếu điểm         | Không chốt, liệt kê SV thiếu             |
| GRD-07 | P0       | Chốt bảng điểm hoàn chỉnh          | Điểm được công bố đúng phạm vi           |
| GRD-08 | P0       | LEC sửa điểm sau khi hết cửa sổ    | Bị từ chối                               |
| GRD-09 | P0       | ADM mở khóa bảng điểm              | Mở khóa đúng bản ghi và có audit         |
| GRD-10 | P1       | Xuất bảng điểm Excel               | File mở được, đúng số dòng và đúng điểm  |
| GRD-11 | P0       | STU xem điểm chưa chốt             | Không nhìn thấy điểm chưa công bố        |
| GRD-12 | P0       | Tính GPA theo tín chỉ              | Đúng kết quả với dữ liệu mẫu đã tính tay |

### 4.5 Reset mật khẩu

| ID     | Priority | Test case                          | Expected result                            |
| ------ | -------- | ---------------------------------- | ------------------------------------------ |
| RST-01 | P1       | Gửi yêu cầu reset hợp lệ           | Tạo yêu cầu `PENDING`                      |
| RST-02 | P1       | Gửi lại khi đang có yêu cầu chờ    | Bị chống tạo request trùng                 |
| RST-03 | P0       | ADM duyệt request                  | Mật khẩu tạm được tạo/gửi đúng email hồ sơ |
| RST-04 | P0       | Đăng nhập bằng mật khẩu tạm        | Đăng nhập được và phải đổi mật khẩu        |
| RST-05 | P1       | ADM từ chối request không có lý do | Bị validation từ chối                      |
| RST-06 | P1       | Người dùng không tồn tại gửi reset | Thông báo không làm lộ dữ liệu tài khoản   |

## 5. Test cases phi chức năng

### NFR-01: Quy mô dữ liệu

- Import thành công 10.000 sinh viên và ít nhất 100.000 enrollment lịch sử.
- Tìm kiếm/phân trang danh sách sinh viên vẫn trả kết quả chính xác.
- Không có lỗi duplicate key hoặc foreign key khi import dữ liệu hợp lệ.

### NFR-02: Tải đăng ký

- Chuẩn bị 5.000 JWT của 5.000 sinh viên khác nhau.
- Gửi 5.000 POST `/api/enrollments` trong tối đa 10 giây.
- Đo `p50`, `p95`, `p99`, throughput, timeout và HTTP 5xx.
- Kiểm tra sau test: số enrollment hoạt động không vượt `max_students`.
- Các request bị từ chối vì hết chỗ phải được phân biệt với lỗi hệ thống.

Mức nghiệm thu đề xuất:

- Không oversell.
- Không enrollment trùng.
- HTTP 5xx = 0 trong kịch bản chuẩn.
- p95 <= 2 giây cho request đăng ký.
- Sau tải cao, API tra cứu hoạt động bình thường trong tối đa 60 giây.

### NFR-03: Bảo mật

- Không truy cập được API khi thiếu token.
- Không thay đổi được dữ liệu bằng cách sửa ID trên URL.
- SQL Injection, XSS và JWT giả bị từ chối.
- Không ghi password hoặc token vào log.

### NFR-04: Khả năng phục hồi

- Backend restart không làm hỏng dữ liệu enrollment đã commit.
- Request timeout không tạo enrollment một nửa.
- Gửi lại request có idempotency phải không tạo bản ghi trùng.

## 6. Dữ liệu kiểm thử tối thiểu

- ADM: `admin`.
- LEC: ít nhất 2 giảng viên để kiểm tra truy cập chéo.
- STU: ít nhất 10 sinh viên cho chức năng; 5.000 sinh viên cho tải.
- Một lớp còn 40 chỗ.
- Một lớp đã đầy.
- Hai lớp trùng lịch.
- Một môn có tiên quyết và một môn không có tiên quyết.
- Một kỳ đang mở đăng ký, một kỳ đã đóng.
- Một bảng điểm thiếu dữ liệu và một bảng điểm đủ 100%.

## 7. Quy tắc ghi nhận lỗi

Mỗi defect phải có:

- Test Case ID.
- Môi trường và commit/version.
- Tài khoản/role sử dụng.
- Dữ liệu đầu vào.
- Các bước tái hiện.
- Kết quả mong đợi và thực tế.
- HTTP status, response body và ảnh màn hình nếu là UI.
- Mức độ: Blocker, Critical, Major, Minor hoặc Trivial.

## 8. Các điểm cần BA chốt trước khi sign-off

1. Giới hạn tín chỉ là tối đa 24 hay 30; có bắt buộc tối thiểu 14 hay chỉ cảnh báo?
2. D là đạt hay D+ mới đạt?
3. Chốt điểm theo từng sinh viên hay toàn bộ lớp học phần?
4. Hủy học phần có bị giới hạn bởi thời gian đăng ký không?
5. Môn tiên quyết có bắt buộc kiểm tra ở backend không?
6. Admin override sĩ số cần nhập lý do và giới hạn thế nào?
7. Cửa sổ sửa điểm 7 ngày tính từ lúc chốt hay từ lúc công bố?
8. Audit log cần lưu tối thiểu bao lâu?

## 9. Exit Criteria

Chỉ sign-off khi:

- Tất cả test P0 đạt.
- Không còn defect Blocker/Critical.
- Các quyết định BA ở mục 8 đã được cập nhật vào tài liệu và test.
- Kịch bản 5.000 đăng ký không oversell.
- Dữ liệu sau test được đối soát với database.
- Báo cáo test có số liệu thực tế, không chỉ ghi tỷ lệ pass.
