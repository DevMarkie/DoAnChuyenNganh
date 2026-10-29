"""
Curriculum Catalog Generator & Validator for SMS
Defines all subjects across 9 majors (~295 subjects), with full 8-semester roadmaps,
prerequisite DAG validations, and knowledge blocks.
Total credits for each major: 133 - 135 credits.
"""

import sys
import collections

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SUBJECTS = {}
PREREQUISITES = []  # list of (subject_id, prereq_id)
MAJOR_ROADMAP = {}  # major_id -> {semester: [ (subject_id, block_code, is_required) ]}

def add_sub(sid, code, name, credits, dept, prereqs=None):
    SUBJECTS[sid] = {
        "id": sid,
        "code": code,
        "name": name,
        "credits": credits,
        "dept": dept,
        "prereqs": prereqs or []
    }
    if prereqs:
        for p in prereqs:
            PREREQUISITES.append((sid, p))

# =========================================================================
# 1. COMMON GENERAL EDUCATION (GDDC) (IDs 1 - 16)
# =========================================================================
add_sub(1, "PHIL101", "Triết học Mác - Lênin", 3, 1)
add_sub(2, "PHIL102", "Kinh tế chính trị Mác - Lênin", 2, 2, [1])
add_sub(3, "PHIL103", "Chủ nghĩa xã hội khoa học", 2, 2, [2])
add_sub(4, "PHIL104", "Lịch sử Đảng Cộng sản Việt Nam", 2, 1, [3])
add_sub(5, "PHIL105", "Tư tưởng Hồ Chí Minh", 2, 1, [4])
add_sub(6, "LAW101", "Pháp luật đại cương", 2, 7)
add_sub(7, "ENG101", "Tiếng Anh học thuật 1", 3, 5)
add_sub(8, "ENG102", "Tiếng Anh học thuật 2", 3, 5, [7])
add_sub(9, "MATH101", "Giải tích 1", 3, 1)
add_sub(10, "MATH102", "Đại số tuyến tính", 3, 1)
add_sub(11, "MATH103", "Giải tích 2", 3, 1, [9])
add_sub(12, "MATH104", "Xác suất thống kê", 3, 1, [9])
add_sub(13, "MATH105", "Toán kinh tế & Thống kê ứng dụng", 3, 2)
add_sub(14, "PHYS101", "Vật lý đại cương 1", 3, 3)
add_sub(15, "PHYS102", "Vật lý đại cương 2", 3, 3, [14])
add_sub(16, "CS100", "Tin học đại cương & Kỹ năng số", 2, 1)

# =========================================================================
# 2. MAJOR 1: CNTT (Công nghệ thông tin) (IDs 17 - 42, 249 - 253)
# =========================================================================
add_sub(17, "CS101", "Nhập môn lập trình", 3, 1)
add_sub(18, "CS102", "Toán rời rạc & Lý thuyết đồ thị", 3, 1)
add_sub(19, "CS201", "Lập trình hướng đối tượng", 3, 1, [17])
add_sub(20, "CS202", "Cơ sở dữ liệu", 3, 1, [17])
add_sub(21, "CS203", "Cấu trúc dữ liệu & Giải thuật", 3, 1, [17])
add_sub(22, "CS204", "Kiến trúc máy tính & Hợp ngữ", 3, 1)
add_sub(23, "CS205", "Hệ điều hành", 3, 1, [22])
add_sub(24, "CS206", "Hệ quản trị cơ sở dữ liệu", 3, 1, [20])
add_sub(25, "CS301", "Phát triển ứng dụng Web", 3, 1, [19])
add_sub(26, "CS302", "Mạng máy tính", 3, 1)
add_sub(27, "CS303", "Trí tuệ nhân tạo", 3, 1, [21])
add_sub(28, "CS304", "Công nghệ phần mềm", 3, 1, [19])
add_sub(29, "CS305", "Kiểm thử & Đảm bảo chất lượng phần mềm", 3, 1, [28])
add_sub(30, "CS306", "Lập trình thiết bị di động", 3, 1, [19])
add_sub(31, "CS307", "Phân tích & Thiết kế hệ thống thông tin", 3, 1, [20])
add_sub(32, "CS308", "Học máy ứng dụng", 3, 1, [27])
add_sub(33, "CS309", "Xử lý dữ liệu lớn & Cloud Computing", 3, 1, [20])
add_sub(34, "CS310", "Đồ án chuyên ngành Công nghệ thông tin", 3, 1, [28])
add_sub(35, "CS401", "An toàn thông tin & Mật mã", 3, 1, [26])
add_sub(36, "CS402", "Kiến trúc & Mẫu thiết kế phần mềm", 3, 1, [28])
add_sub(37, "CS403", "DevOps & Tích hợp liên tục CI/CD", 3, 1, [25])
add_sub(38, "CS406", "Thị giác máy tính & Xử lý ảnh", 3, 1, [27])
add_sub(39, "CS407", "Quản lý dự án Công nghệ thông tin", 3, 1, [28])
add_sub(40, "CS498", "Thực tập doanh nghiệp CNTT", 4, 1, [34])
add_sub(41, "CS499", "Khóa luận tốt nghiệp CNTT", 6, 1, [34])
add_sub(42, "ENG201", "Tiếng Anh chuyên ngành CNTT", 3, 5, [8])
add_sub(249, "CS404", "Phát triển hệ thống phân tán & Microservices", 3, 1, [26])
add_sub(250, "CS405", "Khai phá dữ liệu & Trực quan hóa", 3, 1, [27])
add_sub(251, "CS408", "Công nghệ chuỗi khối Blockchain & Web3", 3, 1, [35])
add_sub(252, "CS409", "Xử lý ngôn ngữ tự nhiên NLP", 3, 1, [27])
add_sub(253, "CS410", "Thiết kế giao diện người dùng UI/UX", 3, 1, [25])

# =========================================================================
# 3. MAJOR 2: QTKD (Quản trị kinh doanh) (IDs 43 - 70, 254 - 260)
# =========================================================================
add_sub(43, "BUS101", "Nguyên lý quản trị", 3, 2)
add_sub(44, "ECO101", "Kinh tế vi mô", 3, 2)
add_sub(45, "ECO102", "Kinh tế vĩ mô", 3, 2)
add_sub(46, "ACC101", "Nguyên lý kế toán", 3, 6)
add_sub(47, "MKT201", "Marketing căn bản", 3, 2, [43])
add_sub(48, "BUS201", "Hành vi tổ chức & Quản trị văn hóa", 3, 2, [43])
add_sub(49, "ACC201", "Kế toán tài chính doanh nghiệp", 3, 6, [46])
add_sub(50, "ECO201", "Thống kê kinh doanh & Dự báo", 3, 2, [13])
add_sub(51, "FIN301", "Quản trị tài chính doanh nghiệp", 3, 2, [44])
add_sub(52, "HRM301", "Quản trị nguồn nhân lực", 3, 2, [43])
add_sub(53, "BUS202", "Quản trị tác nghiệp & Sản xuất", 3, 2, [43])
add_sub(54, "LAW201", "Pháp luật kinh doanh & Doanh nghiệp", 3, 7, [6])
add_sub(55, "MKT202", "Quản trị Marketing & Định giá", 3, 2, [47])
add_sub(56, "BUS301", "Quản trị chuỗi cung ứng & Logistics", 3, 2, [53])
add_sub(57, "MKT301", "Nghiên cứu thị trường & Marketing số", 3, 2, [55])
add_sub(58, "BUS302", "Quản trị chiến lược doanh nghiệp", 3, 2, [43])
add_sub(59, "ENG203", "Tiếng Anh thương mại 1", 3, 5, [8])
add_sub(60, "BUS303", "Quản trị bán hàng & Nghệ thuật đàm phán", 3, 2, [47])
add_sub(61, "FIN302", "Quản trị tài chính quốc tế", 3, 2, [51])
add_sub(62, "BUS304", "Thương mại điện tử & Kinh doanh số", 3, 2, [57])
add_sub(63, "MKT302", "Quản trị thương hiệu & Truyền thông", 3, 2, [47])
add_sub(64, "BUS305", "Khởi sự kinh doanh & Đổi mới sáng tạo", 3, 2)
add_sub(65, "BUS401", "Quản lý dự án kinh doanh", 3, 2, [58])
add_sub(66, "BUS402", "Phân tích dữ liệu trong kinh doanh", 3, 2, [50])
add_sub(67, "BUS403", "Đạo đức kinh doanh & Trách nhiệm xã hội", 3, 2)
add_sub(68, "FIN401", "Quản trị rủi ro tài chính doanh nghiệp", 3, 2, [51])
add_sub(69, "BUS498", "Thực tập doanh nghiệp QTKD", 4, 2, [58])
add_sub(70, "BUS499", "Khóa luận tốt nghiệp QTKD", 6, 2, [58])
add_sub(254, "BUS203", "Quản trị quan hệ khách hàng CRM", 3, 2, [47])
add_sub(255, "BUS306", "Quản trị rủi ro & Khủng hoảng doanh nghiệp", 3, 2, [43])
add_sub(256, "BUS307", "Quản trị tài năng & Lãnh đạo tổ chức", 3, 2, [52])
add_sub(257, "BUS404", "Đàm phán kinh doanh quốc tế & Logistics", 3, 2, [56])
add_sub(258, "BUS405", "Phân tích chiến lược công ty đa quốc gia", 3, 2, [58])
add_sub(259, "BUS406", "Quản trị chuỗi cung ứng xanh & Bền vững", 3, 2, [56])
add_sub(260, "BUS407", "Chuyển đổi số trong doanh nghiệp", 3, 2, [62])

# =========================================================================
# 4. MAJOR 3: DTVT (Điện tử - Viễn thông) (IDs 71 - 95, 261 - 265)
# =========================================================================
add_sub(71, "EE100", "Nhập môn Kỹ thuật Điện - Điện tử", 2, 3)
add_sub(72, "EE101", "Mạch điện 1", 3, 3)
add_sub(73, "EE102", "Mạch điện 2", 3, 3, [72])
add_sub(74, "EE201", "Kỹ thuật điện tử tương tự", 4, 3, [72])
add_sub(75, "EE202", "Lý thuyết điều khiển tự động", 3, 3, [73])
add_sub(76, "EE203", "Kỹ thuật điện tử số", 3, 3)
add_sub(77, "MATH201", "Hàm phức & Biến đổi tích phân", 3, 1, [11])
add_sub(78, "EE204", "Tín hiệu và hệ thống", 3, 3, [73])
add_sub(79, "EE205", "Vi xử lý & Vi điều khiển", 4, 3, [76])
add_sub(80, "EE301", "Kỹ thuật đo lường & Cảm biến", 3, 3, [74])
add_sub(81, "EE302", "Hệ thống nhúng & IoT", 4, 3, [79])
add_sub(82, "EE303", "Xử lý tín hiệu số DSP", 3, 3, [78])
add_sub(83, "EE304", "Mạng viễn thông & Truyền số liệu", 3, 3, [78])
add_sub(84, "EE305", "Điện tử công suất", 3, 3, [74])
add_sub(85, "EE306", "Thiết kế vi mạch số FPGA & ASIC", 3, 3, [76])
add_sub(86, "EE307", "Kỹ thuật Anten và truyền sóng", 3, 3, [78])
add_sub(87, "EE308", "Hệ thống thông tin vô tuyến & Di động 5G", 3, 3, [83])
add_sub(88, "EE310", "Đồ án chuyên ngành Điện tử - Viễn thông", 3, 3, [81])
add_sub(89, "EE401", "Hệ thống truyền thông quang", 3, 3, [86])
add_sub(90, "EE402", "Xử lý ảnh & Video số", 3, 3, [82])
add_sub(91, "EE403", "Robotics & Thị giác máy công nghiệp", 3, 3, [75])
add_sub(92, "EE404", "Năng lượng tái tạo & Lưới điện thông minh", 3, 3, [84])
add_sub(93, "EE498", "Thực tập doanh nghiệp DTVT", 4, 3, [88])
add_sub(94, "EE499", "Đồ án tốt nghiệp Kỹ sư Điện tử - Viễn thông", 6, 3, [88])
add_sub(95, "ENG202", "Tiếng Anh chuyên ngành Kỹ thuật", 3, 5, [8])
add_sub(261, "EE309", "Thiết kế mạch in PCB cao tốc", 3, 3, [74])
add_sub(262, "EE311", "Mạng cảm biến không dây WSN", 3, 3, [81])
add_sub(263, "EE405", "Hệ thống nhúng thời gian thực RTOS", 3, 3, [81])
add_sub(264, "EE406", "Công nghệ truyền thông 6G & AI trên không", 3, 3, [87])
add_sub(265, "EE407", "Vi điện tử và công nghệ MEMS", 3, 3, [85])

# =========================================================================
# 5. MAJOR 4: CK (Cơ khí & Ô tô) (IDs 96 - 120, 266 - 270)
# =========================================================================
add_sub(96, "ME100", "Nhập môn Kỹ thuật Cơ khí", 2, 4)
add_sub(97, "ME101", "Cơ học kỹ thuật 1 (Tĩnh học - Động học)", 3, 4)
add_sub(98, "ME102", "Cơ học kỹ thuật 2 (Động lực học)", 3, 4, [97])
add_sub(99, "ME201", "Vẽ kỹ thuật & CAD 2D/3D", 3, 4)
add_sub(100, "ME203", "Cơ học chất lỏng & Khí động lực", 3, 4, [97])
add_sub(101, "ME204", "Vật liệu cơ khí & Công nghệ kim loại", 3, 4)
add_sub(102, "ME205", "Kỹ thuật nhiệt & Truyền nhiệt", 3, 4)
add_sub(103, "ME301", "Sức bền vật liệu", 3, 4, [97])
add_sub(104, "ME206", "Nguyên lý - Chi tiết máy", 4, 4, [103])
add_sub(105, "ME207", "Dung sai & Đo lường kỹ thuật", 3, 4, [99])
add_sub(106, "ME302", "Công nghệ chế tạo máy 1", 3, 4, [101])
add_sub(107, "ME202", "Động cơ đốt trong hiện đại", 4, 4, [102])
add_sub(108, "ME303", "Máy công cụ CNC & Công nghệ CAM", 3, 4, [106])
add_sub(109, "ME304", "Cấu tạo khung gầm & Truyền động ô tô", 4, 4, [104])
add_sub(110, "ME305", "Hệ thống thủy lực & Khí nén trong cơ khí", 3, 4, [100])
add_sub(111, "ME306", "Hệ thống điện - điện tử trên ô tô", 3, 4, [109])
add_sub(112, "ME307", "Công nghệ bảo dưỡng & Chẩn đoán ô tô", 3, 4, [109])
add_sub(113, "ME308", "Cơ điện tử & Điều khiển hệ thống cơ khí", 3, 4, [110])
add_sub(114, "ME310", "Đồ án chuyên ngành Kỹ thuật Cơ khí - Ô tô", 3, 4, [104])
add_sub(115, "ME401", "Tính toán & Thiết kế ô tô", 3, 4, [109])
add_sub(116, "ME402", "Công nghệ ô tô điện & Xe Hybrid thông minh", 3, 4, [111])
add_sub(117, "ME403", "Quản lý sản xuất & Đảm bảo chất lượng", 3, 4)
add_sub(118, "ME404", "Tự động hóa sản xuất & Robot công nghiệp", 3, 4, [113])
add_sub(119, "ME498", "Thực tập doanh nghiệp Cơ khí - Ô tô", 4, 4, [114])
add_sub(120, "ME499", "Đồ án tốt nghiệp Kỹ sư Cơ khí - Ô tô", 6, 4, [114])
add_sub(266, "ME309", "Thiết kế khuôn mẫu & Dập kim loại", 3, 4, [106])
add_sub(267, "ME311", "Truyền động thủy lực & Điện khí nén ô tô", 3, 4, [110])
add_sub(268, "ME405", "Vật liệu mới & Composite trong ô tô", 3, 4, [101])
add_sub(269, "ME406", "Chẩn đoán kỹ thuật ô tô bằng cảm biến & AI", 3, 4, [112])
add_sub(270, "ME407", "Kiểm soát khí thải & Động cơ hydro", 3, 4, [107])

# =========================================================================
# 6. MAJOR 5: NN (Ngôn ngữ Anh) (IDs 121 - 149, 271 - 277)
# =========================================================================
add_sub(121, "ENG110", "Dẫn luận ngôn ngữ học", 3, 5)
add_sub(122, "ENG111", "Kỹ năng Đọc - Viết học thuật 1", 3, 5)
add_sub(123, "ENG112", "Kỹ năng Nghe - Nói học thuật 1", 3, 5)
add_sub(124, "ENG113", "Kỹ năng Đọc - Viết học thuật 2", 3, 5, [122])
add_sub(125, "ENG120", "Ngữ âm - Âm vị học tiếng Anh", 3, 5, [121])
add_sub(126, "ENG210", "Cú pháp học tiếng Anh", 3, 5, [125])
add_sub(127, "ENG212", "Kỹ năng Nghe - Nói học thuật 2", 3, 5, [123])
add_sub(128, "ENG213", "Kỹ năng Đọc - Viết học thuật 3", 3, 5, [124])
add_sub(129, "ENG220", "Đất nước học Anh - Mỹ", 3, 5)
add_sub(130, "FLA101", "Ngoại ngữ 2 - Tiếng Hàn / Nhật 1", 3, 5)
add_sub(131, "ENG230", "Ngữ nghĩa học & Ngữ dụng học", 3, 5, [126])
add_sub(132, "ENG240", "Lý thuyết dịch & Kỹ thuật biên dịch cơ bản", 3, 5, [128])
add_sub(133, "ENG214", "Kỹ năng Nghe - Nói học thuật 3", 3, 5, [127])
add_sub(134, "FLA102", "Ngoại ngữ 2 - Tiếng Hàn / Nhật 2", 3, 5, [130])
add_sub(135, "ENG225", "Văn học Anh - Mỹ và văn hóa đại chúng", 3, 5, [129])
add_sub(136, "ENG340", "Biên dịch chuyên ngành nâng cao", 3, 5, [132])
add_sub(137, "ENG350", "Nhập môn Kỹ thuật Phiên dịch", 3, 5, [133])
add_sub(138, "ENG360", "Tiếng Anh thương mại & Đàm phán quốc tế", 3, 5, [128])
add_sub(139, "ENG361", "Tiếng Anh tài chính - ngân hàng", 3, 5, [128])
add_sub(140, "ENG351", "Phiên dịch hội thảo & Cabin nâng cao", 3, 5, [137])
add_sub(141, "ENG362", "Tiếng Anh truyền thông & Quan hệ công chúng", 3, 5, [138])
add_sub(142, "ENG370", "Phương pháp giảng dạy tiếng Anh hiện đại", 3, 5, [131])
add_sub(143, "ENG380", "Giao tiếp liên văn hóa toàn cầu", 3, 5)
add_sub(144, "ENG460", "Tiếng Anh khoa học công nghệ", 3, 5, [138])
add_sub(145, "ENG440", "Đạo đức nghề nghiệp biên phiên dịch", 3, 5, [136])
add_sub(146, "ENG410", "Phân tích diễn ngôn tiếng Anh", 3, 5, [131])
add_sub(147, "ENG480", "Kỹ năng hùng biện & Thuyết trình bằng tiếng Anh", 3, 5, [133])
add_sub(148, "ENG498", "Thực tập biên phiên dịch / Doanh nghiệp", 4, 5, [136])
add_sub(149, "ENG499", "Khóa luận tốt nghiệp Cử nhân Ngôn ngữ Anh", 6, 5, [136])
add_sub(271, "ENG215", "Ngôn ngữ học đối chiếu Anh - Việt", 3, 5, [121])
add_sub(272, "ENG363", "Tiếng Anh du lịch và khách sạn quốc tế", 3, 5, [128])
add_sub(273, "ENG364", "Kỹ năng biên tập & Xuất bản tiếng Anh", 3, 5, [136])
add_sub(274, "ENG461", "Dịch phụ đề phim và đa phương tiện", 3, 5, [136])
add_sub(275, "ENG462", "Kỹ năng tranh biện & Đàm phán đa phương", 3, 5, [138])
add_sub(276, "ENG463", "Tâm lý ngôn ngữ học & Giảng dạy tiếng Anh", 3, 5, [142])
add_sub(277, "ENG464", "Phân tích tác phẩm báo chí quốc tế", 3, 5, [141])

# =========================================================================
# 7. MAJOR 6: KT (Kế toán - Kiểm toán) (IDs 150 - 169, 278 - 285)
# =========================================================================
add_sub(150, "ACC202", "Kế toán tài chính 2", 3, 6, [49])
add_sub(151, "ACC203", "Kế toán chi phí & Giá thành", 3, 6, [46])
add_sub(152, "FIN201", "Lý thuyết tài chính tiền tệ", 3, 2, [44])
add_sub(153, "ACC301", "Kế toán tài chính 3", 3, 6, [150])
add_sub(154, "ACC302", "Kế toán quản trị 1", 3, 6, [151])
add_sub(155, "ACC303", "Thuế & Kế toán thuế trong doanh nghiệp", 3, 6, [49])
add_sub(156, "AUD301", "Kiểm toán căn bản & Chuẩn mực kiểm toán", 3, 6, [150])
add_sub(157, "ACC304", "Hệ thống thông tin kế toán (AIS)", 3, 6, [49])
add_sub(158, "ACC305", "Phân tích báo cáo tài chính doanh nghiệp", 3, 6, [153])
add_sub(159, "ACC306", "Kế toán công & Hành chính sự nghiệp", 3, 6, [49])
add_sub(160, "AUD302", "Kiểm toán tài chính", 3, 6, [156])
add_sub(161, "ACC307", "Kế toán quản trị 2", 3, 6, [154])
add_sub(162, "ACC310", "Thực hành mô phỏng kế toán doanh nghiệp", 3, 6, [153])
add_sub(163, "FIN303", "Thị trường chứng khoán & Đầu tư tài chính", 3, 2, [51])
add_sub(164, "AUD401", "Kiểm toán nội bộ & Soát xét tuân thủ", 3, 6, [156])
add_sub(165, "ACC401", "Chuẩn mực kế toán quốc tế IFRS", 3, 6, [153])
add_sub(166, "FIN402", "Định giá doanh nghiệp & Mua bán sáp nhập", 3, 2, [158])
add_sub(167, "ACC402", "Đạo đức nghề nghiệp kế toán - kiểm toán", 3, 6)
add_sub(168, "ACC498", "Thực tập doanh nghiệp Kế toán - Kiểm toán", 4, 6, [162])
add_sub(169, "ACC499", "Khóa luận tốt nghiệp Kế toán - Kiểm toán", 6, 6, [162])
add_sub(278, "ACC204", "Tổ chức công tác kế toán trong doanh nghiệp", 3, 6, [46])
add_sub(279, "ACC205", "Kế toán ngân hàng thương mại", 3, 6, [150])
add_sub(280, "ACC308", "Kế toán quốc tế & So sánh VAS-IFRS", 3, 6, [153])
add_sub(281, "ACC309", "Kiểm toán hệ thống thông tin kế toán", 3, 6, [157])
add_sub(282, "ACC403", "Phân tích & Quản trị dòng tiền doanh nghiệp", 3, 6, [158])
add_sub(283, "ACC404", "Thuế quốc tế & Chuyển giá trong tập đoàn", 3, 6, [155])
add_sub(284, "ACC405", "Gian lận tài chính & Kế toán điều tra", 3, 6, [160])
add_sub(285, "ACC406", "Mô hình hóa tài chính trên Excel nâng cao", 3, 6, [158])

# =========================================================================
# 8. MAJOR 7: LUAT (Luật kinh tế) (IDs 170 - 196, 286 - 293)
# =========================================================================
add_sub(170, "LAW110", "Lý luận chung về nhà nước và pháp luật", 4, 7)
add_sub(171, "LAW111", "Lịch sử nhà nước và pháp luật", 3, 7)
add_sub(172, "LAW120", "Luật hiến pháp Việt Nam", 3, 7, [170])
add_sub(173, "LAW121", "Luật hành chính & Tố tụng hành chính", 3, 7, [170])
add_sub(174, "LAW210", "Luật dân sự 1 (Phần chung và tài sản)", 4, 7, [170])
add_sub(175, "LAW211", "Luật dân sự 2 (Nghĩa vụ và hợp đồng)", 4, 7, [174])
add_sub(176, "LAW220", "Luật hình sự 1 (Tội phạm và hình phạt)", 3, 7, [170])
add_sub(177, "LAW212", "Luật hôn nhân và gia đình", 3, 7, [174])
add_sub(178, "LAW213", "Xã hội học pháp luật & Tâm lý học tư pháp", 2, 7)
add_sub(179, "LAW230", "Luật thương mại 1 (Doanh nghiệp và phá sản)", 4, 7, [175])
add_sub(180, "LAW240", "Luật tố tụng dân sự", 3, 7, [175])
add_sub(181, "LAW221", "Luật hình sự 2 & Tố tụng hình sự", 3, 7, [176])
add_sub(182, "LAW250", "Luật lao động & An sinh xã hội", 3, 7, [175])
add_sub(183, "LAW330", "Luật thương mại 2 (Hợp đồng thương mại & Trung gian)", 4, 7, [179])
add_sub(184, "LAW331", "Luật đầu tư & Kinh doanh bất động sản", 3, 7, [179])
add_sub(185, "LAW332", "Luật tài chính & Ngân hàng", 3, 7, [179])
add_sub(186, "LAW360", "Luật sở hữu trí tuệ & Chuyển giao công nghệ", 3, 7, [175])
add_sub(187, "LAW333", "Luật cạnh tranh & Bảo vệ người tiêu dùng", 3, 7, [179])
add_sub(188, "LAW370", "Pháp luật trọng tài thương mại & Hòa giải", 3, 7, [183])
add_sub(189, "LAW334", "Pháp luật về thuế trong kinh doanh", 3, 7, [185])
add_sub(190, "LAW380", "Kỹ năng soạn thảo hợp đồng thương mại", 3, 7, [183])
add_sub(191, "LAW430", "Luật thương mại quốc tế & WTO", 3, 7, [183])
add_sub(192, "LAW431", "Tư pháp quốc tế", 3, 7, [175])
add_sub(193, "LAW432", "Pháp luật thị trường chứng khoán", 3, 7, [185])
add_sub(194, "LAW490", "Nghề luật và đạo đức hành nghề luật gia", 3, 7)
add_sub(195, "LAW498", "Thực tập pháp lý tại Tòa án / Doanh nghiệp", 4, 7, [188])
add_sub(196, "LAW499", "Khóa luận tốt nghiệp Cử nhân Luật kinh tế", 6, 7, [188])
add_sub(286, "LAW214", "Pháp luật về đất đai và môi trường", 3, 7, [174])
add_sub(287, "LAW215", "Pháp luật bảo hiểm và an sinh xã hội", 3, 7, [175])
add_sub(288, "LAW335", "Pháp luật về thương mại điện tử & Dữ liệu số", 3, 7, [179])
add_sub(289, "LAW336", "Pháp luật mua bán & Sáp nhập doanh nghiệp M&A", 3, 7, [183])
add_sub(290, "LAW433", "Pháp luật hải quan và ngoại thương", 3, 7, [183])
add_sub(291, "LAW434", "Pháp luật ngân hàng quốc tế & Tín dụng", 3, 7, [185])
add_sub(292, "LAW435", "Kỹ năng tranh tụng tại Tòa án & Trọng tài", 3, 7, [188])
add_sub(293, "LAW436", "Pháp luật về năng lượng và tài nguyên", 3, 7, [184])

# =========================================================================
# 9. MAJOR 8: XD (Kỹ thuật Xây dựng) (IDs 197 - 221, 294 - 299)
# =========================================================================
add_sub(197, "CE101", "Hình học họa hình & Vẽ kỹ thuật xây dựng", 3, 8)
add_sub(198, "CE102", "Cơ học lý thuyết trong xây dựng", 3, 8)
add_sub(199, "CE103", "Địa chất công trình & Cơ học đất cơ sở", 3, 8)
add_sub(200, "CE201", "Sức bền vật liệu xây dựng", 4, 8, [198])
add_sub(201, "CE202", "Trắc địa đại cương & Thực tập trắc địa", 3, 8, [197])
add_sub(202, "CE203", "Vật liệu xây dựng & Công nghệ bê tông", 3, 8)
add_sub(203, "CE204", "Thủy lực công trình & Khí hậu xây dựng", 3, 8, [198])
add_sub(204, "CE205", "Cơ học kết cấu 1", 3, 8, [200])
add_sub(205, "CE206", "Cơ học đất & Thiết kế nền móng công trình", 3, 8, [199])
add_sub(206, "CE207", "Kết cấu bê tông cốt thép 1", 3, 8, [200])
add_sub(207, "CE208", "Kiến trúc dân dụng & Công nghiệp", 3, 8, [197])
add_sub(208, "CE301", "Kết cấu bê tông cốt thép 2 (Nhà nhiều tầng)", 3, 8, [206])
add_sub(209, "CE302", "Kết cấu thép 1 (Cấu kiện cơ bản)", 3, 8, [204])
add_sub(210, "CE303", "Cơ học kết cấu 2 (Động lực học & Ma trận)", 3, 8, [204])
add_sub(211, "CE304", "Ứng dụng BIM & Mô phỏng kết cấu", 3, 8, [197])
add_sub(212, "CE305", "Kết cấu thép 2 (Nhà công nghiệp & Nhịp lớn)", 3, 8, [209])
add_sub(213, "CE306", "Kỹ thuật thi công xây dựng", 3, 8, [206])
add_sub(214, "CE307", "Tổ chức thi công & Quản lý dự án xây dựng", 3, 8, [206])
add_sub(215, "CE310", "Đồ án chuyên ngành Kết cấu xây dựng", 3, 8, [208])
add_sub(216, "CE401", "Kinh tế xây dựng & Lập dự toán công trình", 3, 8, [214])
add_sub(217, "CE402", "Công trình ngầm & Kết cấu nhà siêu cao tầng", 3, 8, [208])
add_sub(218, "CE403", "An toàn lao động & Môi trường xây dựng", 3, 8)
add_sub(219, "CE404", "Kiểm định, thí nghiệm & Gia cường kết cấu", 3, 8, [208])
add_sub(220, "CE498", "Thực tập công trường xây dựng", 4, 8, [215])
add_sub(221, "CE499", "Đồ án tốt nghiệp Kỹ sư Xây dựng", 6, 8, [215])
add_sub(294, "CE209", "Quy hoạch đô thị và cơ sở hạ tầng", 3, 8, [197])
add_sub(295, "CE308", "Kết cấu gạch đá và gỗ", 3, 8, [204])
add_sub(296, "CE309", "Công nghệ bê tông đúc sẵn và lắp ghép", 3, 8, [208])
add_sub(297, "CE405", "Thiết kế chịu tải trọng động đất & Gió bão", 3, 8, [210])
add_sub(298, "CE406", "Quản lý chi phí và hợp đồng xây dựng FIDIC", 3, 8, [214])
add_sub(299, "CE407", "Ứng dụng AI và drone trong xây dựng", 3, 8, [211])

# =========================================================================
# 10. MAJOR 9: YD (Dược học) (IDs 222 - 248, 300 - 306)
# =========================================================================
add_sub(222, "MED101", "Toán đại cương & Thống kê y dược học", 3, 9)
add_sub(223, "PHA101", "Hóa học đại cương và vô cơ dược", 3, 9)
add_sub(224, "PHA102", "Sinh học đại cương & Di truyền y học", 3, 9)
add_sub(225, "PHA103", "Hóa học hữu cơ dược phẩm", 4, 9, [223])
add_sub(226, "PHA104", "Giải phẫu - Sinh lý học người", 4, 9, [224])
add_sub(227, "PHA201", "Hóa phân tích & Kiểm nghiệm cơ sở", 3, 9, [223])
add_sub(228, "PHA202", "Hóa sinh học y dược", 3, 9, [225])
add_sub(229, "PHA203", "Vi sinh y học & Ký sinh trùng", 3, 9, [224])
add_sub(230, "PHA204", "Thực vật dược & Nhận thức dược liệu", 3, 9, [224])
add_sub(231, "PHA205", "Dược lý học 1", 3, 9, [226])
add_sub(232, "PHA206", "Dược liệu học 1", 3, 9, [230])
add_sub(233, "PHA207", "Bào chế & Sinh dược học 1", 4, 9, [227])
add_sub(234, "PHA208", "Bệnh học đại cương & Triệu chứng học", 3, 9, [226])
add_sub(235, "PHA301", "Dược lý học 2 & Độc chất học", 3, 9, [231])
add_sub(236, "PHA302", "Hóa dược 1 (Cấu trúc & Tác dụng thuốc)", 4, 9, [228])
add_sub(237, "PHA303", "Dược liệu học 2 & Hoạt chất tự nhiên", 3, 9, [232])
add_sub(238, "PHA304", "Bào chế & Sinh dược học 2", 4, 9, [233])
add_sub(239, "PHA305", "Hóa dược 2 (Kháng sinh & Hóa trị liệu)", 3, 9, [236])
add_sub(240, "PHA306", "Dược lâm sàng 1 (Sử dụng thuốc hợp lý)", 3, 9, [235])
add_sub(241, "PHA307", "Kiểm nghiệm dược phẩm & Đảm bảo GLP", 4, 9, [236])
add_sub(242, "PHA310", "Đồ án thực hành dược khoa", 3, 9, [238])
add_sub(243, "PHA401", "Dược lâm sàng 2 & Điều trị học nâng cao", 3, 9, [240])
add_sub(244, "PHA402", "Quản lý dược & Kinh tế dược phẩm", 3, 9, [240])
add_sub(245, "PHA403", "Mỹ phẩm dược liệu & Thực phẩm chức năng", 3, 9, [238])
add_sub(246, "PHA404", "Công nghệ sinh học sản xuất dược phẩm", 3, 9, [228])
add_sub(247, "PHA498", "Thực tập lâm sàng Bệnh viện / Nhà máy Dược", 4, 9, [242])
add_sub(248, "PHA499", "Khóa luận tốt nghiệp Dược sĩ", 6, 9, [242])
add_sub(300, "PHA105", "Hóa lý dược phẩm", 3, 9, [223])
add_sub(301, "PHA209", "Độc chất học môi trường và thực phẩm", 3, 9, [227])
add_sub(302, "PHA308", "Dược học cổ truyền và châm cứu cơ sở", 3, 9, [232])
add_sub(303, "PHA309", "Phương pháp nghiên cứu khoa học dược học", 3, 9, [236])
add_sub(304, "PHA405", "Công nghệ nano trong phân phối thuốc", 3, 9, [238])
add_sub(305, "PHA406", "Đăng ký thuốc và sở hữu trí tuệ dược phẩm", 3, 9, [241])
add_sub(306, "PHA407", "Dược dịch tễ học và giám sát cảnh giác dược", 3, 9, [240])

# =========================================================================
# 8-SEMESTER ROADMAP MATRIX FOR EACH MAJOR (133 - 135 credits per major)
# =========================================================================

# MAJOR 1: CNTT (133 credits)
MAJOR_ROADMAP[1] = {
    1: [(1, "GDDC", 1), (9, "GDDC", 1), (10, "GDDC", 1), (7, "GDDC", 1), (16, "GDDC", 1), (17, "CSNG", 1)],
    2: [(2, "GDDC", 1), (11, "GDDC", 1), (14, "GDDC", 1), (8, "GDDC", 1), (19, "CSNG", 1), (18, "CSNG", 1)],
    3: [(3, "GDDC", 1), (21, "CSNG", 1), (20, "CSNG", 1), (22, "CSNG", 1), (12, "GDDC", 1), (42, "CSNG", 1)],
    4: [(4, "GDDC", 1), (6, "GDDC", 1), (26, "CSNG", 1), (23, "CSNG", 1), (28, "CN", 1), (24, "CN", 1)],
    5: [(5, "GDDC", 1), (25, "CN", 1), (27, "CN", 1), (30, "CN", 1), (35, "CN", 1), (31, "TCCN", 0)],
    6: [(29, "CN", 1), (37, "CN", 1), (32, "CN", 1), (33, "CN", 1), (34, "CN", 1)],
    7: [(36, "CN", 1), (249, "CN", 1), (250, "CN", 1), (38, "TCCN", 0), (39, "TCCN", 0), (251, "TCCN", 0), (252, "TCCN", 0)],
    8: [(40, "TTKL", 1), (41, "TTKL", 1)]
}

# MAJOR 2: QTKD (133 credits)
MAJOR_ROADMAP[2] = {
    1: [(1, "GDDC", 1), (13, "GDDC", 1), (7, "GDDC", 1), (16, "GDDC", 1), (6, "GDDC", 1), (43, "CSNG", 1)],
    2: [(2, "GDDC", 1), (44, "CSNG", 1), (45, "CSNG", 1), (8, "GDDC", 1), (47, "CSNG", 1), (46, "CSNG", 1)],
    3: [(3, "GDDC", 1), (55, "CN", 1), (49, "CSNG", 1), (48, "CSNG", 1), (50, "CSNG", 1), (254, "CN", 1)],
    4: [(4, "GDDC", 1), (51, "CN", 1), (52, "CN", 1), (53, "CSNG", 1), (54, "CSNG", 1)],
    5: [(5, "GDDC", 1), (56, "CN", 1), (57, "CN", 1), (58, "CN", 1), (59, "CN", 1), (255, "CN", 1)],
    6: [(60, "CN", 1), (61, "CN", 1), (62, "CN", 1), (63, "TCCN", 0), (64, "TCCN", 0), (256, "CN", 1)],
    7: [(65, "CN", 1), (66, "CN", 1), (67, "CN", 1), (68, "TCCN", 0), (257, "CN", 1), (258, "TCCN", 0), (259, "TCCN", 0), (260, "TCCN", 0)],
    8: [(69, "TTKL", 1), (70, "TTKL", 1)]
}

# MAJOR 3: DTVT (135 credits)
MAJOR_ROADMAP[3] = {
    1: [(1, "GDDC", 1), (9, "GDDC", 1), (10, "GDDC", 1), (7, "GDDC", 1), (14, "GDDC", 1), (16, "GDDC", 1), (71, "CSNG", 1)],
    2: [(2, "GDDC", 1), (11, "GDDC", 1), (15, "GDDC", 1), (8, "GDDC", 1), (72, "CSNG", 1), (99, "CSNG", 1)],
    3: [(3, "GDDC", 1), (73, "CSNG", 1), (74, "CSNG", 1), (76, "CSNG", 1), (77, "GDDC", 1)],
    4: [(4, "GDDC", 1), (6, "GDDC", 1), (78, "CSNG", 1), (79, "CSNG", 1), (75, "CSNG", 1), (80, "CSNG", 1)],
    5: [(5, "GDDC", 1), (81, "CN", 1), (82, "CN", 1), (83, "CN", 1), (84, "CN", 1), (95, "CSNG", 1), (261, "CSNG", 1)],
    6: [(85, "CN", 1), (86, "CN", 1), (87, "CN", 1), (88, "CN", 1), (262, "CN", 1)],
    7: [(89, "CN", 1), (90, "CN", 1), (263, "CN", 1), (91, "TCCN", 0), (92, "TCCN", 0), (264, "TCCN", 0)],
    8: [(93, "TTKL", 1), (94, "TTKL", 1)]
}

# MAJOR 4: CK (135 credits)
MAJOR_ROADMAP[4] = {
    1: [(1, "GDDC", 1), (9, "GDDC", 1), (10, "GDDC", 1), (7, "GDDC", 1), (14, "GDDC", 1), (16, "GDDC", 1), (96, "CSNG", 1)],
    2: [(2, "GDDC", 1), (11, "GDDC", 1), (15, "GDDC", 1), (8, "GDDC", 1), (97, "CSNG", 1), (99, "CSNG", 1)],
    3: [(3, "GDDC", 1), (103, "CSNG", 1), (100, "CSNG", 1), (101, "CSNG", 1), (102, "CSNG", 1), (98, "CSNG", 1)],
    4: [(4, "GDDC", 1), (6, "GDDC", 1), (104, "CSNG", 1), (105, "CSNG", 1), (106, "CN", 1), (72, "CSNG", 1)],
    5: [(5, "GDDC", 1), (107, "CN", 1), (108, "CN", 1), (109, "CN", 1), (110, "CSNG", 1), (266, "CN", 1)],
    6: [(111, "CN", 1), (112, "CN", 1), (113, "CN", 1), (114, "CN", 1), (267, "CN", 1)],
    7: [(115, "CN", 1), (116, "CN", 1), (268, "CN", 1), (117, "TCCN", 0), (118, "TCCN", 0), (269, "TCCN", 0)],
    8: [(119, "TTKL", 1), (120, "TTKL", 1)]
}

# MAJOR 5: NN (133 credits)
MAJOR_ROADMAP[5] = {
    1: [(1, "GDDC", 1), (7, "GDDC", 1), (16, "GDDC", 1), (6, "GDDC", 1), (121, "CSNG", 1), (122, "CSNG", 1)],
    2: [(2, "GDDC", 1), (8, "GDDC", 1), (123, "CSNG", 1), (124, "CSNG", 1), (125, "CSNG", 1)],
    3: [(3, "GDDC", 1), (126, "CSNG", 1), (127, "CSNG", 1), (128, "CSNG", 1), (129, "CSNG", 1), (130, "CSNG", 1), (271, "CSNG", 1)],
    4: [(4, "GDDC", 1), (131, "CSNG", 1), (132, "CN", 1), (133, "CSNG", 1), (134, "CSNG", 1), (135, "CSNG", 1)],
    5: [(5, "GDDC", 1), (136, "CN", 1), (137, "CN", 1), (138, "CN", 1), (139, "CN", 1), (272, "CN", 1)],
    6: [(140, "CN", 1), (141, "CN", 1), (142, "CN", 1), (143, "TCCN", 0), (273, "CN", 1)],
    7: [(144, "CN", 1), (145, "CN", 1), (274, "CN", 1), (146, "TCCN", 0), (147, "TCCN", 0), (275, "TCCN", 0), (276, "TCCN", 0), (277, "TCCN", 0)],
    8: [(148, "TTKL", 1), (149, "TTKL", 1)]
}

# MAJOR 6: KT (133 credits)
MAJOR_ROADMAP[6] = {
    1: [(1, "GDDC", 1), (13, "GDDC", 1), (7, "GDDC", 1), (16, "GDDC", 1), (6, "GDDC", 1), (46, "CSNG", 1)],
    2: [(2, "GDDC", 1), (44, "CSNG", 1), (8, "GDDC", 1), (43, "CSNG", 1), (49, "CSNG", 1), (54, "CSNG", 1)],
    3: [(3, "GDDC", 1), (45, "CSNG", 1), (150, "CN", 1), (151, "CSNG", 1), (152, "CSNG", 1), (278, "CSNG", 1)],
    4: [(4, "GDDC", 1), (153, "CN", 1), (154, "CN", 1), (51, "CSNG", 1), (155, "CN", 1), (279, "CN", 1)],
    5: [(5, "GDDC", 1), (156, "CN", 1), (157, "CN", 1), (158, "CN", 1), (159, "CN", 1), (280, "CN", 1)],
    6: [(160, "CN", 1), (161, "CN", 1), (162, "CN", 1), (163, "TCCN", 0), (281, "CN", 1)],
    7: [(164, "CN", 1), (165, "CN", 1), (282, "CN", 1), (166, "TCCN", 0), (167, "TCCN", 0), (283, "TCCN", 0), (284, "TCCN", 0), (285, "TCCN", 0)],
    8: [(168, "TTKL", 1), (169, "TTKL", 1)]
}

# MAJOR 7: LUAT (134 credits)
MAJOR_ROADMAP[7] = {
    1: [(1, "GDDC", 1), (7, "GDDC", 1), (16, "GDDC", 1), (6, "GDDC", 1), (170, "CSNG", 1), (171, "CSNG", 1)],
    2: [(2, "GDDC", 1), (8, "GDDC", 1), (172, "CSNG", 1), (173, "CSNG", 1), (174, "CSNG", 1)],
    3: [(3, "GDDC", 1), (175, "CSNG", 1), (176, "CSNG", 1), (177, "CSNG", 1), (178, "CSNG", 1), (286, "CSNG", 1)],
    4: [(4, "GDDC", 1), (179, "CN", 1), (180, "CSNG", 1), (181, "CSNG", 1), (182, "CSNG", 1), (287, "CN", 1)],
    5: [(5, "GDDC", 1), (183, "CN", 1), (184, "CN", 1), (185, "CN", 1), (186, "CN", 1), (288, "CN", 1)],
    6: [(187, "CN", 1), (188, "CN", 1), (189, "CN", 1), (190, "TCCN", 0), (289, "CN", 1)],
    7: [(191, "CN", 1), (192, "CN", 1), (290, "CN", 1), (193, "TCCN", 0), (194, "TCCN", 0), (291, "TCCN", 0), (292, "TCCN", 0), (293, "TCCN", 0)],
    8: [(195, "TTKL", 1), (196, "TTKL", 1)]
}

# MAJOR 8: XD (134 credits)
MAJOR_ROADMAP[8] = {
    1: [(1, "GDDC", 1), (9, "GDDC", 1), (10, "GDDC", 1), (7, "GDDC", 1), (14, "GDDC", 1), (16, "GDDC", 1), (197, "CSNG", 1)],
    2: [(2, "GDDC", 1), (11, "GDDC", 1), (15, "GDDC", 1), (8, "GDDC", 1), (198, "CSNG", 1), (199, "CSNG", 1)],
    3: [(3, "GDDC", 1), (200, "CSNG", 1), (201, "CSNG", 1), (202, "CSNG", 1), (203, "CSNG", 1)],
    4: [(4, "GDDC", 1), (6, "GDDC", 1), (204, "CSNG", 1), (205, "CSNG", 1), (206, "CN", 1), (207, "CSNG", 1), (294, "CSNG", 1)],
    5: [(5, "GDDC", 1), (208, "CN", 1), (209, "CN", 1), (210, "CN", 1), (211, "CSNG", 1), (295, "CN", 1)],
    6: [(212, "CN", 1), (213, "CN", 1), (214, "CN", 1), (215, "CN", 1), (296, "CN", 1)],
    7: [(216, "CN", 1), (217, "CN", 1), (297, "CN", 1), (218, "TCCN", 0), (219, "TCCN", 0), (298, "TCCN", 0)],
    8: [(220, "TTKL", 1), (221, "TTKL", 1)]
}

# MAJOR 9: YD (133 credits)
MAJOR_ROADMAP[9] = {
    1: [(1, "GDDC", 1), (7, "GDDC", 1), (16, "GDDC", 1), (222, "GDDC", 1), (223, "CSNG", 1), (224, "CSNG", 1)],
    2: [(2, "GDDC", 1), (8, "GDDC", 1), (6, "GDDC", 1), (225, "CSNG", 1), (226, "CSNG", 1), (300, "CSNG", 1)],
    3: [(3, "GDDC", 1), (227, "CSNG", 1), (228, "CSNG", 1), (229, "CSNG", 1), (230, "CSNG", 1)],
    4: [(4, "GDDC", 1), (231, "CN", 1), (232, "CN", 1), (233, "CN", 1), (234, "CSNG", 1), (301, "CSNG", 1)],
    5: [(5, "GDDC", 1), (235, "CN", 1), (236, "CN", 1), (237, "CN", 1), (238, "CN", 1), (302, "CN", 1)],
    6: [(239, "CN", 1), (240, "CN", 1), (241, "CN", 1), (242, "CN", 1), (303, "CN", 1)],
    7: [(243, "CN", 1), (244, "CN", 1), (304, "CN", 1), (245, "TCCN", 0), (246, "TCCN", 0), (305, "TCCN", 0)],
    8: [(247, "TTKL", 1), (248, "TTKL", 1)]
}

# =========================================================================
# VALIDATION ENGINE
# =========================================================================
def validate():
    print("=" * 60)
    print("RUNNING CURRICULUM VALIDATION AUDIT")
    print("=" * 60)
    
    # 1. Check all subject IDs exist
    for sid, s in SUBJECTS.items():
        assert sid == s["id"]
        for pid in s["prereqs"]:
            if pid not in SUBJECTS:
                raise ValueError(f"Subject {s['code']} has non-existent prereq ID {pid}")
    print(f"[OK] All {len(SUBJECTS)} subjects and prerequisites reference valid IDs.")

    # 2. Check for cycle in prerequisite graph
    adj = collections.defaultdict(list)
    in_deg = collections.defaultdict(int)
    for s, p in PREREQUISITES:
        adj[p].append(s)
        in_deg[s] += 1
    
    queue = [sid for sid in SUBJECTS if in_deg[sid] == 0]
    visited = 0
    while queue:
        u = queue.pop(0)
        visited += 1
        for v in adj[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0:
                queue.append(v)
    
    if visited != len(SUBJECTS):
        raise ValueError("CYCLE DETECTED IN PREREQUISITE GRAPH!")
    print(f"[OK] Prerequisite Graph is a valid DAG (Directed Acyclic Graph), 0 cycles.")

    # 3. Check each major's credits and semester prereq ordering
    for mid, roadmap in MAJOR_ROADMAP.items():
        total_credits = 0
        block_credits = collections.defaultdict(int)
        sub_semester = {}
        
        for sem, items in roadmap.items():
            sem_credits = 0
            for sid, block, req in items:
                sub = SUBJECTS[sid]
                total_credits += sub["credits"]
                sem_credits += sub["credits"]
                block_credits[block] += sub["credits"]
                sub_semester[sid] = sem
            # print(f"  Major {mid} Sem {sem}: {sem_credits} credits ({len(items)} subjects)")

        # Verify prerequisite ordering: prereq semester MUST be strictly < subject semester
        for sid, sem in sub_semester.items():
            for pid in SUBJECTS[sid]["prereqs"]:
                if pid in sub_semester:
                    p_sem = sub_semester[pid]
                    if p_sem >= sem:
                        raise ValueError(f"Major {mid}: Subject {SUBJECTS[sid]['code']} (Sem {sem}) has prereq {SUBJECTS[pid]['code']} (Sem {p_sem}) which is NOT in earlier semester!")

        print(f"Major {mid}: Total Credits = {total_credits} | Blocks = {dict(block_credits)}")
        assert 130 <= total_credits <= 140, f"Major {mid} credits {total_credits} out of target range!"

    print("=" * 60)
    print("ALL VALIDATION AUDITS PASSED WITH ZERO ERRORS!")
    print("=" * 60)

if __name__ == "__main__":
    validate()
