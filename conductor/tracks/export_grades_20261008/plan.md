# Plan: Tính năng Xuất Báo Cáo Điểm

## Phase 1: Backend - Export API (Java/Spring Boot)
- [x] 1f66083 Task: Khởi tạo Data Transfer Object (DTO)
  - [ ] Write failing tests cho việc mapping dữ liệu sinh viên sang `GradeExportDTO`
  - [ ] Cài đặt `GradeExportDTO` chứa các trường: MSSV, Họ Tên, Điểm CC, Điểm GK, Điểm CK, Điểm Tổng Kết, Xếp Loại
- [ ] Task: Cài đặt Service tạo file Excel (ví dụ dùng thư viện Apache POI)
  - [ ] Write failing tests kiểm tra logic tạo file Excel (mock dữ liệu)
  - [ ] Cài đặt logic tạo Worksheet, in đậm Header và mapping danh sách DTO vào các row.
- [ ] Task: Cài đặt API Endpoint xuất file
  - [ ] Write failing integration tests kiểm tra phân quyền (Chỉ Admin và Giảng viên được truy cập)
  - [ ] Cài đặt Controller endpoint (VD: `GET /api/classes/{classId}/export-grades`), trả về file `.xlsx` (MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Frontend - Giao diện & Tích hợp API (React)
- [ ] Task: Cài đặt API Client
  - [ ] Write failing tests cho hàm gọi API (Mock Axios)
  - [ ] Cài đặt hàm gọi API hỗ trợ nhận kiểu dữ liệu `blob` (để xử lý file tải về)
- [ ] Task: Tích hợp nút Xuất báo cáo lên giao diện
  - [ ] Write failing tests kiểm tra sự hiển thị của nút bấm (chỉ hiện với đúng role)
  - [ ] Thêm nút "Xuất báo cáo điểm" vào trang quản lý lớp (`Admin`) và trang nhập điểm (`GradeEntryPage.jsx` cho Giảng viên)
  - [ ] Cài đặt logic xử lý khi nhấn nút (hiển thị loading, tải file, xử lý lỗi nếu API trả về 403)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
