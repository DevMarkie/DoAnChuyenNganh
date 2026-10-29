# BÁO CÁO KIỂM THỬ TẢI: TEST ĐẾN KHI SẬP MỚI THÔI (STRESS TEST TO DEATH)
*Thời gian chạy: 06:54:55 27/10/2026*
*Hạ tầng: Nginx Load Balancer (10.240 connections) + 3 Backend Replicas (Tomcat 800 threads/instance) + Redis 7 + MySQL 8*

---

## 1. Kết quả qua từng đợt tải

| Đợt | Số Requests đồng thời | Thời gian hoàn tất | Tốc độ (RPS) | Lỗi / Timeout | Tình trạng Server |
| :---: | :---: | :---: | :---: | :---: | :---: |
| Đợt 1 | **1,000 reqs** | 9,961 ms | 100 req/s | 0 | 🟢 Sống bình thường |
| Đợt 2 | **2,500 reqs** | 13,222 ms | 189 req/s | 0 | 🟢 Sống bình thường |
| Đợt 3 | **4,000 reqs** | 20,129 ms | 199 req/s | 0 | 🟢 Sống bình thường |
| Đợt 4 | **6,500 reqs** | 38,604 ms | 168 req/s | 6,313 | 🔴 **ĐÃ SẬP HOÀN TOÀN** |

---

## 2. Điểm sập chính thức của hệ thống (Breaking Point)
- **Cấp độ tải đánh sập:** **Đợt 4 (6,500 Requests đồng thời)**
- **Dấu hiệu sập:** fetch failed
- **Nguyên nhân cốt lõi:** Vượt quá giới hạn File Descriptors / TCP Socket Allocation tối đa của card mạng ảo Windows (vEthernet/Docker NAT).
