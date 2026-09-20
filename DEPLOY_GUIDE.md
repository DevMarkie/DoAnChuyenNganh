# HƯỚNG DẪN TRIỂN KHAI & CHIA SẺ TRUY CẬP HỆ THỐNG
### (DevMarkie/DoAnChuyenNganh - Hệ Thống Quản Lý Đào Tạo & Sinh Viên)

Tài liệu này hướng dẫn chi tiết các phương thức giúp **mọi người (thầy cô, bạn bè, hội đồng chấm đồ án)** có thể truy cập và sử dụng hệ thống từ bất kỳ thiết bị nào (máy tính, điện thoại, máy tính bảng).

---

## 🚀 TÓM TẮT CÁC CÁCH CHIA SẺ TRUY CẬP

| Phương thức | Khi nào nên dùng? | Yêu cầu | Chi phí | Tốc độ |
|---|---|---|---|---|
| **Cách 1: Public Internet Tunnel** *(Khuyên dùng cho Demo/Chấm đồ án)* | Cần gửi link HTTPS ngay cho người ngoài truy cập từ xa | Máy tính của bạn đang bật & chạy app | 0đ (Miễn phí) | Rất nhanh, có HTTPS |
| **Cách 2: Mạng nội bộ (LAN / Wi-Fi)** | Thầy cô/bạn bè kết nối cùng mạng Wi-Fi trường hoặc phòng trọ | Chung mạng Wi-Fi | 0đ | Tức thì |
| **Cách 3: Docker Compose Trọn Gói** | Triển khai trên máy tính khác hoặc VPS riêng | Cài sẵn Docker | 0đ | Độc lập, ổn định |
| **Cách 4: Cloud Hosting 24/7** | Chạy online vĩnh viễn không cần bật máy tính cá nhân | Tài khoản GitHub, Render, Vercel | Miễn phí (Free Tier) | Hoạt động 24/7 |

---

## 🌟 CÁCH 1: TẠO ĐƯỜNG LINK PUBLIC INTERNET (DEMO NGAY LẬP TỨC)

Đây là cách **nhanh nhất** để mọi người ở bất cứ đâu trên thế giới có thể truy cập trực tiếp vào hệ thống đang chạy trên máy bạn mà **không cần mở port router, không cần mua tên miền hay thuê hosting**.

### Các bước thực hiện:

#### Bước 1: Khởi động hệ thống trên máy
Chỉ cần nhấp đúp chuột vào file:
👉 **`start_dev.bat`** (ở thư mục gốc dự án)
- File script sẽ tự động khởi động Database, Backend Spring Boot (cổng 8080) và Frontend React (cổng 5173).

#### Bước 2: Bật đường hầm Internet
Nhấp đúp chuột vào file:
👉 **`share_internet.bat`**
- Chọn **`1`** (Cloudflare Tunnel - Khuyên dùng) hoặc **`2`** (Localtunnel).
- Màn hình sẽ xuất hiện một đường link HTTPS công khai, ví dụ:
  ```text
  https://smart-student-portal-xyz.trycloudflare.com
  ```
- **Copy link này gửi cho thầy cô hoặc bạn bè.** Họ có thể mở trên điện thoại hoặc máy tính bất kỳ để thao tác như một trang web thật!

*(Lưu ý: Giữ cửa sổ terminal này mở trong lúc mọi người đang trải nghiệm).*

---

## 📶 CÁCH 2: TRUY CẬP TRONG CÙNG MẠNG WI-FI / LAN

Khi bạn và người khác cùng kết nối chung một mạng Wi-Fi (ví dụ Wi-Fi trường Đại học Phenikaa, Wi-Fi phòng lab, hoặc Wi-Fi gia đình):

1. Chạy file `start_dev.bat`.
2. Xem địa chỉ IP máy tính của bạn (được in trực tiếp trên cửa sổ `start_dev.bat`, ví dụ: `192.168.1.130`).
3. Mọi người chỉ cần mở trình duyệt trên điện thoại hoặc laptop và gõ:
   ```text
   http://192.168.1.130:5173
   ```
4. Hệ thống đã được cấu hình CORS mở và Vite reverse proxy, các thiết bị ngoại vi có thể đăng nhập, xem thời khóa biểu, tra cứu điểm bình thường.

---

## 🐳 CÁCH 3: CHẠY TRỌN GÓI BẰNG DOCKER COMPOSE (1-CLICK RUN)

Dự án đã được đóng gói toàn bộ với Docker:
- **`backend/Dockerfile`**: Đóng gói Spring Boot Java 21 gọn nhẹ.
- **`frontend/Dockerfile`**: Đóng gói React Vite + máy chủ Nginx reverse proxy.
- **`docker-compose.yml`**: Tự động liên kết MySQL, nạp sẵn CSDL và seed mẫu.

### Cách chạy:
```bash
# Tại thư mục gốc của dự án:
docker compose up --build -d
```

Sau khi chạy xong:
- **Ứng dụng Web (Frontend + Nginx proxy):** `http://localhost` hoặc `http://localhost:5173`
- **Backend API:** `http://localhost:8080`
- **Swagger Documentation:** `http://localhost:8080/swagger-ui.html`

Để dừng dịch vụ:
```bash
docker compose down
```

---

## ☁️ CÁCH 4: TRIỂN KHAI LÊN CLOUD MIỄN PHÍ (24/7)

Nếu bạn muốn trang web hoạt động online liên tục không phụ thuộc vào việc bật/tắt máy tính cá nhân:

### 1. Cơ sở dữ liệu (Database MySQL Miễn Phí):
- Đăng ký tài khoản tại [Aiven](https://aiven.io/) hoặc [TiDB Cloud](https://tidbcloud.com/) hoặc [Clever Cloud](https://www.clever-cloud.com/).
- Tạo một cơ sở dữ liệu MySQL miễn phí.
- Dùng công cụ MySQL Workbench hoặc DBeaver kết nối và chạy lần lượt 2 file:
  1. `database/schema.sql`
  2. `database/seed.sql`
- Lưu lại chuỗi kết nối: JDBC URL, Username, Password.

### 2. Triển khai Backend lên Render.com:
- Đăng nhập [Render.com](https://render.com/) bằng tài khoản GitHub.
- Chọn **New +** -> **Web Service** -> chọn repo `DevMarkie/DoAnChuyenNganh`.
- Cấu hình:
  - **Root Directory:** `backend`
  - **Environment:** `Docker` (Render sẽ tự động dùng `backend/Dockerfile`)
  - **Environment Variables:**
    - `SPRING_DATASOURCE_URL`: `<JDBC URL từ bước 1>`
    - `SPRING_DATASOURCE_USERNAME`: `<DB Username>`
    - `SPRING_DATASOURCE_PASSWORD`: `<DB Password>`
    - `JWT_SECRET`: `<Chuỗi secret bất kỳ>`
- Nhấn **Create Web Service**. Sau vài phút Render sẽ cấp cho bạn một URL backend HTTPS dạng: `https://sms-backend-xyz.onrender.com`.

### 3. Triển khai Frontend lên Vercel:
- Đăng nhập [Vercel.com](https://vercel.com/) bằng GitHub.
- Chọn **Import Project** -> chọn repo `DevMarkie/DoAnChuyenNganh`.
- Cấu hình:
  - **Root Directory:** `frontend`
  - **Framework Preset:** `Vite`
  - **Environment Variables:**
    - `VITE_API_URL`: `https://sms-backend-xyz.onrender.com/api` (URL backend lấy từ bước 2)
- Nhấn **Deploy**. Sau 1 phút bạn sẽ có link web chính thức dạng: `https://sms-portal.vercel.app` để chia sẻ cho mọi người dùng 24/7!

---

## 🔐 THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP MẪU

| Vai trò | Tên đăng nhập | Mật khẩu mặc định | Quyền hạn |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `123456` | Quản lý sinh viên, giảng viên, môn học, lớp học phần, lịch học, mở cổng đăng ký |
| **Giảng viên (Lecturer)** | `1000001` | `123456` | Xem lịch giảng dạy, xem danh sách sinh viên theo lớp, nhập và khóa điểm |
| **Sinh viên (Student)** | `2500001` | `123456` | Tra cứu học phần, đăng ký tín chỉ online, xem thời khóa biểu cá nhân, tra cứu điểm |

---

## 🛠️ HỖ TRỢ VÀ XỬ LÝ SỰ CỐ THƯỜNG GẶP

1. **Người ngoài không vào được link LAN `192.168.1.xxx`:**
   - Kiểm tra xem máy tính của bạn và người đó có kết nối cùng một mạng Wi-Fi không.
   - Kiểm tra Windows Firewall: Nếu bị chặn, hãy mở Windows Defender Firewall -> "Allow an app through firewall" -> Cho phép Node.js / Java. Hoặc dùng ngay **Cách 1 (share_internet.bat)** để không bao giờ bị ảnh hưởng bởi firewall nội bộ.

2. **Lỗi `CORS policy` khi gọi API:**
   - Hệ thống đã được cấu hình cho phép mọi origin (`setAllowedOriginPatterns("*")`) và Vite proxy. Đảm bảo bạn đã pull code mới nhất.

3. **Database báo lỗi `Communications link failure`:**
   - Kiểm tra container MySQL đã chạy chưa bằng lệnh `docker ps`.
   - Nếu chưa chạy, gõ `docker compose up -d db`.
