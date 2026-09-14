# Test case kiểm thử hệ thống quản lý sinh viên

## 1. Phạm vi

Tài liệu này dùng để kiểm thử chức năng trên web SMS Portal gồm:

- Đăng nhập, đăng xuất, JWT và phân quyền theo vai trò.
- Các chức năng Admin: dashboard, sinh viên, giảng viên, khoa, lớp sinh hoạt, môn học, học kỳ, lớp học phần, lịch học và điểm.
- Các chức năng Giảng viên: dashboard, học phần phụ trách, lịch giảng dạy, nhập điểm và hồ sơ cá nhân.
- Các chức năng Sinh viên: dashboard, đăng ký học phần, học phần đã đăng ký, thời khóa biểu, bảng điểm và hồ sơ cá nhân.
- Kiểm tra validate dữ liệu, lỗi nghiệp vụ, bảo mật cơ bản và khả năng điều hướng.

## 2. Môi trường và dữ liệu kiểm thử

| Thành phần | Giá trị |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080/api` |
| Trình duyệt | Chrome/Edge phiên bản hiện hành |
| Database | MySQL với `database/schema.sql` và `database/seed.sql` |
| Admin | `admin` / `123456` |
| Giảng viên | `gv01` / `123456` |
| Sinh viên | `2500001` / `123456` |
| Học kỳ hiện tại theo seed | ID `3`, mã `HK1-2026` |
| Lớp học phần mở theo seed | ID `14` đến `24` |

> Lưu ý: `README.md` đang ghi mật khẩu khác và giao diện đăng nhập nhanh đang dùng `gv001`, `sv001`; hai thông tin này không khớp dữ liệu seed hiện tại. Khi thực thi, ưu tiên dữ liệu trong `database/seed.sql` hoặc cập nhật lại test data sau khi xác nhận với người quản lý dự án.

> Với các case đăng ký học phần thành công, cần có một học kỳ đang trong thời gian đăng ký. Seed hiện tại có thể đã hết hạn đăng ký theo ngày chạy test, vì vậy hãy tạo/cập nhật một học kỳ test riêng.

## 3. Quy ước

- **P0**: chức năng quan trọng, lỗi sẽ chặn nghiệm thu.
- **P1**: chức năng chính, cần sửa trước khi bàn giao.
- **P2**: chức năng phụ hoặc trải nghiệm người dùng.
- Cột **KQ** để trống cho người thực thi điền `Pass`, `Fail` hoặc `Blocked`.
- Các ID trong dữ liệu test chỉ là giá trị tham chiếu; nếu database được seed lại thì kiểm tra lại ID trước khi chạy.

## 4. Bộ test case

### A. Đăng nhập, phiên đăng nhập và phân quyền

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| AUTH-01 | Đăng nhập Admin hợp lệ | Có tài khoản `admin` | Mở `/login`, nhập `admin` / `123456`, bấm Đăng nhập | Đăng nhập thành công, lưu token, chuyển đến `/admin/dashboard`, hiển thị vai trò Admin | P0 | |
| AUTH-02 | Đăng nhập Giảng viên hợp lệ | Có tài khoản `gv01` | Nhập `gv01` / `123456` và đăng nhập | Chuyển đến dashboard Giảng viên, chỉ hiển thị menu của Giảng viên | P0 | |
| AUTH-03 | Đăng nhập Sinh viên hợp lệ | Có tài khoản `2500001` | Nhập `2500001` / `123456` và đăng nhập | Chuyển đến dashboard Sinh viên, chỉ hiển thị menu của Sinh viên | P0 | |
| AUTH-04 | Sai mật khẩu | Tài khoản tồn tại | Nhập đúng username và mật khẩu sai | Không tạo phiên đăng nhập, hiển thị thông báo lỗi, vẫn ở trang login | P0 | |
| AUTH-05 | Tài khoản không tồn tại | Không cần dữ liệu đặc biệt | Nhập username ngẫu nhiên và mật khẩu bất kỳ | Không đăng nhập được, không lộ thông tin chi tiết về tài khoản trong hệ thống | P1 | |
| AUTH-06 | Bỏ trống username/password | Không cần dữ liệu đặc biệt | Để trống từng trường hoặc cả hai rồi bấm Đăng nhập | Hiển thị validate bắt buộc; không gửi request không hợp lệ | P1 | |
| AUTH-07 | Tài khoản bị vô hiệu hóa | Có user `is_active = false` | Thử đăng nhập bằng tài khoản bị khóa | Đăng nhập bị từ chối và hiển thị thông báo phù hợp | P0 | |
| AUTH-08 | Truy cập route khi chưa đăng nhập | Xóa `token` và `user` khỏi localStorage | Mở trực tiếp `/admin/dashboard`, `/lecturer/dashboard`, `/student/dashboard` | Bị chuyển về `/login`, không xem được dữ liệu riêng tư | P0 | |
| AUTH-09 | Truy cập sai role | Đăng nhập bằng Sinh viên | Nhập trực tiếp `/admin/students` hoặc `/lecturer/grades` | Bị chuyển về `/student/dashboard`, không hiển thị màn hình trái quyền | P0 | |
| AUTH-10 | Đăng xuất | Đã đăng nhập bất kỳ role | Bấm Đăng xuất, sau đó dùng nút Back hoặc mở route cũ | Xóa token/user, chuyển về login, route bảo vệ không truy cập được | P0 | |
| AUTH-11 | Token không hợp lệ/hết hạn | Sửa hoặc thay token trong localStorage | Gọi API hoặc tải lại một trang bảo vệ | API trả 401/403; frontend xóa phiên và chuyển về login | P0 | |
| AUTH-12 | Đổi mật khẩu thành công | Đã đăng nhập, dùng mật khẩu hiện tại `123456` | Vào hồ sơ, nhập mật khẩu cũ đúng và mật khẩu mới tối thiểu 6 ký tự | Hiển thị thành công; đăng nhập lại bằng mật khẩu mới được | P1 | |
| AUTH-13 | Đổi mật khẩu không hợp lệ | Đã đăng nhập | Thử mật khẩu cũ sai, mật khẩu mới rỗng hoặc dưới 6 ký tự | Không đổi mật khẩu; hiển thị lỗi validate/nghiệp vụ | P1 | |

### B. Layout, điều hướng và dashboard dùng chung

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| UI-01 | Hiển thị menu đúng role | Đăng nhập lần lượt bằng 3 role | Quan sát sidebar và header | Mỗi role chỉ thấy nhóm menu được cấp; username và nhãn role hiển thị đúng | P0 | |
| UI-02 | Thu gọn/mở rộng sidebar | Đã đăng nhập | Bấm nút thu gọn sidebar rồi bấm lại | Sidebar thay đổi trạng thái, icon/menu vẫn click được, không vỡ layout | P2 | |
| UI-03 | Chuyển Light/Dark mode | Đã đăng nhập | Bấm nút đổi theme, tải lại trang | Theme đổi đúng và trạng thái không gây lỗi giao diện sau reload | P2 | |
| UI-04 | Route không tồn tại | Đã đăng nhập và chưa đăng nhập | Mở URL bất kỳ không khai báo | Người dùng được chuyển về dashboard phù hợp role hoặc `/login` | P1 | |
| DASH-01 | Dashboard Admin tải dữ liệu | Đăng nhập Admin, backend và database hoạt động | Mở `/admin/dashboard`, tải lại trang | Hiển thị các số liệu tổng quan và biểu đồ; không có lỗi API trên console | P1 | |
| DASH-02 | Dashboard Giảng viên tải dữ liệu | Đăng nhập `gv01` | Mở dashboard Giảng viên | Hiển thị hồ sơ, các lớp học phần phụ trách và thao tác xem điểm | P1 | |
| DASH-03 | Dashboard Sinh viên tải dữ liệu | Đăng nhập `2500001` | Mở dashboard Sinh viên | Hiển thị hồ sơ, học phần hiện tại và các liên kết đến đăng ký/bảng điểm | P1 | |

### C. Quản lý sinh viên — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| STU-01 | Xem danh sách sinh viên | Đăng nhập Admin | Mở `/admin/students` | Danh sách tải thành công, có thông tin mã, họ tên, email, lớp và trạng thái | P0 | |
| STU-02 | Tìm kiếm sinh viên | Có sinh viên `2500001` | Nhập mã hoặc tên vào ô tìm kiếm, bấm tìm | Chỉ hiển thị bản ghi phù hợp; xóa bộ lọc trả về danh sách ban đầu | P1 | |
| STU-03 | Lọc sinh viên theo lớp | Có nhiều lớp sinh hoạt | Chọn một lớp trong bộ lọc | Danh sách chỉ còn sinh viên thuộc lớp được chọn | P1 | |
| STU-04 | Thêm sinh viên hợp lệ | Dùng mã sinh viên mới, email hợp lệ, lớp tồn tại | Bấm Thêm, điền đầy đủ form, lưu | Tạo thành công, bản ghi mới xuất hiện trong danh sách | P0 | |
| STU-05 | Validate form sinh viên | Đăng nhập Admin | Bỏ trống trường bắt buộc; nhập email sai định dạng | Form không lưu và hiển thị lỗi cho trường tương ứng | P1 | |
| STU-06 | Sửa thông tin sinh viên | Có sinh viên tồn tại | Bấm Sửa, thay đổi thông tin hợp lệ, lưu | Thông tin mới được lưu và hiển thị sau reload | P0 | |
| STU-07 | Đổi trạng thái sinh viên | Có sinh viên đang học | Bấm tạm đình chỉ/kích hoạt lại và xác nhận nếu có | Trạng thái đổi đúng; thao tác lặp lại đưa về trạng thái ban đầu | P1 | |
| STU-08 | Sinh viên không được tạo/sửa dữ liệu Admin | Đăng nhập Sinh viên | Gọi trực tiếp POST/PUT `/api/students` hoặc truy cập màn hình Admin | Bị từ chối 403 hoặc chuyển route; dữ liệu không thay đổi | P0 | |

### D. Quản lý giảng viên — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| LEC-01 | Xem danh sách giảng viên | Đăng nhập Admin | Mở `/admin/lecturers` | Danh sách giảng viên hiển thị đúng khoa, email và trạng thái | P1 | |
| LEC-02 | Tìm kiếm/lọc giảng viên | Có nhiều giảng viên/khoa | Nhập mã hoặc tên, chọn khoa | Kết quả phù hợp với từ khóa và khoa đã chọn | P1 | |
| LEC-03 | Thêm giảng viên hợp lệ | Khoa tồn tại, email chưa dùng | Điền mã, họ tên, email hợp lệ và khoa, lưu | Tạo giảng viên thành công; tài khoản có thể đăng nhập nếu hệ thống tạo user | P0 | |
| LEC-04 | Validate email và trường bắt buộc | Đăng nhập Admin | Để trống mã/họ tên/email/khoa hoặc nhập email sai | Không cho lưu và hiển thị lỗi phù hợp | P1 | |
| LEC-05 | Sửa và bật/tắt giảng viên | Có giảng viên tồn tại | Sửa thông tin rồi đổi trạng thái | Thông tin và trạng thái được cập nhật chính xác sau reload | P1 | |

### E. Quản lý khoa/viện — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| DEPT-01 | Xem toàn bộ khoa | Đăng nhập Admin | Mở `/admin/departments` | Danh sách khoa hiển thị đầy đủ | P1 | |
| DEPT-02 | Tìm kiếm khoa | Có khoa CNTT hoặc khoa tương đương trong seed | Tìm theo mã/tên khoa | Trả đúng bản ghi phù hợp; từ khóa không tồn tại trả danh sách rỗng/thông báo phù hợp | P1 | |
| DEPT-03 | Thêm và sửa khoa | Mã khoa mới | Tạo khoa với dữ liệu hợp lệ, sau đó sửa tên/mô tả | Tạo và cập nhật thành công; dữ liệu giữ nguyên sau reload | P1 | |
| DEPT-04 | Trùng mã và bật/tắt trạng thái | Có mã khoa đã tồn tại | Tạo lại cùng mã; bật/tắt một khoa | Mã trùng bị từ chối; trạng thái active đổi chính xác | P1 | |

### F. Quản lý lớp sinh hoạt — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| CLASS-01 | Xem/lọc lớp sinh hoạt | Có dữ liệu lớp và khoa | Mở `/admin/classes`, chọn khoa | Hiển thị lớp; bộ lọc khoa trả đúng kết quả | P1 | |
| CLASS-02 | Xem sinh viên trong lớp | Có lớp có sinh viên | Mở thao tác xem chi tiết/sinh viên của lớp | Danh sách sinh viên thuộc đúng lớp được hiển thị | P1 | |
| CLASS-03 | Thêm/sửa lớp hợp lệ | Khoa tồn tại | Nhập mã lớp, tên, khóa, khoa; lưu rồi sửa | Tạo và cập nhật thành công | P1 | |
| CLASS-04 | Validate lớp và bật/tắt | Đăng nhập Admin | Bỏ trống mã/tên/khóa/khoa; thử bật/tắt | Không lưu dữ liệu thiếu; trạng thái lớp đổi đúng khi dữ liệu hợp lệ | P1 | |

### G. Quản lý môn học — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| SUB-01 | Xem và tìm môn học | Có môn `IT101` | Mở `/admin/subjects`, tìm theo mã/tên | Danh sách và kết quả tìm kiếm chính xác | P1 | |
| SUB-02 | Thêm môn học hợp lệ | Khoa tồn tại | Tạo môn với mã, tên, số tín chỉ từ 1 đến 10 | Môn học được tạo và hiển thị | P1 | |
| SUB-03 | Validate số tín chỉ | Đăng nhập Admin | Nhập tín chỉ rỗng, 0, âm hoặc >10 | Không cho lưu, thông báo lỗi đúng | P1 | |
| SUB-04 | Sửa, trùng mã và bật/tắt môn | Có môn tồn tại | Sửa môn; thử tạo mã trùng; bật/tắt trạng thái | Sửa/bật tắt thành công; mã trùng bị từ chối | P1 | |

### H. Quản lý học kỳ và thời gian đăng ký — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| SEM-01 | Xem học kỳ hiện tại | Có học kỳ ID 3 là current | Mở `/admin/semesters` và gọi chức năng học kỳ hiện tại | Học kỳ current hiển thị đúng, chỉ có một học kỳ được đánh dấu current | P0 | |
| SEM-02 | Tạo học kỳ hợp lệ | Mã học kỳ mới | Nhập đầy đủ thông tin, ngày kết thúc sau ngày bắt đầu, khoảng đăng ký hợp lệ | Học kỳ được tạo thành công | P0 | |
| SEM-03 | Validate ngày học kỳ | Đăng nhập Admin | Nhập end date trước hoặc bằng start date | Không cho lưu, hiển thị lỗi ngày không hợp lệ | P1 | |
| SEM-04 | Validate thời gian đăng ký | Đăng nhập Admin | Chỉ nhập một đầu ngày đăng ký hoặc ngày kết thúc trước ngày mở | Không cho lưu; yêu cầu đủ cặp ngày và đúng thứ tự | P1 | |
| SEM-05 | Đặt học kỳ hiện tại | Có ít nhất hai học kỳ | Chọn Set current cho học kỳ khác | Học kỳ mới là current và học kỳ cũ tự bỏ current | P0 | |
| SEM-06 | Sửa và kiểm tra trạng thái học kỳ | Có học kỳ tồn tại | Sửa thông tin hợp lệ; thử trạng thái không hợp lệ qua API | Dữ liệu hợp lệ được lưu; trạng thái ngoài enum bị từ chối | P1 | |

### I. Quản lý lớp học phần — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| SEC-01 | Xem và lọc lớp học phần | Có học kỳ và các section seed | Mở `/admin/course-sections`, lọc theo học kỳ | Section hiển thị đúng môn, giảng viên, sĩ số và trạng thái | P0 | |
| SEC-02 | Mở lớp học phần hợp lệ | Môn, giảng viên và học kỳ tồn tại | Tạo section với mã mới, sĩ số >0 | Section tạo thành công, sĩ số đăng ký ban đầu bằng 0 | P0 | |
| SEC-03 | Trùng mã lớp học phần | Có mã section tồn tại | Tạo section với mã đã có | Bị từ chối, dữ liệu cũ không bị thay đổi | P1 | |
| SEC-04 | Cập nhật section | Có section tồn tại | Đổi giảng viên, phòng, sĩ số hoặc trạng thái | Cập nhật thành công; không cho giảm sĩ số tối đa thấp hơn số đã đăng ký | P0 | |
| SEC-05 | Trạng thái section không hợp lệ | Đăng nhập Admin | Gửi status ngoài `OPEN/CLOSED` qua API | API trả lỗi nghiệp vụ, không lưu giá trị sai | P1 | |

### J. Xếp lịch học — Admin

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| SCH-01 | Xem lịch theo học kỳ/lớp | Có lịch seed hoặc lịch test | Mở `/admin/schedules`, chọn học kỳ/lớp, đổi Grid/Table | Kết quả lọc đúng; hai chế độ hiển thị không mất dữ liệu | P1 | |
| SCH-02 | Tạo lịch hợp lệ | Section tồn tại, phòng và giảng viên chưa xung đột | Nhập thứ 2–8, tiết 1–12, ngày hợp lệ, phòng, lưu | Lịch tạo thành công; tên phòng được chuẩn hóa chữ hoa nếu có | P0 | |
| SCH-03 | Validate tiết và ngày | Đăng nhập Admin | Thử ngày ngoài 2–8, tiết ngoài 1–12, start > end, ngày bắt đầu > ngày kết thúc | Không lưu, hiển thị lỗi tương ứng | P0 | |
| SCH-04 | Phát hiện trùng phòng | Có lịch cùng phòng/ngày/tiết/khoảng ngày | Tạo lịch trùng phòng | Bị từ chối và chỉ rõ xung đột phòng | P0 | |
| SCH-05 | Phát hiện trùng giảng viên | Có lịch cùng giảng viên/ngày/tiết/khoảng ngày | Tạo lịch trùng giảng viên | Bị từ chối và chỉ rõ xung đột giảng viên | P0 | |
| SCH-06 | Sửa và xóa lịch | Có lịch test riêng | Sửa dữ liệu hợp lệ, sau đó xóa và tải lại | Sửa thành công; xóa thành công sau khi xác nhận; lịch không còn trong danh sách | P1 | |

### K. Quản lý điểm — Admin và Giảng viên

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| GRADE-01 | Xem danh sách điểm theo section | Có section có sinh viên đăng ký | Mở màn hình điểm, chọn section | Danh sách sinh viên/enrollment và điểm hiện tại hiển thị đúng | P0 | |
| GRADE-02 | Nhập đủ điểm và tự tính tổng kết | Có enrollment hợp lệ | Nhập chuyên cần 8, giữa kỳ 7, cuối kỳ 9, lưu | Tổng kết bằng `8*10% + 7*30% + 9*60% = 8.30`; chữ/GPA được tính đúng theo quy tắc | P0 | |
| GRADE-03 | Lưu điểm hàng loạt | Có nhiều enrollment | Nhập điểm cho nhiều dòng, bấm lưu tất cả | Tất cả bản ghi hợp lệ được lưu; không làm mất dữ liệu dòng khác | P1 | |
| GRADE-04 | Chốt điểm khi thiếu thành phần | Có enrollment chưa đủ điểm | Chỉ nhập một hoặc hai thành phần, chọn Chốt điểm | Không cho chốt và hiển thị lỗi yêu cầu đủ điểm | P0 | |
| GRADE-05 | Giảng viên chỉ nhập điểm section phụ trách | Đăng nhập `gv01`, có section của gv khác | Gọi API lưu điểm cho section không phụ trách | Bị từ chối; điểm không thay đổi | P0 | |
| GRADE-06 | Không sửa điểm đã chốt | Giảng viên đã chốt điểm | Sửa điểm và lưu lại | Bị từ chối; điểm đã chốt giữ nguyên | P0 | |
| GRADE-07 | Admin mở lại/sửa điểm đã chốt | Có điểm đã chốt | Đăng nhập Admin, sửa hoặc bỏ chốt điểm | Admin được phép cập nhật theo nghiệp vụ; kết quả tính lại đúng | P1 | |
| GRADE-08 | Chặn điểm ngoài khoảng hợp lệ | Có enrollment | Nhập điểm âm hoặc lớn hơn 10 qua UI và API | Hệ thống phải từ chối dữ liệu ngoài 0–10; nếu hiện tại API chưa chặn thì ghi nhận defect | P0 | |

### L. Chức năng Giảng viên

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| LECT-01 | Xem học phần phụ trách | Đăng nhập `gv01` | Mở `/lecturer/my-sections` | Chỉ hiển thị section do giảng viên đang đăng nhập phụ trách | P0 | |
| LECT-02 | Mở màn hình nhập điểm từ section | Đã có section phụ trách | Bấm Xem/Nhập điểm | Điều hướng đến màn hình điểm với đúng section được chọn | P1 | |
| LECT-03 | Xem lịch giảng dạy | Có lịch của `gv01` | Mở `/lecturer/schedule`, lọc học kỳ, đổi Grid/List | Chỉ hiện lịch của giảng viên; lọc và đổi chế độ hoạt động đúng | P0 | |
| LECT-04 | In lịch giảng dạy | Đang ở màn hình lịch | Bấm In | Mở hộp thoại in/trình in của trình duyệt; nội dung in không chứa thành phần không cần thiết | P2 | |
| LECT-05 | Xem hồ sơ cá nhân | Đăng nhập Giảng viên | Mở `/lecturer/profile` | Hiển thị đúng hồ sơ của user hiện tại, không xem hồ sơ người khác | P1 | |
| LECT-06 | Đổi mật khẩu Giảng viên | Đã đăng nhập | Thực hiện đổi mật khẩu với dữ liệu hợp lệ và không hợp lệ | Kết quả giống AUTH-12/AUTH-13; phiên đăng nhập xử lý ổn định | P1 | |
| LECT-07 | Không truy cập menu Admin | Đăng nhập Giảng viên | Mở trực tiếp các route `/admin/*` | Bị chuyển về dashboard Giảng viên hoặc nhận 403; không tải dữ liệu Admin | P0 | |

### M. Chức năng Sinh viên

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| STD-01 | Xem hồ sơ cá nhân | Đăng nhập `2500001` | Mở `/student/profile` | Hiển thị đúng hồ sơ, lớp và email của sinh viên hiện tại | P1 | |
| STD-02 | Xem học phần đang mở | Học kỳ có thời gian đăng ký hợp lệ | Mở `/student/enroll` | Chỉ hiển thị section OPEN của học kỳ hiện tại và còn chỗ | P0 | |
| STD-03 | Đăng ký học phần hợp lệ | Có section OPEN, còn chỗ, trong thời gian đăng ký | Chọn một section và bấm Đăng ký | Đăng ký thành công; sĩ số tăng; section xuất hiện trong học phần đã đăng ký | P0 | |
| STD-04 | Đăng ký trùng học phần | Đã đăng ký section | Bấm đăng ký lại hoặc gửi POST lần hai | Bị từ chối; không tạo bản ghi enrollment trùng | P0 | |
| STD-05 | Đăng ký section đã đóng/hết thời gian | Section CLOSED hoặc semester ngoài window | Thử đăng ký | Bị từ chối với thông báo đúng; sĩ số không đổi | P0 | |
| STD-06 | Vượt quá 30 tín chỉ | Sinh viên đã có tổng tín chỉ gần 30 | Đăng ký section làm tổng vượt 30 | Bị từ chối; các đăng ký cũ không thay đổi | P0 | |
| STD-07 | Hủy đăng ký của chính mình | Có enrollment đang ENROLLED | Vào học phần đã đăng ký, bấm Hủy và xác nhận | Enrollment chuyển CANCELLED/biến mất khỏi danh sách active, chỗ trống được giải phóng | P0 | |
| STD-08 | Không hủy enrollment của người khác | Có ID enrollment của sinh viên khác | Gửi DELETE trực tiếp bằng token sinh viên hiện tại | Bị từ chối; dữ liệu người kia không đổi | P0 | |
| STD-09 | Xem thời khóa biểu | Có lịch theo lớp hoặc học phần | Mở `/student/schedule`, lọc học kỳ, đổi Grid/List | Chỉ hiển thị lịch thuộc sinh viên; dữ liệu ngày/thứ/tiết/phòng chính xác | P0 | |
| STD-10 | In thời khóa biểu | Đang ở màn hình thời khóa biểu | Bấm In | Mở chức năng in và nội dung in đúng lịch đang xem | P2 | |
| STD-11 | Xem bảng điểm và CPA | Có điểm đã tính | Mở `/student/transcript` | Chỉ xem được bảng điểm của chính mình; tổng tín chỉ, điểm chữ, GPA/CPA tính đúng | P0 | |
| STD-12 | Không xem transcript sinh viên khác | Đăng nhập Sinh viên | Gọi `/api/transcript/student/{studentId-khác}` | Bị từ chối 403 hoặc endpoint phải được giới hạn theo role; không lộ dữ liệu | P0 | |
| STD-13 | Đổi mật khẩu Sinh viên | Đã đăng nhập Sinh viên | Thực hiện đổi mật khẩu | Đổi thành công với mật khẩu hợp lệ, lỗi với dữ liệu không hợp lệ | P1 | |
| STD-14 | Không truy cập chức năng Giảng viên/Admin | Đăng nhập Sinh viên | Mở `/lecturer/grades`, `/admin/grades` và gọi API PUT điểm | Bị chặn cả ở giao diện lẫn backend | P0 | |

### N. API, bảo mật và khả năng tương thích

| ID | Test case | Tiền điều kiện / dữ liệu | Các bước thực hiện | Kết quả mong đợi | Ưu tiên | KQ |
|---|---|---|---|---|---|---|
| API-01 | API public login | Không có token | POST `/api/auth/login` với dữ liệu hợp lệ | Trả 200 và token; không yêu cầu Authorization | P0 | |
| API-02 | API GET yêu cầu xác thực | Không có token | Gọi GET `/api/students`, `/api/dashboard` | Trả 401/403; không trả dữ liệu | P0 | |
| API-03 | Kiểm tra RBAC theo HTTP method | Có token từng role | Dùng Sinh viên gọi POST/PUT/DELETE Admin; dùng Giảng viên gọi PUT điểm section khác | Trả 403 hoặc lỗi nghiệp vụ; dữ liệu không bị thay đổi | P0 | |
| API-04 | Validate JSON rỗng/sai kiểu | Có token Admin | Gửi body rỗng, thiếu field hoặc sai kiểu dữ liệu đến các API POST/PUT | Trả lỗi 400 có thông tin field; backend không phát sinh 500 | P1 | |
| API-05 | Không lộ mật khẩu trong response | Có dữ liệu user | Kiểm tra response login, student/lecturer profile và Network tab | Không có password/hash password trong JSON trả về | P0 | |
| API-06 | CORS đúng origin | Chạy frontend tại localhost:5173 | Gọi API từ frontend và thử origin không được phép | Origin hợp lệ được phép; origin ngoài whitelist bị chặn | P1 | |
| API-07 | Refresh trực tiếp các route frontend | Đã đăng nhập | Mở trực tiếp từng route bằng Ctrl+L/F5 | Vite phục vụ ứng dụng đúng; không trả 404 ngoài ý muốn | P1 | |
| API-08 | Responsive cơ bản | Có thể dùng DevTools | Kiểm tra width 1440, 1024, 768 và mobile 390 px ở các màn hình chính | Không tràn ngang nghiêm trọng, form/modal/bảng có thể thao tác | P2 | |
| API-09 | Xử lý lỗi backend/mất mạng | Tắt backend hoặc ngắt mạng | Tải trang và thực hiện thao tác lưu | Có thông báo lỗi thân thiện, không treo loading vô hạn, có thể thử lại | P1 | |

## 5. Các điểm cần xác nhận/ghi nhận khi chạy test

1. **Tài khoản test không đồng nhất:** seed dùng `admin`, `gv01`, `2500001` và mật khẩu `123456`; README và nút đăng nhập nhanh đang dùng giá trị khác. Đây là case cần xác nhận trước khi nghiệm thu.
2. **Đường dẫn điều hướng Giảng viên:** dashboard đang điều hướng tới `/lecturer/sections`, trong khi route được khai báo là `/lecturer/my-sections`. Chạy `LECT-01/LECT-02` để xác nhận lỗi.
3. **Đường dẫn điều hướng Sinh viên:** dashboard đang điều hướng tới `/student/my-enrollments`, trong khi route được khai báo là `/student/enrollments`. Chạy `STD-07` hoặc click liên kết từ dashboard để xác nhận lỗi.
4. **Khoảng thời gian đăng ký:** case `STD-03` phụ thuộc ngày hiện tại và cấu hình học kỳ. Không đánh dấu Fail nếu dữ liệu test không ở trong registration window; đánh dấu Blocked và tạo học kỳ test.
5. **Giới hạn điểm:** DTO hiện chưa thể hiện annotation giới hạn 0–10. Case `GRADE-08` cần được chạy qua API để xác định hệ thống đã chặn ở tầng khác hay chưa.

## 6. Báo cáo kết quả

Khi thực thi, bổ sung vào cột **KQ** và ghi defect theo mẫu:

```text
Defect ID: DEF-xxx
Test case: AUTH-xx / STD-xx / ...
Môi trường: frontend ..., backend ..., database ...
Bước tái hiện: ...
Kết quả thực tế: ...
Kết quả mong đợi: ...
Mức độ: Blocker / Critical / Major / Minor
Ảnh chụp hoặc log: ...
```
