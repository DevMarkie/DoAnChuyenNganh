# SƠ ĐỒ KIẾN TRÚC & HOẠT ĐỘNG HỆ THỐNG (SYSTEM DIAGRAMS)

## 1. Sơ đồ Hoạt động (Activity Diagrams)

### Luồng 1: Quy trình Sinh viên Đăng ký lớp học phần
```mermaid
stateDiagram-v2
    [*] --> Chon_Dang_Ky_Hoc_Phan : Sinh viên bấm "Đăng ký"
    
    state KiemTraHanDangKy <<choice>>
    Chon_Dang_Ky_Hoc_Phan --> KiemTraHanDangKy : Gửi yêu cầu
    KiemTraHanDangKy --> KiemTraTienQuyet : Trong thời gian mở cổng
    KiemTraHanDangKy --> BaoLoi_HanDangKy : Ngoài hạn đăng ký
    
    state KiemTraTienQuyet <<choice>>
    KiemTraTienQuyet --> KiemTraTrungLich : Đã qua môn tiên quyết
    KiemTraTienQuyet --> BaoLoi_TienQuyet : Chưa đạt môn tiên quyết

    state KiemTraTrungLich <<choice>>
    KiemTraTrungLich --> KiemTraSiSo : Không trùng TKB hiện tại
    KiemTraTrungLich --> BaoLoi_TrungLich : Trùng lịch học/thi

    state KiemTraSiSo <<choice>>
    KiemTraSiSo --> KiemTraTinChi : Sĩ số < Max Capacity
    KiemTraSiSo --> BaoLoi_SiSo : Lớp đã đầy

    state KiemTraTinChi <<choice>>
    KiemTraTinChi --> GhiNhanDangKy : Tổng tín chỉ <= Max
    KiemTraTinChi --> BaoLoi_TinChi : Vượt quá giới hạn

    BaoLoi_HanDangKy --> HienThiCanhBao
    BaoLoi_TienQuyet --> HienThiCanhBao
    BaoLoi_TrungLich --> HienThiCanhBao
    BaoLoi_SiSo --> HienThiCanhBao
    BaoLoi_TinChi --> HienThiCanhBao
    
    HienThiCanhBao --> [*] : Hủy giao dịch

    GhiNhanDangKy --> CapNhatDatabase : Lưu Enrollment
    CapNhatDatabase --> HienThiThanhCong
    HienThiThanhCong --> [*]
```

### Luồng 2: Quy trình Nhập, Chốt & Khóa sổ điểm
```mermaid
stateDiagram-v2
    [*] --> GiangVien_ChonLop
    GiangVien_ChonLop --> NhapDiem : Điền form hoặc Import Excel
    NhapDiem --> TinhDiemTongKet : Tự động tính hệ 10 & GPA
    TinhDiemTongKet --> LuuNhap : Lưu bản nháp (Draft)

    LuuNhap --> NhapDiem : Quay lại chỉnh sửa
    LuuNhap --> ChotDiem : Nhấn "Chốt & Công bố" (đủ 100% SV có điểm)

    ChotDiem --> DaCongBo : isFinalized=true, ghi finalizedAt, SV thấy điểm + tính GPA
    DaCongBo --> SuaTrongHan : GV sửa trong 7 ngày (mốc không gia hạn)
    SuaTrongHan --> DaCongBo
    DaCongBo --> KhoaCung : Quá 7 ngày → khóa GV (Read-only)
    KhoaCung --> DaCongBo : Admin mở khóa (finalize=false)
    KhoaCung --> [*]
```

### Luồng 3: Quy trình Admin Mở lớp và Gán lịch học
```mermaid
stateDiagram-v2
    [*] --> Admin_TaoLopHocPhan
    Admin_TaoLopHocPhan --> ChonMonHoc
    ChonMonHoc --> ThietLapSiSo
    ThietLapSiSo --> PhanCongGiangVien
    PhanCongGiangVien --> XepPhongVaCaHoc
    
    XepPhongVaCaHoc --> KiemTraXungDot : Submit
    
    state KiemTraXungDot <<choice>>
    KiemTraXungDot --> XungDotPhong : Phòng đã có lớp
    KiemTraXungDot --> XungDotGiangVien : Giảng viên bận
    KiemTraXungDot --> HopLe : Hợp lệ
    
    XungDotPhong --> XepPhongVaCaHoc : Đổi phòng/Đổi giờ
    XungDotGiangVien --> PhanCongGiangVien : Đổi GV/Đổi giờ
    
    HopLe --> LuuDatabase
    LuuDatabase --> [*]
```

## 2. Sơ đồ Chuyển trạng thái (State Machine Diagram)

### Vòng đời Lớp học phần
```mermaid
stateDiagram-v2
    [*] --> MoiTao : Init/Draft
    MoiTao --> DangMoDangKy : Tới hạn mở cổng
    DangMoDangKy --> DangMoDangKy : Đang nhận Enrollments
    DangMoDangKy --> DaChotDanhSach : Đóng cổng
    DaChotDanhSach --> DangHoc : Bắt đầu học kỳ
    DangHoc --> DangNhapDiem : Kết thúc môn
    DangNhapDiem --> HoanThanh_DaKhoa : GV chốt & công bố điểm
    HoanThanh_DaKhoa --> [*]
```

### Vòng đời Đăng ký môn (Enrollment)
```mermaid
stateDiagram-v2
    [*] --> DangKyTam : Cho vào giỏ
    DangKyTam --> DaGhiNhan : Validations Pass
    DangKyTam --> [*] : Thất bại
    DaGhiNhan --> DaHuy : SV hủy môn (Trong hạn)
    DaGhiNhan --> DaHoanThanh : GV chốt điểm (Graded)
    DaHuy --> [*]
    DaHoanThanh --> [*]
```
