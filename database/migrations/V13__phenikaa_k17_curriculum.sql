-- ============================================================
-- V13__phenikaa_k17_curriculum.sql
-- Chuẩn hóa toàn diện Khung Chương trình Đào tạo Khóa 17
-- Chuyên ngành: Kỹ thuật phần mềm (KTPM) - Trường Đại học Phenikaa
-- ============================================================

-- 1. BỔ SUNG & CẬP NHẬT 70 MÔN HỌC CHUẨN PHENIKAA K17 VÀO BẢNG subjects
-- Sử dụng id từ 201 đến 270 để bảo đảm không xung đột với dữ liệu có sẵn (1..144)
-- ============================================================

INSERT INTO subjects (id, subject_code, subject_name, credits, description, department_id, is_active)
VALUES
-- KHỐI A1: GIÁO DỤC ĐẠI CƯƠNG (42 Tín chỉ - 18 Môn)
(201, 'FFS702001', 'Pháp luật đại cương', 2, 'Cơ sở lý luận về nhà nước, pháp luật và hệ thống tư pháp Việt Nam', 7, 1),
(202, 'FEL702075', 'Tiếng Anh cơ bản 1', 2, 'Tiếng Anh giao tiếp và ngữ pháp học thuật cơ bản giai đoạn 1', 6, 1),
(203, 'FFS703013', 'Vật lý 1', 3, 'Cơ học chất điểm, chất lưu, nhiệt học và nhiệt động lực học', 1, 1),
(204, 'FFS703007', 'Đại số tuyến tính', 3, 'Ma trận, định thức, không gian vector và phép biến đổi tuyến tính', 1, 1),
(205, 'FEL703076', 'Tiếng Anh cơ bản 2', 3, 'Tiếng Anh giao tiếp và từ vựng học thuật giai đoạn 2', 6, 1),
(206, 'FFS703080', 'Giải tích 1', 3, 'Giới hạn, đạo hàm, vi phân và tích phân hàm một biến số', 1, 1),
(207, 'FEL703077', 'Tiếng Anh cơ bản 3', 3, 'Tiếng Anh học thuật nâng cao kỹ năng đọc hiểu và viết văn bản', 6, 1),
(208, 'FFS703014', 'Vật lý 2', 3, 'Điện trường tĩnh, từ trường, cảm ứng điện từ và sóng điện từ', 1, 1),
(209, 'FFS703064', 'Giải tích 2', 3, 'Phép tính vi tích phân hàm nhiều biến, chuỗi số và chuỗi hàm', 1, 1),
(210, 'FEL703078', 'Tiếng Anh nâng cao 1', 3, 'Thuyết trình và viết luận học thuật chuyên sâu chuẩn B2', 6, 1),
(211, 'FFS703010', 'Lý thuyết xác suất thống kê', 3, 'Biến ngẫu nhiên, quy luật phân phối xác suất và ước lượng thống kê mẫu', 1, 1),
(212, 'FEL703079', 'Tiếng Anh nâng cao 2', 3, 'Kỹ năng tranh biện và đọc tài liệu kỹ thuật công nghệ thông tin', 6, 1),
(213, 'FEL702080', 'Tiếng Anh nâng cao 3', 2, 'Tiếng Anh chuyên ngành kỹ thuật phần mềm và chuẩn bị phỏng vấn IT', 6, 1),
(214, 'FFS703002', 'Triết học Mác - Lênin', 3, 'Thế giới quan và phương pháp luận triết học duy vật biện chứng', 7, 1),
(215, 'FFS702003', 'Kinh tế chính trị Mác - Lênin', 2, 'Học thuyết giá trị thặng dư và các quy luật kinh tế thị trường định hướng XHCN', 7, 1),
(216, 'FFS702004', 'Chủ nghĩa xã hội khoa học', 2, 'Quy luật chính trị - xã hội trong thời kỳ quá độ lên chủ nghĩa xã hội', 7, 1),
(217, 'FFS702005', 'Lịch sử Đảng cộng sản Việt Nam', 2, 'Sự ra đời, đường lối cách mạng và vai trò lãnh đạo lịch sử của Đảng', 7, 1),
(218, 'FFS702006', 'Tư tưởng Hồ Chí Minh', 2, 'Hệ thống quan điểm toàn diện về cách mạng, độc lập dân tộc và CNXH', 7, 1),

-- KHỐI B1: CƠ SỞ KHỐI NGÀNH (31 Tín chỉ - 11 Môn)
(219, 'CSE703107', 'Cơ sở lập trình', 3, 'Tư duy thuật toán, cú pháp, con trỏ và giải quyết bài toán với C/C++', 1, 1),
(220, 'CSE703029', 'Lập trình hướng đối tượng', 3, 'Đóng gói, kế thừa, đa hình, giao diện và trừu tượng hóa OOP với Java/C++', 1, 1),
(221, 'CSE703024', 'Toán rời rạc', 3, 'Logic mệnh đề, tập hợp, quan hệ, lý thuyết đồ thị và bài toán đếm', 1, 1),
(222, 'CSE703006', 'Cấu trúc dữ liệu và thuật toán', 3, 'Ngăn xếp, hàng đợi, danh sách liên kết, cây nhị phân, giải thuật sắp xếp & tìm kiếm', 1, 1),
(223, 'CSE703008', 'Cơ sở dữ liệu', 3, 'Mô hình dữ liệu quan hệ, thiết kế ERD, chuẩn hóa 3NF/BCNF và SQL', 1, 1),
(224, 'CSE703023', 'Kiến trúc máy tính', 3, 'Tập lệnh vi xử lý, đường truyền dữ liệu, tổ chức bộ nhớ Cache và Pipeline', 1, 1),
(225, 'CSE702017', 'Hệ điều hành', 2, 'Quản lý tiến trình, luồng, đồng bộ hóa IPC, bộ nhớ ảo và hệ thống tệp', 1, 1),
(226, 'CSE702036', 'Mạng máy tính', 2, 'Mô hình OSI, chồng giao thức TCP/IP, định tuyến IP và mạng cục bộ LAN/WAN', 1, 1),
(227, 'CSE703057', 'Tối ưu hóa', 3, 'Quy hoạch tuyến tính, bài toán cực trị, đối ngẫu và thuật toán Simplex', 1, 1),
(228, 'CSE703016', 'Giao diện người máy', 3, 'Nguyên lý tương tác Human-Computer Interaction, UX research và UI prototyping', 1, 1),
(229, 'CSE703052', 'Thuật toán ứng dụng', 3, 'Quy hoạch động, đồ thị nâng cao, thuật toán nhánh cận và heuristic', 1, 1),

-- KHỐI C: BỔ TRỢ & KỸ NĂNG MỀM (Khối C1: 5 TC Bắt buộc; Khối C2: Tự chọn 4 TC trong 4 môn)
(230, 'FBE702001', 'Quản trị học', 2, 'Các chức năng hoạch định, tổ chức, lãnh đạo và kiểm soát trong tổ chức', 3, 1),
(231, 'FBE703044', 'Kinh tế vi mô', 3, 'Cung cầu thị trường, độ co giãn, lý thuyết người tiêu dùng và sản xuất', 3, 1),
(232, 'FTS702003', 'Kỹ năng đàm phán, thương lượng', 2, 'Chiến lược đàm phán dựa trên nguyên tắc, giải quyết xung đột và thương lượng', 7, 1),
(233, 'FTS702001', 'Kỹ năng khởi nghiệp và lãnh đạo', 2, 'Mô hình kinh doanh Canvas, tư duy khởi nghiệp tinh gọn và nghệ thuật dẫn dắt', 7, 1),
(234, 'FTS702002', 'Kỹ năng quản lý dự án', 2, 'Lập kế hoạch tiến độ, kiểm soát chi phí, quản trị rủi ro dự án cơ bản', 7, 1),
(235, 'FTS702004', 'Kỹ năng tư duy sáng tạo và phản biện', 2, 'Kỹ thuật tư duy Design Thinking, phản biện logic và giải quyết vấn đề phức tạp', 7, 1),

-- KHỐI D1: CHUYÊN NGÀNH BẮT BUỘC (30 Tín chỉ - 11 Môn)
(236, 'CSE702106', 'Giới thiệu ngành', 2, 'Bức tranh toàn cảnh ngành KTPM, các vị trí việc làm và đạo đức nghề nghiệp IT', 1, 1),
(237, 'CSE703064', 'Xây dựng ứng dụng web', 3, 'Phát triển Fullstack Web: React, Node.js/Spring Boot và RESTful API', 1, 1),
(238, 'CSE702049', 'Quản trị dự án công nghệ thông tin', 2, 'Khung quản trị Agile/Scrum, Jira/Kanban, ước lượng nỗ lực và quản lý rủi ro PM', 1, 1),
(239, 'CSE702115', 'Các hệ thống thông minh', 2, 'Hệ chuyên gia, lập luận mờ, mạng nơ-ron và tác tử thông minh trong phần mềm', 1, 1),
(240, 'CSE703094', 'Phát triển ứng dụng di động', 3, 'Lập trình ứng dụng di động Android/iOS với Kotlin, Flutter hoặc React Native', 1, 1),
(241, 'CSE703095', 'Yêu cầu phần mềm', 3, 'Thu thập, phân tích đặc tả yêu cầu SRS, User Stories và mô hình hóa nghiệp vụ', 1, 1),
(242, 'CSE703048', 'Phân tích và thiết kế phần mềm', 3, 'Mô hình hóa hệ thống với UML 2.5, Clean Architecture và Design Patterns', 1, 1),
(243, 'CSE703096', 'Đồ án chuyên ngành', 3, 'Phát triển đồ án sản phẩm phần mềm thực tế theo nhóm theo mô hình Agile Scrum', 1, 1),
(244, 'CSE703110', 'Kiến trúc phần mềm', 3, 'Kiến trúc vi dịch vụ Microservices, Event-Driven, DDD và đánh giá chất lượng ATAM', 1, 1),
(245, 'CSE703093', 'An toàn phần mềm', 3, 'Bảo mật mã nguồn DevSecOps, OWASP Top 10, lỗ hổng SQLi, XSS và phân tích mã tĩnh', 1, 1),
(246, 'CSE703010', 'Đánh giá và kiểm định chất lượng phần mềm', 3, 'Kiểm thử hộp đen, hộp trắng, Unit Testing với JUnit, tự động hóa Selenium/Cypress', 1, 1),

-- KHỐI D2: CHUYÊN NGÀNH TỰ CHỌN (Tự chọn 10 Tín chỉ: Nhóm D2.1 chọn 4 TC + Nhóm D2.2 chọn 6 TC)
-- Nhóm D2.1 (Môn 2 TC)
(247, 'CSE702100', 'Các vấn đề hiện đại trong KTPM', 2, 'Xu hướng AI-driven engineering, Serverless, MLOps và Low-code platform', 1, 1),
(248, 'CSE702011', 'Điện toán đám mây', 2, 'Mô hình IaaS, PaaS, SaaS, kiến trúc AWS/GCP, Docker container và Kubernetes', 1, 1),
(249, 'CSE702033', 'Lập trình trò chơi', 2, 'Phát triển Game 2D/3D với công cụ Unity, vật lý game, hoạt cảnh và đồ họa', 1, 1),
(250, 'CSE702103', 'Linux và phần mềm mã nguồn mở', 2, 'Quản trị hệ thống Linux, Bash script, giấy phép bản quyền mở OSS và Git workflow', 1, 1),
(251, 'CSE702101', 'Ngôn ngữ lập trình nâng cao', 2, 'Lập trình hàm, bất đồng bộ Asynchronous, generics và thiết kế ngôn ngữ hiện đại', 1, 1),
(252, 'CSE702104', 'Trích xuất thông tin và tìm kiếm web', 2, 'Web scraping, công cụ tìm kiếm Elasticsearch/Lucene, đánh chỉ mục và xếp hạng trang', 1, 1),

-- Nhóm D2.2 (Môn 3 TC)
(253, 'CSE703112', 'Bảo mật hệ thống', 3, 'Mật mã học ứng dụng, hạ tầng PKI, xác thực đa yếu tố MFA và tường lửa mạng', 1, 1),
(254, 'CSE703099', 'Các hệ nhúng', 3, 'Lập trình vi điều khiển ARM/ESP32, hệ điều hành thời gian thực RTOS và giao tiếp ngoại vi', 1, 1),
(255, 'CSE703097', 'Công nghệ chuỗi khối', 3, 'Cơ chế đồng thuận Blockchain, hợp đồng thông minh Smart Contract trên Ethereum', 1, 1),
(256, 'CSE703098', 'Lập trình phân tán', 3, 'RPC, gRPC, giao tiếp tin nhắn RabbitMQ/Kafka và tính nhất quán dữ liệu phân tán CAP', 1, 1),
(257, 'CSE703032', 'Lập trình song song', 3, 'Đa luồng CPU, tính toán song song trên GPU CUDA, OpenMP và tối ưu hiệu năng', 1, 1),
(258, 'CSE703113', 'Phương pháp số cho học máy', 3, 'Đại số ma trận nâng cao, Gradient Descent, giải tích ma trận và phương pháp tối ưu ML', 1, 1),
(259, 'CSE703102', 'Thương mại điện tử', 3, 'Kiến trúc cổng thanh toán trực tuyến, giỏ hàng, logistics và bảo mật giao dịch số', 1, 1),
(260, 'CSE703054', 'Tích hợp và phân tích dữ liệu lớn', 3, 'Hạ tầng Hadoop, Spark SQL, đường ống ETL dữ liệu và Data Lakehouse', 1, 1),

-- KHỐI E: THỰC TẬP & ĐỒ ÁN TỐT NGHIỆP (14 Tín chỉ - 2 Môn Bắt buộc)
(261, 'CSE704067', 'Thực tập tốt nghiệp', 4, 'Thực tập thực tế từ 10-12 tuần tại doanh nghiệp phần mềm hoặc viện nghiên cứu IT', 1, 1),
(262, 'CSE710111', 'Đồ án tốt nghiệp', 10, 'Nghiên cứu và hiện thực hóa đề tài tốt nghiệp Kỹ sư phần mềm toàn diện', 1, 1),

-- KHỐI F: MÔN ĐIỀU KIỆN (Không tính CPA tích lũy nhưng là điều kiện công nhận tốt nghiệp)
(263, 'FFS708066', 'Giáo dục quốc phòng - an ninh', 8, 'Chứng chỉ Giáo dục Quốc phòng - An ninh theo quy định của Bộ GD&ĐT', 7, 1),
(264, 'FFS701072', 'Giáo dục thể chất: Chạy 1', 1, 'Kỹ thuật chạy cự ly ngắn, cự ly trung bình và rèn luyện thể lực chung', 7, 1),
(265, 'FFS701073', 'Giáo dục thể chất: Aerobic', 1, 'Thể dục nhịp điệu rèn luyện sự dẻo dai và phối hợp vận động', 7, 1),
(266, 'FFS701068', 'Giáo dục thể chất: Bóng chuyền', 1, 'Kỹ thuật cơ bản môn bóng chuyền: chuyền bóng, đệm bóng và phát bóng', 7, 1),
(267, 'FFS701069', 'Giáo dục thể chất: Bóng đá', 1, 'Kỹ thuật cơ bản môn bóng đá: dẫn bóng, chuyền bóng và sút cầu môn', 7, 1),
(268, 'FFS701067', 'Giáo dục thể chất: Bóng rổ', 1, 'Kỹ thuật cơ bản môn bóng rổ: dẫn bóng, chuyền bóng và ném rổ', 7, 1),
(269, 'FFS701070', 'Giáo dục thể chất: Cầu lông', 1, 'Kỹ thuật giao cầu, đánh cầu cao sâu và di chuyển chân môn cầu lông', 7, 1),
(270, 'FEL704000', 'Tiếng Anh bổ trợ', 4, 'Học phần tăng cường củng cố kỹ năng tiếng Anh cho sinh viên chưa đạt chuẩn đầu vào', 6, 1)
ON DUPLICATE KEY UPDATE
    subject_code = VALUES(subject_code),
    subject_name = VALUES(subject_name),
    credits = VALUES(credits),
    description = VALUES(description),
    department_id = VALUES(department_id),
    is_active = VALUES(is_active);

-- ============================================================
-- 2. CẬP NHẬT CHƯƠNG TRÌNH ĐÀO TẠO KTPM-K17 (id = 6)
-- Tổng số tín chỉ tích lũy công nhận tốt nghiệp: 135 Tín chỉ
-- ============================================================

UPDATE curriculum_programs
SET name = 'Chương trình đào tạo Kỹ thuật phần mềm - Khóa 17 (Phenikaa Standardized)',
    total_credits = 135
WHERE id = 6;

-- ============================================================
-- 3. TÁI CẤU TRÚC KHỐI KIẾN THỨC CHO KTPM-K17 (id = 6)
-- Xóa các liên kết và khối cũ của program 6 để thiết lập cấu trúc mới chuẩn hóa
-- ============================================================

DELETE FROM curriculum_block_subjects WHERE block_id IN (SELECT id FROM curriculum_blocks WHERE program_id = 6);
DELETE FROM curriculum_blocks WHERE program_id = 6;

INSERT INTO curriculum_blocks (id, program_id, code, name, block_type, required_subject_count, required_credits, elective_subject_count, elective_credits, display_order)
VALUES
(26, 6, 'A1_GDDC',      'Khối kiến thức Giáo dục đại cương',           'COMPULSORY', 18, 42, 0, 0, 1),
(27, 6, 'B1_CSNG',      'Khối kiến thức Cơ sở khối ngành',             'COMPULSORY', 11, 31, 0, 0, 2),
(28, 6, 'C1_BOTRO',     'Khối kiến thức Bổ trợ kinh tế & Quản trị',    'COMPULSORY', 2,  5,  0, 0, 3),
(29, 6, 'C2_KYNANG',    'Khối kiến thức Kỹ năng mềm ứng dụng',         'ELECTIVE',   0,  0,  2, 4, 4),
(30, 6, 'D1_CNBB',      'Khối kiến thức Chuyên ngành bắt buộc',        'COMPULSORY', 11, 30, 0, 0, 5),
(601, 6, 'D2_CNTC',     'Khối kiến thức Chuyên ngành tự chọn',         'ELECTIVE',   0,  0,  4, 10, 6),
(602, 6, 'E_TOTNGHIEP', 'Khối kiến thức Thực tập & Đồ án tốt nghiệp',  'COMPULSORY', 2,  14, 0, 0, 7),
(603, 6, 'F_DIEUKIEN',  'Khối kiến thức Điều kiện tốt nghiệp & Thể chất', 'COMPULSORY', 4, 11, 0, 0, 8);

-- ============================================================
-- 4. GÁN MÔN HỌC VÀO CÁC KHỐI KIẾN THỨC (curriculum_block_subjects)
-- ============================================================

INSERT INTO curriculum_block_subjects (block_id, subject_id, is_required) VALUES
-- Khối 26: A1_GDDC (18 môn bắt buộc - 42 TC)
(26, 201, 1), (26, 202, 1), (26, 203, 1), (26, 204, 1), (26, 205, 1), (26, 206, 1),
(26, 207, 1), (26, 208, 1), (26, 209, 1), (26, 210, 1), (26, 211, 1), (26, 212, 1),
(26, 213, 1), (26, 214, 1), (26, 215, 1), (26, 216, 1), (26, 217, 1), (26, 218, 1),

-- Khối 27: B1_CSNG (11 môn bắt buộc - 31 TC)
(27, 219, 1), (27, 220, 1), (27, 221, 1), (27, 222, 1), (27, 223, 1), (27, 224, 1),
(27, 225, 1), (27, 226, 1), (27, 227, 1), (27, 228, 1), (27, 229, 1),

-- Khối 28: C1_BOTRO (2 môn bắt buộc - 5 TC)
(28, 230, 1), (28, 231, 1),

-- Khối 29: C2_KYNANG (4 môn tự chọn - Chọn 2 môn = 4 TC)
(29, 232, 0), (29, 233, 0), (29, 234, 0), (29, 235, 0),

-- Khối 30: D1_CNBB (11 môn chuyên ngành bắt buộc - 30 TC)
(30, 236, 1), (30, 237, 1), (30, 238, 1), (30, 239, 1), (30, 240, 1), (30, 241, 1),
(30, 242, 1), (30, 243, 1), (30, 244, 1), (30, 245, 1), (30, 246, 1),

-- Khối 601: D2_CNTC (14 môn tự chọn chuyên ngành - Chọn 10 TC)
-- Nhóm D2.1 (2 TC/môn): 247, 248, 249, 250, 251, 252 (Chọn 2 môn = 4 TC)
-- Nhóm D2.2 (3 TC/môn): 253, 254, 255, 256, 257, 258, 259, 260 (Chọn 2 môn = 6 TC)
(601, 247, 0), (601, 248, 0), (601, 249, 0), (601, 250, 0), (601, 251, 0), (601, 252, 0),
(601, 253, 0), (601, 254, 0), (601, 255, 0), (601, 256, 0), (601, 257, 0), (601, 258, 0),
(601, 259, 0), (601, 260, 0),

-- Khối 602: E_TOTNGHIEP (2 môn bắt buộc - 14 TC)
(602, 261, 1), (602, 262, 1),

-- Khối 603: F_DIEUKIEN (Môn điều kiện chuẩn đầu ra)
(603, 263, 1), (603, 264, 0), (603, 265, 0), (603, 266, 0), (603, 267, 0), (603, 268, 0), (603, 269, 0);

-- ============================================================
-- 5. QUAN HỆ TIÊN QUYẾT ĐÃ ĐƯỢC CHUẨN HÓA ĐỒ THỊ DAG (subject_prerequisites)
-- LOẠI BỎ TRIỆT ĐỂ CÁC LỖI NGƯỢC THỜI GIAN VÀ CHU TRÌNH VÒNG
-- Cú pháp: (subject_id, prerequisite_id) -> subject_id CẦN prerequisite_id ĐẠT TRƯỚC
-- ============================================================

-- Xóa các quan hệ cũ liên quan tới các môn 201..270 nếu có
DELETE FROM subject_prerequisites WHERE subject_id BETWEEN 201 AND 270 OR prerequisite_id BETWEEN 201 AND 270;

INSERT INTO subject_prerequisites (subject_id, prerequisite_id) VALUES
-- Tiếng Anh chuỗi lũy tiến
(205, 202), -- TA cơ bản 2 (205) -> TA cơ bản 1 (202)
(207, 205), -- TA cơ bản 3 (207) -> TA cơ bản 2 (205)
(210, 207), -- TA nâng cao 1 (210) -> TA cơ bản 3 (207)
(212, 210), -- TA nâng cao 2 (212) -> TA nâng cao 1 (210)
(213, 212), -- TA nâng cao 3 (213) -> TA nâng cao 2 (212)

-- Toán & Khoa học cơ bản
(208, 203), -- Vật lý 2 (208) -> Vật lý 1 (203)
(209, 206), -- Giải tích 2 (209) -> Giải tích 1 (206)
(227, 204), -- Tối ưu hóa (227) -> Đại số tuyến tính (204)
(227, 209), -- Tối ưu hóa (227) -> Giải tích 2 (209)

-- Chính trị - Lý luận chuỗi nối tiếp
(215, 214), -- Kinh tế chính trị (215) -> Triết học Mác-Lênin (214)
(216, 215), -- Chủ nghĩa xã hội khoa học (216) -> Kinh tế chính trị (215)
(217, 216), -- Lịch sử Đảng (217) -> Chủ nghĩa xã hội khoa học (216)
(218, 216), -- Tư tưởng Hồ Chí Minh (218) -> Chủ nghĩa xã hội khoa học (216)

-- Cơ sở ngành Lập trình & Cấu trúc dữ liệu
(220, 219), -- Lập trình hướng đối tượng (220) -> Cơ sở lập trình (219)
(222, 219), -- Cấu trúc dữ liệu và giải thuật (222) -> Cơ sở lập trình (219)
(229, 221), -- Thuật toán ứng dụng (229) -> Toán rời rạc (221)
(229, 222), -- Thuật toán ứng dụng (229) -> Cấu trúc dữ liệu và thuật toán (222)

-- Chuyên ngành Kỹ nghệ phần mềm (ĐÃ SỬA CÁC LỖI NGƯỢC THỜI GIAN)
(228, 236), -- Giao diện người máy (228) -> Giới thiệu ngành (236)
(228, 220), -- Giao diện người máy (228) -> Lập trình hướng đối tượng (220)
(237, 236), -- Xây dựng ứng dụng web (237) -> Giới thiệu ngành (236)
(237, 219), -- Xây dựng ứng dụng web (237) -> Cơ sở lập trình (219)
(239, 222), -- Các hệ thống thông minh (239) -> Cấu trúc dữ liệu và giải thuật (222)
(240, 219), -- Phát triển ứng dụng di động (240) -> Cơ sở lập trình (219)
(240, 220), -- Phát triển ứng dụng di động (240) -> Lập trình hướng đối tượng (220)
(241, 236), -- Yêu cầu phần mềm (241) -> Giới thiệu ngành (236)
(242, 220), -- Phân tích và thiết kế phần mềm (242) -> Lập trình hướng đối tượng (220)
(242, 241), -- Phân tích và thiết kế phần mềm (242) -> Yêu cầu phần mềm (241) [CHUẨN HÓA THAY VÌ ĐÒI KIẾN TRÚC PM]
(244, 242), -- Kiến trúc phần mềm (244) -> Phân tích và thiết kế phần mềm (242) [CHUẨN HÓA TIẾP NỐI THIẾT KẾ]
(238, 242), -- Quản trị dự án CNTT (238) -> Phân tích và thiết kế phần mềm (242) [ĐƯA SANG KỲ 9 HỢP LOGIC]
(243, 242), -- Đồ án chuyên ngành (243) -> Phân tích và thiết kế phần mềm (242)
(243, 223), -- Đồ án chuyên ngành (243) -> Cơ sở dữ liệu (223)
(245, 244), -- An toàn phần mềm (245) -> Kiến trúc phần mềm (244)
(245, 226), -- An toàn phần mềm (245) -> Mạng máy tính (226)
(246, 242), -- Đánh giá & Kiểm định chất lượng PM (246) -> Phân tích và thiết kế phần mềm (242)

-- Các môn tự chọn chuyên sâu
(247, 245), -- Các vấn đề hiện đại KTPM (247) -> An toàn phần mềm (245) [ĐÃ CHUYỂN SANG KỲ 11 CHUẨN XÁC]
(248, 226), -- Điện toán đám mây (248) -> Mạng máy tính (226)
(249, 220), -- Lập trình trò chơi (249) -> Lập trình hướng đối tượng (220)
(250, 225), -- Linux & phần mềm mã nguồn mở (250) -> Hệ điều hành (225)
(250, 242), -- Linux & phần mềm mã nguồn mở (250) -> Phân tích và thiết kế phần mềm (242)
(251, 220), -- Ngôn ngữ lập trình nâng cao (251) -> Lập trình hướng đối tượng (220)
(252, 237), -- Trích xuất thông tin & tìm kiếm web (252) -> Xây dựng ứng dụng web (237)
(253, 226), -- Bảo mật hệ thống (253) -> Mạng máy tính (226)
(254, 224), -- Các hệ nhúng (254) -> Kiến trúc máy tính (224)
(254, 219), -- Các hệ nhúng (254) -> Cơ sở lập trình (219)
(255, 226), -- Công nghệ chuỗi khối (255) -> Mạng máy tính (226)
(255, 222), -- Công nghệ chuỗi khối (255) -> Cấu trúc dữ liệu và giải thuật (222)
(256, 220), -- Lập trình phân tán (256) -> Lập trình hướng đối tượng (220)
(256, 226), -- Lập trình phân tán (256) -> Mạng máy tính (226)
(257, 220), -- Lập trình song song (257) -> Lập trình hướng đối tượng (220)
(257, 224), -- Lập trình song song (257) -> Kiến trúc máy tính (224)
(258, 227), -- Phương pháp số cho học máy (258) -> Tối ưu hóa (227)
(259, 237), -- Thương mại điện tử (259) -> Xây dựng ứng dụng web (237)
(260, 223), -- Tích hợp và phân tích dữ liệu lớn (260) -> Cơ sở dữ liệu (223)
(260, 222), -- Tích hợp và phân tích dữ liệu lớn (260) -> Cấu trúc dữ liệu và giải thuật (222)

-- Khối Tốt nghiệp
(261, 243), -- Thực tập tốt nghiệp (261) -> Đồ án chuyên ngành (243)
(262, 261), -- Đồ án tốt nghiệp (262) -> Thực tập tốt nghiệp (261)
(262, 243); -- Đồ án tốt nghiệp (262) -> Đồ án chuyên ngành (243)
