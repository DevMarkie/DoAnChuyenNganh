# -*- coding: utf-8 -*-
"""
Phenikaa SMS - Comprehensive 3000 Students Dataset Generator
"""

import sys
import os
import random
import datetime
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

random.seed(2026)

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return "1" if val else "0"
    val_str = str(val).replace("\\", "\\\\").replace("'", "''")
    return f"'{val_str}'"

def chunk_inserts(table_name, columns, rows, chunk_size=100):
    lines = []
    cols_str = ", ".join(columns)
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        val_lines = []
        for r in chunk:
            vals = [escape_sql(r.get(c)) for c in columns]
            val_lines.append(f"({', '.join(vals)})")
        lines.append(f"INSERT INTO {table_name} ({cols_str}) VALUES\n" + ",\n".join(val_lines) + ";\n")
    return "\n".join(lines)

print("--- STEP 1: REFERENCE METADATA ---")

DEPARTMENTS = [
    {"id": 1, "code": "CNTT_KHMT",  "name": "Khoa Công nghệ Thông tin & Khoa học Máy tính", "description": "Đào tạo CNTT, Kỹ thuật phần mềm, Trí tuệ nhân tạo và Khoa học máy tính"},
    {"id": 2, "code": "KT_OTO",     "name": "Khoa Kỹ thuật & Công nghệ Ô tô",                 "description": "Đào tạo Tự động hóa, Vi mạch bán dẫn, Cơ điện tử, Kỹ thuật ô tô, Kỹ thuật vật liệu và Công nghệ sinh học"},
    {"id": 3, "code": "KT_QTKD",    "name": "Khoa Kinh tế & Quản trị Kinh doanh",            "description": "Đào tạo Quản trị kinh doanh, Marketing số, Logistics & Quản lý chuỗi cung ứng, Thương mại điện tử"},
    {"id": 4, "code": "TCNH_KT",    "name": "Khoa Tài chính - Ngân hàng & Kế toán",          "description": "Đào tạo Tài chính doanh nghiệp, Ngân hàng thương mại, Fintech và Kế toán - Kiểm toán"},
    {"id": 5, "code": "KHSK_YDUOC", "name": "Khoa Khoa học Sức khỏe & Y Dược",              "description": "Đào tạo Bác sĩ Y khoa, Bác sĩ Răng - Hàm - Mặt, Dược học, Điều dưỡng và Xét nghiệm y học"},
    {"id": 6, "code": "NGOAINGU",   "name": "Khoa Ngoại ngữ",                                "description": "Đào tạo Ngôn ngữ Anh, Ngôn ngữ Trung Quốc, Ngôn ngữ Hàn Quốc và Ngôn ngữ Nhật Bản"},
    {"id": 7, "code": "LUAT_XH",    "name": "Khoa Luật & Khoa học Xã hội",                   "description": "Đào tạo Luật kinh tế, Luật thương mại và Pháp lý doanh nghiệp"},
    {"id": 8, "code": "DULICH_KS",  "name": "Khoa Du lịch & Khách sạn",                      "description": "Đào tạo Quản trị khách sạn, Quản trị ẩm thực và Dịch vụ du lịch lữ hành"}
]

MAJORS = [
    {"id": 1,  "dept_id": 1, "code": "CNTT",       "name": "Công nghệ thông tin",              "desc": "Kỹ thuật phần mềm, an toàn thông tin và quản trị mạng"},
    {"id": 2,  "dept_id": 1, "code": "KTPM",       "name": "Kỹ thuật phần mềm",                "desc": "Kiến trúc hệ thống, phát triển ứng dụng di động và web cloud"},
    {"id": 3,  "dept_id": 1, "code": "AI",         "name": "Trí tuệ nhân tạo",                 "desc": "Học máy, học sâu, thị giác máy tính và xử lý ngôn ngữ tự nhiên"},
    {"id": 4,  "dept_id": 1, "code": "KHMT",       "name": "Khoa học máy tính",                "desc": "Giải thuật nâng cao, cấu trúc dữ liệu lớn và mật mã học"},

    {"id": 5,  "dept_id": 2, "code": "TDH",        "name": "Kỹ thuật điều khiển & Tự động hóa", "desc": "Hệ thống điều khiển tự động, PLC, SCADA và robot công nghiệp"},
    {"id": 6,  "dept_id": 2, "code": "BAN_DAN",    "name": "Thiết kế vi mạch bán dẫn",         "desc": "Thiết kế VLSI, vật lý bán dẫn, vi mạch số và kiểm thử chip"},
    {"id": 7,  "dept_id": 2, "code": "CDT",        "name": "Kỹ thuật Cơ điện tử",              "desc": "Cơ cấu chính xác, vi điều khiển và hệ thống cơ điện tử thông minh"},
    {"id": 8,  "dept_id": 2, "code": "OTO",        "name": "Kỹ thuật Ô tô",                   "desc": "Động cơ đốt trong, hệ thống khung gầm và công nghệ xe điện EV"},
    {"id": 9,  "dept_id": 2, "code": "KTVL",       "name": "Kỹ thuật vật liệu",                "desc": "Khoa học vật liệu nano, polymer, hợp kim và màng mỏng"},
    {"id": 10, "dept_id": 2, "code": "CNSH",       "name": "Công nghệ sinh học",               "desc": "Sinh học phân tử, kỹ thuật di truyền và vi sinh ứng dụng"},

    {"id": 11, "dept_id": 3, "code": "QTKD",       "name": "Quản trị kinh doanh",              "desc": "Quản trị chiến lược, quản trị vận hành và nhân sự doanh nghiệp"},
    {"id": 12, "dept_id": 3, "code": "MKT_SO",     "name": "Marketing số",                     "desc": "Digital marketing, SEO/SEM, mạng xã hội và truyền thông số"},
    {"id": 13, "dept_id": 3, "code": "LOGISTICS",  "name": "Logistics & Chuỗi cung ứng",       "desc": "Quản trị kho vận, chuỗi cung ứng toàn cầu và xuất nhập khẩu"},
    {"id": 14, "dept_id": 3, "code": "TMDT",       "name": "Thương mại điện tử",               "desc": "Sàn giao dịch TMĐT, bán lẻ đa kênh và thanh toán điện tử"},

    {"id": 15, "dept_id": 4, "code": "TCNH",       "name": "Tài chính - Ngân hàng",            "desc": "Tài chính doanh nghiệp, ngân hàng số và công nghệ tài chính Fintech"},
    {"id": 16, "dept_id": 4, "code": "KETOAN",     "name": "Kế toán",                          "desc": "Kế toán tài chính, kế toán quản trị và kiểm toán doanh nghiệp"},

    {"id": 17, "dept_id": 5, "code": "YKHOA",      "name": "Y khoa",                           "desc": "Bác sĩ đa khoa, giải phẫu, bệnh học nội - ngoại khoa"},
    {"id": 18, "dept_id": 5, "code": "RHM",        "name": "Răng - Hàm - Mặt",                 "desc": "Bác sĩ Răng Hàm Mặt, giải phẫu răng và điều trị nha khoa"},
    {"id": 19, "dept_id": 5, "code": "DUOC",       "name": "Dược học",                         "desc": "Dược sĩ đại học, hóa dược, bào chế và dược lý lâm sàng"},
    {"id": 20, "dept_id": 5, "code": "DIEU_DUONG", "name": "Điều dưỡng",                       "desc": "Chăm sóc người bệnh, điều dưỡng lâm sàng và cấp cứu"},
    {"id": 21, "dept_id": 5, "code": "XET_NGHIEM", "name": "Kỹ thuật Xét nghiệm y học",        "desc": "Xét nghiệm huyết học, hóa sinh y học và vi sinh lâm sàng"},

    {"id": 22, "dept_id": 6, "code": "NN_ANH",     "name": "Ngôn ngữ Anh",                     "desc": "Tiếng Anh thương mại, biên phiên dịch và sư phạm tiếng Anh"},
    {"id": 23, "dept_id": 6, "code": "NN_TRUNG",   "name": "Ngôn ngữ Trung Quốc",              "desc": "Tiếng Trung thương mại, Hán ngữ ứng dụng và biên phiên dịch"},
    {"id": 24, "dept_id": 6, "code": "NN_HAN",     "name": "Ngôn ngữ Hàn Quốc",                "desc": "Tiếng Hàn thương mại, phiên dịch hội thảo và văn hóa Hàn Quốc"},
    {"id": 25, "dept_id": 6, "code": "NN_NHAT",    "name": "Ngôn ngữ Nhật Bản",                "desc": "Tiếng Nhật thương mại JLPT N1/N2 và biên phiên dịch kỹ thuật"},

    {"id": 26, "dept_id": 7, "code": "LUAT_KT",    "name": "Luật kinh tế",                     "desc": "Pháp luật hợp đồng kinh tế, luật doanh nghiệp và đầu tư quốc tế"},

    {"id": 27, "dept_id": 8, "code": "QT_KS",      "name": "Quản trị khách sạn",               "desc": "Quản trị tiền sảnh lễ tân, buồng phòng và nhà hàng F&B quốc tế"},
    {"id": 28, "dept_id": 8, "code": "DULICH",     "name": "Quản trị dịch vụ du lịch & lữ hành","desc": "Điều hành tour, thiết kế tuyến du lịch và quản trị sự kiện MICE"}
]

COHORTS = [
    {"id": 1, "code": "K16", "name": "Khóa 16", "admission_year": 2023, "graduation_year": 2027},
    {"id": 2, "code": "K17", "name": "Khóa 17", "admission_year": 2024, "graduation_year": 2028},
    {"id": 3, "code": "K18", "name": "Khóa 18", "admission_year": 2025, "graduation_year": 2029},
    {"id": 4, "code": "K19", "name": "Khóa 19", "admission_year": 2026, "graduation_year": 2030}
]

SEMESTERS = [
    {"id": 1, "semester_code": "HK1-2024", "semester_name": "Học kỳ 1 (2024-2025)", "start_date": "2024-09-01", "end_date": "2025-01-15", "academic_year": "2024-2025", "semester_number": 1, "is_current": 0, "status": "COMPLETED"},
    {"id": 2, "semester_code": "HK2-2024", "semester_name": "Học kỳ 2 (2024-2025)", "start_date": "2025-02-01", "end_date": "2025-06-30", "academic_year": "2024-2025", "semester_number": 2, "is_current": 0, "status": "COMPLETED"},
    {"id": 3, "semester_code": "HK1-2025", "semester_name": "Học kỳ 1 (2025-2026)", "start_date": "2025-09-01", "end_date": "2026-01-15", "academic_year": "2025-2026", "semester_number": 1, "is_current": 0, "status": "COMPLETED"},
    {"id": 4, "semester_code": "HK2-2025", "semester_name": "Học kỳ 2 (2025-2026)", "start_date": "2026-02-01", "end_date": "2026-06-30", "academic_year": "2025-2026", "semester_number": 2, "is_current": 0, "status": "COMPLETED"},
    {"id": 5, "semester_code": "HK1-2026", "semester_name": "Học kỳ 1 (2026-2027)", "start_date": "2026-09-01", "end_date": "2027-01-15", "academic_year": "2026-2027", "semester_number": 1, "is_current": 1, "status": "ACTIVE"}
]

print("--- STEP 2: SUBJECTS & LECTURERS ---")

RAW_SUBJECTS = [
    (1, "BS101", "Giải tích 1", 3, 1, "Giới hạn, đạo hàm, vi phân và tích phân hàm một biến", None),
    (2, "BS102", "Đại số tuyến tính", 3, 1, "Ma trận, định thức, không gian vector và phép biến đổi tuyến tính", None),
    (3, "BS103", "Vật lý đại cương 1", 3, 2, "Cơ học cổ điển, nhiệt học và trường điện từ", None),
    (4, "BS104", "Triết học Mác - Lênin", 3, 3, "Thế giới quan và phương pháp luận triết học duy vật biện chứng", None),
    (5, "BS105", "Pháp luật đại cương", 2, 7, "Cơ sở lý luận về nhà nước, pháp luật và hệ thống tư pháp Việt Nam", None),
    (6, "BS106", "Kinh tế chính trị Mác - Lênin", 2, 3, "Học thuyết giá trị thặng dư và quy luật kinh tế thị trường", None),
    (7, "BS107", "Chủ nghĩa xã hội khoa học", 2, 3, "Quy luật chính trị - xã hội trong quá trình xây dựng CNXH", None),
    (8, "BS108", "Lịch sử Đảng Cộng sản Việt Nam", 2, 3, "Sự ra đời, vai trò lãnh đạo và đường lối cách mạng của Đảng", None),
    (9, "BS109", "Tư tưởng Hồ Chí Minh", 2, 3, "Hệ thống quan điểm toàn diện và sâu sắc về cách mạng Việt Nam", None),
    (10, "BS110", "Xác suất thống kê", 3, 1, "Biến ngẫu nhiên, phân phối xác suất và ước lượng thống kê mẫu", None),
    (11, "BS111", "Hóa học đại cương", 3, 2, "Cấu tạo nguyên tử, liên kết hóa học và nhiệt động lực học phản ứng", None),
    (12, "EN101", "Tiếng Anh giao tiếp học thuật 1", 3, 6, "Phát triển 4 kỹ năng nghe, nói, đọc, viết trong môi trường học thuật", None),
    (13, "EN102", "Tiếng Anh giao tiếp học thuật 2", 3, 6, "Thuyết trình, viết luận và tranh biện bằng tiếng Anh học thuật", 12),

    (14, "IT101", "Nhập môn lập trình", 3, 1, "Tư duy thuật toán, cấu trúc điều khiển và giải quyết bài toán bằng C/C++", None),
    (15, "IT102", "Kỹ thuật lập trình nâng cao", 3, 1, "Con trỏ, quản lý bộ nhớ động, đệ quy và cấu trúc dữ liệu cơ sở", 14),
    (16, "IT201", "Lập trình hướng đối tượng Java", 3, 1, "Đóng gói, kế thừa, đa hình, trừu tượng và thiết kế hướng đối tượng OOP", 14),
    (17, "IT202", "Cơ sở dữ liệu", 3, 1, "Mô hình quan hệ thực thể ERD, chuẩn hóa 3NF/BCNF và lập trình SQL", 14),
    (18, "IT203", "Cấu trúc dữ liệu và giải thuật", 3, 1, "Danh sách liên kết, cây nhị phân, đồ thị, tìm kiếm và sắp xếp", 14),
    (19, "IT204", "Hệ điều hành", 3, 1, "Tiến trình, luồng, đồng bộ hóa, quản lý bộ nhớ và hệ thống file", None),
    (20, "IT205", "Kiến trúc máy tính & Hợp ngữ", 3, 1, "Cấu trúc CPU, bộ nhớ cache, đường truyền dữ liệu và tập lệnh assembly", None),
    (21, "IT206", "Mạng máy tính", 3, 1, "Mô hình OSI, giao thức TCP/IP, định tuyến IP và an ninh mạng", None),
    (22, "IT301", "Phát triển ứng dụng Web", 3, 1, "Kiến trúc Client-Server, React/Vue frontend và RESTful API backend", 16),
    (23, "IT302", "Phân tích và thiết kế phần mềm", 3, 1, "Biểu đồ UML 2.5, Design Patterns và kiến trúc phần mềm Clean/Hexagonal", 16),
    (24, "IT303", "Kiểm thử phần mềm", 3, 1, "Kiểm thử hộp trắng, hộp đen, tự động hóa kiểm thử JUnit và Selenium", 23),
    (25, "IT304", "Phát triển ứng dụng di động", 3, 1, "Phát triển ứng dụng đa nền tảng Flutter/React Native và Android SDK", 16),
    (26, "IT305", "An toàn thông tin", 3, 1, "Mật mã khóa công khai, an ninh web OWASP Top 10 và bảo mật hệ thống", 21),
    (27, "IT306", "Điện toán đám mây & DevOps", 3, 1, "Container Docker, Kubernetes, CI/CD pipeline và hạ tầng đám mây AWS", 21),
    (28, "IT311", "Nhập môn Trí tuệ nhân tạo", 3, 1, "Thuật toán tìm kiếm không gian trạng thái, heuristic A* và logic mệnh đề", 18),
    (29, "IT312", "Học máy (Machine Learning)", 3, 1, "Hồi quy tuyến tính, Logistic, SVM, Decision Tree, Random Forest và PCA", 28),
    (30, "IT313", "Học sâu (Deep Learning)", 3, 1, "Mạng nơ-ron MLP, CNN cho thị giác, RNN/Transformer cho chuỗi dữ liệu", 29),
    (31, "IT314", "Thị giác máy tính", 3, 1, "Xử lý ảnh kỹ thuật số, phát hiện vật thể YOLO và nhận diện khuôn mặt", 29),
    (32, "IT315", "Xử lý ngôn ngữ tự nhiên", 3, 1, "Tokenization, nhúng từ Word2Vec, BERT, GPT và sinh ngôn ngữ tự nhiên", 29),
    (33, "IT316", "Khai phá dữ liệu lớn (Big Data)", 3, 1, "Hệ sinh thái Apache Hadoop, Spark, Kafka và xử lý luồng dữ liệu lớn", 17),
    (34, "IT490", "Khóa luận tốt nghiệp CNTT", 6, 1, "Nghiên cứu hoặc xây dựng sản phẩm phần mềm công nghệ thông tin thực tế", None),

    (35, "EE101", "Kỹ thuật điện đại cương", 3, 2, "Định luật Ohm, Kirchhoff, công suất mạch AC và máy điện tĩnh", None),
    (36, "EE102", "Lý thuyết mạch điện", 3, 2, "Mạch điện ba pha, biến đổi Laplace trong phân tích quá trình quá độ", 35),
    (37, "EE201", "Kỹ thuật điện tử tương tự & số", 4, 2, "Transistor BJT/MOSFET, khuếch đại thuật toán Op-Amp, cổng logic và flip-flop", 35),
    (38, "EE202", "Lý thuyết điều khiển tự động", 3, 2, "Hàm truyền đạt, biểu đồ Bode, Nyquist, quỹ đạo nghiệm số và bộ điều khiển PID", 36),
    (39, "EE203", "Cảm biến & Kỹ thuật đo lường", 3, 2, "Nguyên lý cảm biến công nghiệp, mạch chuẩn hóa tín hiệu và chuẩn truyền thông 4-20mA", 37),
    (40, "EE301", "Vi điều khiển & Hệ thống nhúng", 3, 2, "Kiến trúc ARM Cortex, lập trình ngoại vi GPIO/UART/SPI/I2C trên vi điều khiển", 37),
    (41, "EE302", "Hệ thống điều khiển PLC & SCADA", 3, 2, "Lập trình Ladder PLC Siemens S7-1200, thiết kế giao diện HMI và SCADA WinCC", 38),
    (42, "EE303", "Robot công nghiệp & Cơ điện tử", 3, 2, "Động học thuận/nghịch cánh tay robot Denavit-Hartenberg, quỹ đạo và bộ điều khiển", 38),
    (43, "SC201", "Vật lý bán dẫn & Linh kiện điện tử", 3, 2, "Cấu trúc dải năng lượng, tiếp giáp P-N, linh kiện MOSFET và hiệu ứng trường", 3),
    (44, "SC301", "Thiết kế vi mạch tích hợp VLSI", 3, 2, "Quy trình thiết kế vi mạch CMOS ASIC, layout, DRC/LVS và phân tích định thời STA", 37),
    (45, "SC302", "Ngôn ngữ thiết kế phần cứng Verilog", 3, 2, "Mô tả mạch số tổng hợp được bằng Verilog/VHDL và hiện thực trên chip FPGA", 37),
    (46, "SC303", "Kiểm thử & Đóng gói vi mạch", 3, 2, "Phương pháp Design for Testability (DFT), boundary scan và công nghệ đóng gói chip", 44),
    (47, "ME101", "Cơ học kỹ thuật", 3, 2, "Tĩnh học vật rắn, động học và động lực học hệ chất điểm", 3),
    (48, "ME102", "Vẽ kỹ thuật & CAD 3D", 3, 2, "Quy chuẩn bản vẽ kỹ thuật cơ khí, dựng hình 3D SolidWorks và lập bản vẽ chế tạo", None),
    (49, "ME201", "Nguyên lý - Chi tiết máy", 3, 2, "Tính toán độ bền bộ truyền bánh răng, trục vít, ổ lăn, then và khớp nối", 47),
    (50, "AU201", "Kết cấu động cơ đốt trong", 3, 2, "Cơ cấu trục khuỷu thanh truyền, hệ thống phân phối khí, bôi trơn và làm mát", 49),
    (51, "AU202", "Lý thuyết ô tô & Hệ thống khung gầm", 3, 2, "Động lực học chuyển động ô tô, hệ thống phanh ABS, lái ESP và hệ thống treo", 49),
    (52, "AU301", "Điện - Điện tử trên ô tô", 3, 2, "Mạng truyền thông CAN Bus ô tô, hệ thống đánh lửa, phun xăng điện tử EFI", 35),
    (53, "AU302", "Công nghệ xe điện EV & Hybrid", 3, 2, "Động cơ điện kéo PMSM, pin Lithium-ion, hệ thống BMS và trạm sạc xe điện", 52),
    (54, "MT201", "Khoa học vật liệu đại cương", 3, 2, "Cấu trúc tinh thể, khuyết tật mạng, giản đồ pha Fe-C và công nghệ nhiệt luyện", 11),
    (55, "MT301", "Vật liệu nano & Màng mỏng", 3, 2, "Phương pháp tổng hợp hạt nano, phủ màng mỏng PVD/CVD và phân tích XRD/SEM", 54),
    (56, "BT101", "Sinh học đại cương & Tế bào", 3, 2, "Cấu trúc tế bào nhân sơ/nhân thực, chuyển hóa năng lượng và chu kỳ phân bào", None),
    (57, "BT201", "Hóa sinh & Sinh học phân tử", 3, 2, "Cấu trúc protein, enzyme, phiên mã, dịch mã và điều hòa biểu hiện gen", 56),
    (58, "BT301", "Công nghệ gen & Protein tái tổ hợp", 3, 2, "Kỹ thuật PCR, tạo dòng vector plasmid, biến nạp và tinh chế protein", 57),
    (59, "ENG490", "Đồ án tốt nghiệp Kỹ thuật", 6, 2, "Thiết kế, chế tạo hoặc mô phỏng hệ thống kỹ thuật công nghiệp hoàn chỉnh", None),

    (60, "BA101", "Kinh tế vi mô", 3, 3, "Lý thuyết cung cầu, độ co giãn, hành vi người tiêu dùng và cấu trúc thị trường", None),
    (61, "BA102", "Kinh tế vĩ mô", 3, 3, "Tổng sản phẩm quốc nội GDP, lạm phát, thất nghiệp và chính sách tài khóa/tiền tệ", None),
    (62, "BA103", "Nguyên lý quản trị", 3, 3, "Chức năng hoạch định, tổ chức, lãnh đạo và kiểm soát trong doanh nghiệp hiện đại", None),
    (63, "BA201", "Marketing căn bản", 3, 3, "Phân khúc thị trường STP, Marketing Mix 4P/7P và hành vi người tiêu dùng", None),
    (64, "BA202", "Quản trị chiến lược doanh nghiệp", 3, 3, "Phân tích ma trận SWOT, PESTLE, 5 lực lượng cạnh tranh Porter và chiến lược phát triển", 62),
    (65, "BA203", "Quản trị nhân sự", 3, 3, "Hoạch định nguồn nhân lực, tuyển dụng, đào tạo, đánh giá KPI và đãi ngộ nhân tài", 62),
    (66, "MK201", "Digital Marketing căn bản", 3, 3, "Tổng quan kênh truyền thông số, phễu marketing số và xây dựng chiến lược tiếp thị đa kênh", 63),
    (67, "MK301", "Marketing mạng xã hội & Nội dung", 3, 3, "Sáng tạo nội dung Content marketing, quản lý chiến dịch Facebook, TikTok và viral marketing", 66),
    (68, "MK302", "SEO/SEM & Quảng cáo tìm kiếm Google", 3, 3, "Kỹ thuật tối ưu hóa công cụ tìm kiếm On-page/Off-page, Google Ads và đo lường ROI", 66),
    (69, "LG201", "Quản trị logistics đại cương", 3, 3, "Dòng chảy hàng hóa, logistics đầu vào/ra, dịch vụ khách hàng và chi phí vận hành", 62),
    (70, "LG301", "Quản trị chuỗi cung ứng toàn cầu", 3, 3, "Mô hình SCOR, mua hàng quốc tế, quản lý nhà cung cấp và logistics xuyên biên giới", 69),
    (71, "LG302", "Quản trị kho hàng & Vận tải", 3, 3, "Thiết kế layout kho bãi, quản lý tồn kho EOQ, phương thức vận tải đa phương thức và Incoterms", 69),
    (72, "EC201", "Tổng quan thương mại điện tử", 3, 3, "Mô hình kinh doanh B2B, B2C, C2C, D2C, an toàn giao dịch số và khung pháp lý TMĐT", 63),
    (73, "EC301", "Sàn TMĐT & Bán lẻ đa kênh Omnichannel", 3, 3, "Vận hành gian hàng Shopee, Lazada, TikTok Shop, tích hợp CRM và hoàn tất đơn hàng fulfillment", 72),
    (74, "EC302", "Thanh toán điện tử & An toàn giao dịch", 3, 3, "Cổng thanh toán điện tử, ví điện tử, QR Code, xác thực thanh toán 3D-Secure và bảo mật giao dịch", 72),
    (75, "BA490", "Khóa luận tốt nghiệp Kinh tế", 6, 3, "Nghiên cứu đề tài kinh tế ứng dụng hoặc lập đề án kinh doanh thực tiễn", None),

    (76, "FI101", "Lý thuyết tài chính tiền tệ", 3, 4, "Bản chất của tiền tệ, lãi suất, hệ thống tài chính trung gian và ngân hàng trung ương", 60),
    (77, "AC101", "Nguyên lý kế toán", 3, 4, "Đối tượng kế toán, phương pháp chứng từ, tài khoản kép, định khoản và bảng cân đối thử", None),
    (78, "AC201", "Kế toán tài chính 1", 3, 4, "Kế toán tiền, các khoản phải thu, hàng tồn kho và tài sản cố định trong doanh nghiệp", 77),
    (79, "AC202", "Kế toán tài chính 2", 3, 4, "Kế toán nợ phải trả, vốn chủ sở hữu, doanh thu, chi phí và lập báo cáo tài chính", 78),
    (80, "AC301", "Kế toán quản trị", 3, 4, "Phân loại chi phí CVP, điểm hòa vốn, định giá bán sản phẩm và lập dự toán ngân sách", 77),
    (81, "AC302", "Kiểm toán căn bản", 3, 4, "Bằng chứng kiểm toán, tính trọng yếu, rủi ro kiểm toán và quy trình kiểm toán độc lập", 78),
    (82, "FI201", "Quản trị tài chính doanh nghiệp", 3, 4, "Giá trị thời gian của tiền tệ, thẩm định dự án đầu tư NPV/IRR và quản lý vốn lưu động", 76),
    (83, "FI202", "Thị trường chứng khoán & Đầu tư", 3, 4, "Cổ phiếu, trái phiếu, chứng khoán phái sinh, phân tích cơ bản và phân tích kỹ thuật đồ thị nến", 76),
    (84, "FI301", "Nghiệp vụ ngân hàng thương mại", 3, 4, "Huy động vốn, thẩm định tín dụng cho vay doanh nghiệp, thanh toán quốc tế L/C và quản trị rủi ro", 76),
    (85, "FI302", "Công nghệ tài chính Fintech & Ngân hàng số", 3, 4, "Ứng dụng Blockchain trong tài chính, ngân hàng mở Open Banking và chấm điểm tín dụng AI", 82),
    (86, "FI490", "Khóa luận tốt nghiệp Tài chính - Kế toán", 6, 4, "Nghiên cứu phân tích tài chính doanh nghiệp hoặc kiểm toán thực tiễn", None),

    (87, "MD101", "Giải phẫu học người 1", 4, 5, "Giải phẫu đại thể chi trên, chi dưới, ngực, bụng và cơ quan vận động", None),
    (88, "MD102", "Giải phẫu học người 2", 4, 5, "Giải phẫu đầu - mặt - cổ, hệ thần kinh trung ương và giác quan", 87),
    (89, "MD103", "Sinh lý học", 3, 5, "Chức năng sinh lý các hệ tuần hoàn, hô hấp, tiêu hóa, tiết niệu và nội tiết", 87),
    (90, "MD104", "Hóa sinh y học", 3, 5, "Chuyển hóa glucid, lipid, protid, enzym, hormone và hóa sinh lâm sàng", 11),
    (91, "MD105", "Vi sinh & Ký sinh trùng y học", 3, 5, "Hình thái, sinh lý, miễn dịch kháng khuẩn vi khuẩn, virus và ký sinh trùng gây bệnh", None),
    (92, "MD106", "Giải phẫu bệnh & Sinh lý bệnh", 3, 5, "Cơ chế tổn thương tế bào, viêm, hoại tử, u và rối loạn bệnh lý chức năng cơ quan", 89),
    (93, "MD201", "Triệu chứng học nội khoa", 3, 5, "Kỹ thuật khám hỏi bệnh, khám thực thể tim phổi bụng và nhận định hội chứng lâm sàng", 89),
    (94, "MD202", "Triệu chứng học ngoại khoa", 3, 5, "Khám chấn thương, bụng ngoại khoa, khám gãy xương và cấp cứu ngoại viện", 87),
    (95, "MD301", "Bệnh học nội khoa", 4, 5, "Chẩn đoán, điều trị bệnh tim mạch, hô hấp, tiêu hóa, gan mật và cơ xương khớp", 93),
    (96, "MD302", "Bệnh học ngoại khoa", 4, 5, "Chỉ định phẫu thuật viêm ruột thừa, sỏi mật, gãy xương và chăm sóc hậu phẫu", 94),
    (97, "DT201", "Giải phẫu răng & Mô quanh răng", 3, 5, "Hình thái cung răng, cắn khớp, tủy răng và sinh bệnh học mô nha chu", 87),
    (98, "DT301", "Bệnh học miệng & Răng Hàm Mặt", 4, 5, "Bệnh lý sâu răng, viêm tủy, viêm quanh cuống, chấn thương hàm mặt và phục hình răng", 97),
    (99, "PH201", "Hóa dược 1", 3, 5, "Cấu trúc hóa học, cơ chế tác dụng và mối quan hệ cấu trúc - hoạt tính thuốc điều trị", 90),
    (100, "PH202", "Dược lý học", 4, 5, "Dược động học hấp thu - phân bố - thải trừ và tác dụng dược lực học các nhóm thuốc", 89),
    (101, "PH301", "Bào chế & Sinh dược học", 4, 5, "Công nghệ sản xuất thuốc viên nén, nang mềm, dung dịch tiêm và đánh giá độ hòa tan", 99),
    (102, "PH302", "Dược lâm sàng & Điều trị học", 3, 5, "Tương tác thuốc, phản ứng có hại ADR, giám sát nồng độ thuốc và cá thể hóa liều dùng", 100),
    (103, "NU201", "Điều dưỡng cơ bản 1", 3, 5, "Quy trình điều dưỡng, dấu hiệu sinh tồn, vô khuẩn và tiêm truyền tĩnh mạch an toàn", None),
    (104, "NU202", "Kỹ thuật điều dưỡng chuyên khoa", 4, 5, "Chăm sóc người bệnh nội, ngoại khoa, hồi sức cấp cứu và phục hồi chức năng", 103),
    (105, "LB201", "Kỹ thuật xét nghiệm huyết học", 3, 5, "Kỹ thuật đếm tế bào máu tự động, xét nghiệm đông máu và định nhóm máu ABO/Rh", 90),
    (106, "LB202", "Kỹ thuật xét nghiệm hóa sinh", 3, 5, "Định lượng glucose, ure, creatinin, men gan AST/ALT và phân tích nước tiểu", 90),
    (107, "MD490", "Thực tập lâm sàng & Khóa luận tốt nghiệp Y Dược", 6, 5, "Thực tập lâm sàng toàn diện tại bệnh viện đa khoa và báo cáo đề tài tốt nghiệp", None),

    (108, "FL101", "Nhập môn ngôn ngữ học đối chiếu", 3, 6, "Bản chất của ngôn ngữ, ngữ âm, hình thái học, cú pháp học và ngữ nghĩa học", None),
    (109, "FL102", "Giao tiếp liên văn hóa", 3, 6, "Giá trị văn hóa, phong cách giao tiếp phi ngôn ngữ và ứng xử đàm phán quốc tế", None),
    (110, "EA201", "Ngữ âm - Âm vị học tiếng Anh", 3, 6, "Hệ thống nguyên âm, phụ âm IPA, trọng âm từ, ngữ điệu và hiện tượng nối âm", 13),
    (111, "EA202", "Ngữ pháp nâng cao tiếng Anh", 3, 6, "Cấu trúc mệnh đề phức hợp, giả định cách, đảo ngữ và văn phong học thuật", 13),
    (112, "EA301", "Kỹ năng biên phiên dịch tiếng Anh", 4, 6, "Kỹ thuật dịch xuôi/ngược tài liệu chuyên ngành, dịch đuổi và dịch cabin hội thảo", 111),
    (113, "EA302", "Tiếng Anh thương mại & Đàm phán quốc tế", 3, 6, "Soạn thảo hợp đồng ngoại thương, thư tín thương mại và kỹ năng đàm phán song phương", 111),
    (114, "ZH101", "Tiếng Trung sơ cấp 1 (Hán ngữ 1)", 3, 6, "Phiên âm Pinyin, các nét chữ Hán cơ bản và giao tiếp chào hỏi hằng ngày", None),
    (115, "ZH102", "Tiếng Trung sơ cấp 2 (Hán ngữ 2)", 3, 6, "Mở rộng 500 từ vựng HSK2, cấu trúc câu vị ngữ động từ và thói quen sinh hoạt", 114),
    (116, "ZH201", "Tiếng Trung trung cấp 1", 3, 6, "Giao tiếp thương mại, đọc hiểu văn bản tiếng Trung chuẩn HSK3/4", 115),
    (117, "ZH301", "Tiếng Trung thương mại & Biên dịch", 3, 6, "Biên dịch hợp đồng xuất nhập khẩu, thư tín thương mại Trung - Việt", 116),
    (118, "KR101", "Tiếng Hàn sơ cấp 1", 3, 6, "Bảng chữ cái Hangul, cách ghép âm, chào hỏi cơ bản và số từ tiếng Hàn", None),
    (119, "KR102", "Tiếng Hàn sơ cấp 2", 3, 6, "Cấu trúc kính ngữ, đuôi câu thân mật, từ vựng sinh hoạt chuẩn Topik 1", 118),
    (120, "KR201", "Tiếng Hàn trung cấp", 3, 6, "Ngữ pháp phức, giao tiếp công sở, đàm thoại theo chủ đề chuẩn Topik 3", 119),
    (121, "KR301", "Tiếng Hàn thương mại & Dịch thuật", 3, 6, "Dịch hợp đồng, thư tín thương mại và văn hóa kinh doanh doanh nghiệp Hàn Quốc", 120),
    (122, "JA101", "Tiếng Nhật sơ cấp 1", 3, 6, "Chữ cái Hiragana, Katakana, Kanji cơ bản và chào hỏi chuẩn JLPT N5", None),
    (123, "JA102", "Tiếng Nhật sơ cấp 2", 3, 6, "Mẫu câu thể Te, thể từ điển, trợ từ và đàm thoại đời sống JLPT N4", 122),
    (124, "JA201", "Tiếng Nhật trung cấp", 3, 6, "Kính ngữ Keigo, Khiêm nhường ngữ và kỹ năng đọc hiểu bài xã luận JLPT N3", 123),
    (125, "JA301", "Tiếng Nhật thương mại & Biên dịch", 3, 6, "Tác phong doanh nghiệp Nhật Bản Hourensou, email công sở và dịch tài liệu kỹ thuật", 124),
    (126, "FL490", "Khóa luận tốt nghiệp Ngoại ngữ", 6, 6, "Nghiên cứu ngôn ngữ học ứng dụng hoặc biên dịch tác phẩm chuyên ngành", None),

    (127, "LW101", "Lý luận chung về Nhà nước và Pháp luật", 3, 7, "Nguồn gốc, bản chất chức năng của nhà nước, quy phạm pháp luật và quan hệ pháp luật", 5),
    (128, "LW102", "Luật Hiến pháp & Hành chính", 3, 7, "Tổ chức bộ máy nhà nước, quyền con người và thủ tục xử phạt vi phạm hành chính", 127),
    (129, "LW201", "Luật Dân sự 1", 3, 7, "Chủ thể quan hệ dân sự, tài sản, quyền sở hữu, thừa kế và giao dịch dân sự vô hiệu", 127),
    (130, "LW202", "Luật Thương mại & Hợp đồng kinh tế", 4, 7, "Quy chế pháp lý thương nhân, hợp đồng mua bán hàng hóa, cung ứng dịch vụ và trọng tài", 129),
    (131, "LW203", "Luật Doanh nghiệp & Đầu tư", 3, 7, "Thành lập công ty TNHH, cổ phần, quản trị nội bộ doanh nghiệp và thủ tục cấp phép đầu tư", 129),
    (132, "LW301", "Luật Tài chính - Ngân hàng & Thuế", 3, 7, "Pháp luật ngân sách nhà nước, thuế GTGT, thuế TNDN và quy định an toàn vốn tín dụng", 130),
    (133, "LW302", "Pháp luật Sở hữu trí tuệ", 3, 7, "Bảo hộ quyền tác giả, sáng chế, nhãn hiệu thương mại, bí mật kinh doanh và chống vi phạm", 129),
    (134, "LW303", "Giải quyết tranh chấp thương mại quốc tế", 3, 7, "Tố tụng trọng tài thương mại quốc tế ICC/VIAC, công nhận và thi hành phán quyết", 130),
    (135, "LW490", "Khóa luận tốt nghiệp Luật Kinh tế", 6, 7, "Nghiên cứu chuyên sâu giải quyết tranh chấp pháp lý thực tiễn trong kinh doanh", None),

    (136, "TO101", "Tổng quan ngành du lịch và khách sạn", 3, 8, "Hệ thống du lịch, tâm lý du khách, cơ cấu kinh doanh lưu trú và xu hướng du lịch xanh", None),
    (137, "TO102", "Địa lý & Tài nguyên du lịch Việt Nam", 3, 8, "Tài nguyên du lịch tự nhiên, di sản văn hóa phi vật thể và các vùng du lịch trọng điểm", None),
    (138, "TO201", "Quản trị tiền sảnh lễ tân khách sạn", 3, 8, "Quy trình Check-in/Check-out, phần mềm quản lý Opera PMS và xử lý phàn nàn du khách", 136),
    (139, "TO202", "Quản trị buồng phòng khách sạn", 3, 8, "Tiêu chuẩn vệ sinh buồng phòng 5 sao, quản lý tài sản đồ vải linen và hóa chất chuyên dụng", 136),
    (140, "TO203", "Quản trị ẩm thực & Nhà hàng F&B", 3, 8, "Thiết kế thực đơn Menu engineering, quy trình phục vụ bàn Âu/Á, pha chế Bar và an toàn vệ sinh", 136),
    (141, "TO301", "Quản trị kinh doanh lữ hành & Điều hành tour", 4, 8, "Xây dựng giá thành tour, điều hành hướng dẫn viên, liên kết đối tác vận chuyển lưu trú", 136),
    (142, "TO302", "Marketing du lịch & Khách sạn", 3, 8, "Xúc tiến điểm đến du lịch, quan hệ công chúng PR, bán hàng qua kênh đại lý OTA Booking/Agoda", 63),
    (143, "TO303", "Quản trị sự kiện & Du lịch MICE", 3, 8, "Lập kế hoạch tổ chức hội nghị, hội thảo, triển lãm thương mại MICE và tài trợ sự kiện", 136),
    (144, "TO490", "Khóa luận tốt nghiệp Du lịch - Khách sạn", 6, 8, "Đề án phát triển sản phẩm du lịch mới hoặc nâng cao chất lượng dịch vụ khách sạn", None)
]

SUBJECTS = {}
SUBJECT_PREREQUISITES = []

for item in RAW_SUBJECTS:
    s_id, code, name, credits, dept_id, desc, prereq_id = item
    SUBJECTS[s_id] = {
        "id": s_id,
        "code": code,
        "name": name,
        "credits": credits,
        "dept": dept_id,
        "desc": desc,
        "prereq": prereq_id
    }
    if prereq_id is not None:
        SUBJECT_PREREQUISITES.append({"subject_id": s_id, "prerequisite_id": prereq_id})

# 80 Lecturers
LECTURER_NAMES_BY_DEPT = {
    1: [
        ("TS. Nguyễn Hoàng Long", "TS", "Kỹ thuật phần mềm & Hệ thống phân tán"),
        ("ThS. Trần Thị Mai", "ThS", "Cơ sở dữ liệu & Khoa học dữ liệu"),
        ("PGS.TS. Lê Văn Thắng", "PGS.TS", "Trí tuệ nhân tạo, Deep Learning & Mạng nơ-ron"),
        ("TS. Phạm Minh Tuấn", "TS", "An toàn thông tin & Mật mã học"),
        ("ThS. Đỗ Quang Huy", "ThS", "Phát triển Web Cloud & Microservices"),
        ("TS. Đinh Tiến Dũng", "TS", "Khoa học máy tính & Thuật toán lượng tử"),
        ("ThS. Vũ Thị Ngọc Lan", "ThS", "Thị giác máy tính & Xử lý ảnh"),
        ("TS. Bùi Minh Triết", "TS", "Xử lý ngôn ngữ tự nhiên & Mô hình LLM"),
        ("ThS. Hoàng Quốc Khánh", "ThS", "Phát triển ứng dụng di động Flutter"),
        ("TS. Nguyễn Đức Toàn", "TS", "Kiến trúc máy tính & Điện toán đám mây")
    ],
    2: [
        ("PGS.TS. Phạm Đình Huy", "PGS.TS", "Điện tử công suất & Năng lượng tái tạo"),
        ("ThS. Bùi Thị Thu Hương", "ThS", "Hệ thống nhúng & Thiết kế vi mạch FPGA"),
        ("TS. Nguyễn Tuấn Anh", "TS", "Điều khiển tự động, SCADA & Robot"),
        ("ThS. Lê Hoàng Nam", "ThS", "Cảm biến công nghiệp & IoT"),
        ("TS. Đặng Quốc Thịnh", "TS", "Thiết kế vi mạch tích hợp VLSI CMOS"),
        ("TS. Đặng Việt Hùng", "TS", "Kỹ thuật ô tô & Khung gầm ô tô"),
        ("ThS. Lê Quang Hải", "ThS", "Động cơ đốt trong & Công nghệ xe điện EV"),
        ("ThS. Nguyễn Đức Thành", "ThS", "Cơ điện tử & Mô phỏng CAD/CAM"),
        ("TS. Vũ Đình Trọng", "TS", "Khoa học vật liệu màng mỏng nano"),
        ("PGS.TS. Trịnh Quốc Bảo", "PGS.TS", "Công nghệ sinh học phân tử & Kỹ thuật gen")
    ],
    3: [
        ("TS. Vũ Quốc Cường", "TS", "Quản trị chiến lược & Kinh tế số"),
        ("ThS. Đỗ Thị Thu Trang", "ThS", "Marketing số, SEO & Quảng cáo số"),
        ("TS. Hoàng Minh Tuấn", "TS", "Quản trị vận hành & Logistics quốc tế"),
        ("ThS. Bùi Văn Hải", "ThS", "Quản trị chuỗi cung ứng toàn cầu SCOR"),
        ("TS. Phan Thanh Sơn", "TS", "Thương mại điện tử & Bán lẻ đa kênh"),
        ("ThS. Nguyễn Thị Bích Thảo", "ThS", "Quản trị nhân sự & Văn hóa doanh nghiệp"),
        ("TS. Trần Đại Nghĩa", "TS", "Kinh tế vi mô & Hành vi người tiêu dùng"),
        ("ThS. Vũ Quỳnh Anh", "ThS", "Truyền thông số & Viral Marketing"),
        ("TS. Phạm Hữu Tài", "TS", "Quản trị kho vận & Vận tải đa phương thức"),
        ("ThS. Đào Minh Phúc", "ThS", "Hệ thống thông tin quản lý ERP & CRM")
    ],
    4: [
        ("PGS.TS. Ngô Văn Tuấn", "PGS.TS", "Tài chính doanh nghiệp & Thẩm định đầu tư"),
        ("ThS. Nguyễn Thu Hằng", "ThS", "Kế toán tài chính & Chuẩn mực IFRS"),
        ("TS. Lê Thị Hồng Nhung", "TS", "Kiểm toán độc lập & Kiểm soát nội bộ"),
        ("ThS. Trần Quang Vinh", "ThS", "Thị trường chứng khoán & Phân tích kỹ thuật"),
        ("TS. Đặng Thùy Dương", "TS", "Nghiệp vụ ngân hàng thương mại & Thẩm định tín dụng"),
        ("ThS. Vũ Hoàng Nam", "ThS", "Công nghệ tài chính Fintech & Ngân hàng số"),
        ("TS. Mai Quốc Khánh", "TS", "Kế toán quản trị & Định giá thành"),
        ("ThS. Lương Thị Kim Oanh", "ThS", "Tài chính quốc tế & Quản trị rủi ro tỷ giá"),
        ("TS. Phùng Đức Mạnh", "TS", "Phân tích báo cáo tài chính doanh nghiệp"),
        ("ThS. Đỗ Lan Hương", "ThS", "Thanh toán quốc tế & Nghiệp vụ L/C")
    ],
    5: [
        ("GS.TS. Nguyễn Văn Hùng", "GS.TS", "Nội khoa tiêu hóa - gan mật & Bác sĩ lâm sàng"),
        ("PGS.TS. Bùi Mai Hoa", "PGS.TS", "Ngoại khoa phẫu thuật tổng quát & Cấp cứu"),
        ("TS. Trịnh Thu Hà", "TS", "Giải phẫu học người & Chẩn đoán hình ảnh"),
        ("ThS.BS. Lê Quang Minh", "ThS.BS", "Sinh lý học & Thần kinh học"),
        ("TS.DS. Phạm Thanh Vân", "TS.DS", "Dược lý học lâm sàng & Tương tác thuốc"),
        ("ThS.DS. Trần Hoàng Quân", "ThS.DS", "Bào chế & Công nghệ dược phẩm nano"),
        ("TS. Đỗ Thị Hồng Hạnh", "TS", "Hóa sinh y học & Xét nghiệm huyết học"),
        ("ThS. Vũ Thị Thanh Bình", "ThS", "Điều dưỡng chăm sóc toàn diện & Kiểm soát nhiễm khuẩn"),
        ("TS.BS. Nguyễn Đình Phúc", "TS.BS", "Răng Hàm Mặt & Phục hình cấy ghép Implant"),
        ("ThS.BS. Đặng Mai Linh", "ThS.BS", "Nha chu học & Chỉnh nha chỉnh hình")
    ],
    6: [
        ("TS. Nguyễn Quỳnh Chi", "TS", "Ngôn ngữ học đối chiếu & Phương pháp giảng dạy TESOL"),
        ("ThS. Hoàng Ngọc Ánh", "ThS", "Tiếng Anh thương mại & Biên phiên dịch hợp đồng"),
        ("ThS. Phạm Thùy Linh", "ThS", "Ngữ âm học tiếng Anh & Giao tiếp học thuật"),
        ("TS. Trần Minh Đức", "TS", "Hán ngữ hiện đại & Văn hóa Trung Hoa"),
        ("ThS. Đỗ Kim Oanh", "ThS", "Biên phiên dịch tiếng Trung Quốc thương mại"),
        ("TS. Bùi Thanh Tùng", "TS", "Ngôn ngữ Hàn Quốc & Dịch thuật hội thảo"),
        ("ThS. Vũ Thảo My", "ThS", "Tiếng Hàn thương mại & Văn hóa công sở"),
        ("ThS. Lê Thị Thanh Nga", "ThS", "Tiếng Nhật thương mại JLPT N1 & Biên dịch kỹ thuật"),
        ("TS. Phan Diệu Linh", "TS", "Ngữ pháp tiếng Nhật nâng cao & Giao tiếp Keigo"),
        ("ThS. Nguyễn Thế An", "ThS", "Văn hóa Nhật Bản & Giao tiếp kinh doanh Nhật")
    ],
    7: [
        ("PGS.TS. Vũ Trọng Khải", "PGS.TS", "Luật doanh nghiệp & Pháp chế kinh doanh"),
        ("TS. Nguyễn Minh Hải", "TS", "Luật thương mại quốc tế & Trọng tài thương mại"),
        ("ThS.LS. Đặng Quốc Cường", "ThS.LS", "Luật hợp đồng & Kỹ năng tranh tụng dân sự"),
        ("TS. Phạm Bích Thảo", "TS", "Pháp luật sở hữu trí tuệ & Chuyển giao công nghệ"),
        ("ThS. Hoàng Đình Chiến", "ThS", "Luật ngân hàng & Thuế thu nhập doanh nghiệp"),
        ("TS. Bùi Thu Trang", "TS", "Luật đầu tư & Pháp luật chứng khoán"),
        ("ThS. Đỗ Quang Thịnh", "ThS", "Luật đất đai & Kinh doanh bất động sản"),
        ("TS. Lê Hoàng Mai", "TS", "Lý luận chung về nhà nước và pháp luật"),
        ("ThS. Trịnh Văn Lâm", "ThS", "Luật lao động & Quan hệ việc làm doanh nghiệp"),
        ("TS. Nguyễn Văn Tuân", "TS", "Giải quyết tranh chấp kinh tế tại Tòa án & Trọng tài")
    ],
    8: [
        ("TS. Mai Thu Phương", "TS", "Quản trị khách sạn quốc tế & Tiêu chuẩn chất lượng 5 sao"),
        ("ThS. Nguyễn Hữu Dũng", "ThS", "Quản trị tiền sảnh Front Office & Opera PMS"),
        ("ThS. Trần Thị Kim Cúc", "ThS", "Quản trị buồng phòng Housekeeping & Quản lý đồ vải"),
        ("TS. Đinh Quốc Thái", "TS", "Quản trị dịch vụ F&B & Kỹ thuật pha chế đồ uống"),
        ("ThS. Phạm Mai Lan", "ThS", "Điều hành tour du lịch & Thiết kế sản phẩm du lịch"),
        ("TS. Lê Quang Dũng", "TS", "Marketing du lịch & Xúc tiến điểm đến"),
        ("ThS. Bùi Tuấn Kiệt", "ThS", "Quản trị sự kiện MICE & Lễ hội văn hóa"),
        ("ThS. Vũ Hồng Thắm", "ThS", "Tâm lý du khách & Kỹ năng giao tiếp trong ngành hiếu khách"),
        ("TS. Đỗ Hoàng Yến", "TS", "Kinh tế du lịch & Phát triển du lịch sinh thái bền vững"),
        ("ThS. Ngô Văn Nam", "ThS", "An toàn vệ sinh thực phẩm HACCP trong nhà hàng - khách sạn")
    ]
}

LECTURERS = []
USERS_LECTURERS = []
DEPT_LECTURERS = {d["id"]: [] for d in DEPARTMENTS}

lec_id_counter = 1
for dept_id in range(1, 9):
    dept_lecs = LECTURER_NAMES_BY_DEPT[dept_id]
    for full_name, degree, spec in dept_lecs:
        u_id = lec_id_counter + 1  # 2 to 81
        l_code = f"1000{lec_id_counter:03d}"
        email = f"{l_code}@sms.edu.vn"
        
        USERS_LECTURERS.append({
            "id": u_id,
            "username": l_code,
            "password": "$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm",
            "email": email,
            "role_id": 2,
            "is_active": 1
        })
        
        y_birth = random.randint(1972, 1988)
        dob = f"{y_birth}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        gender = "FEMALE" if any(w in full_name for w in ["Thị", "Thu", "Hoa", "Hằng", "Nhung", "Phương", "Lan", "Thảo", "Hạnh", "Linh", "Chi", "Ánh", "Oanh", "Nga", "Cúc", "Thắm", "Yến", "Bình"]) else "MALE"
        phone = f"091234{lec_id_counter:04d}"
        
        lec_dict = {
            "id": lec_id_counter,
            "user_id": u_id,
            "lecturer_code": l_code,
            "full_name": full_name,
            "date_of_birth": dob,
            "gender": gender,
            "email": email,
            "phone": phone,
            "department_id": dept_id,
            "degree": degree,
            "specialization": spec
        }
        LECTURERS.append(lec_dict)
        DEPT_LECTURERS[dept_id].append(lec_id_counter)
        lec_id_counter += 1

# Curriculum Programs & Blocks
CURRICULUM_PROGRAMS = []
CURRICULUM_BLOCKS = []
CURRICULUM_BLOCK_SUBJECTS = []

prog_id_counter = 1
block_id_counter = 1

BLOCK_TEMPLATES = [
    {"code": "GDDC",       "name": "Khối kiến thức Giáo dục đại cương",     "type": "COMPULSORY", "req_cnt": 8,  "req_cre": 22, "ele_cnt": 0, "ele_cre": 0,  "order": 1},
    {"code": "CSNG",       "name": "Khối kiến thức Cơ sở khối ngành",       "type": "COMPULSORY", "req_cnt": 6,  "req_cre": 18, "ele_cnt": 0, "ele_cre": 0,  "order": 2},
    {"code": "CN",         "name": "Khối kiến thức Chuyên ngành bắt buộc",   "type": "COMPULSORY", "req_cnt": 12, "req_cre": 38, "ele_cnt": 0, "ele_cre": 0,  "order": 3},
    {"code": "TC",         "name": "Khối kiến thức Chuyên ngành tự chọn",   "type": "ELECTIVE",   "req_cnt": 0,  "req_cre": 0,  "ele_cnt": 4, "ele_cre": 12, "order": 4},
    {"code": "TOTNGHIEP",  "name": "Khối kiến thức Tốt nghiệp & Khóa luận", "type": "COMPULSORY", "req_cnt": 2,  "req_cre": 10, "ele_cnt": 0, "ele_cre": 0,  "order": 5}
]

GDDC_SUBJECT_IDS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 12, 13]

MAJOR_CORE_SUBJECTS = {
    1: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 34],
    2: [14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 34],
    3: [14, 15, 16, 17, 18, 19, 28, 29, 30, 31, 32, 33, 34],
    4: [14, 15, 16, 17, 18, 19, 20, 21, 28, 29, 33, 34],
    5: [3, 35, 36, 37, 38, 39, 40, 41, 42, 59],
    6: [3, 35, 36, 37, 40, 43, 44, 45, 46, 59],
    7: [3, 35, 36, 37, 38, 39, 40, 42, 47, 48, 49, 59],
    8: [3, 35, 47, 48, 49, 50, 51, 52, 53, 59],
    9: [3, 11, 47, 48, 49, 54, 55, 59],
    10: [11, 56, 57, 58, 59],
    11: [60, 61, 62, 63, 64, 65, 75],
    12: [60, 61, 62, 63, 66, 67, 68, 75],
    13: [60, 61, 62, 63, 69, 70, 71, 75],
    14: [60, 61, 62, 63, 66, 72, 73, 74, 75],
    15: [60, 61, 76, 77, 78, 82, 83, 84, 85, 86],
    16: [60, 61, 76, 77, 78, 79, 80, 81, 86],
    17: [11, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 107],
    18: [11, 87, 88, 89, 90, 91, 92, 97, 98, 107],
    19: [11, 87, 89, 90, 99, 100, 101, 102, 107],
    20: [87, 89, 90, 91, 103, 104, 107],
    21: [11, 87, 89, 90, 91, 105, 106, 107],
    22: [108, 109, 110, 111, 112, 113, 126],
    23: [108, 109, 114, 115, 116, 117, 126],
    24: [108, 109, 118, 119, 120, 121, 126],
    25: [108, 109, 122, 123, 124, 125, 126],
    26: [5, 127, 128, 129, 130, 131, 132, 133, 134, 135],
    27: [63, 136, 137, 138, 139, 140, 142, 143, 144],
    28: [63, 136, 137, 140, 141, 142, 143, 144]
}

for m in MAJORS:
    m_id = m["id"]
    for c in COHORTS:
        c_id = c["id"]
        p_code = f"{m['code']}-{c['code']}"
        p_name = f"Chương trình đào tạo {m['name']} - {c['name']}"
        curr_p_id = prog_id_counter
        prog_id_counter += 1
        
        CURRICULUM_PROGRAMS.append({
            "id": curr_p_id,
            "major_id": m_id,
            "cohort_id": c_id,
            "code": p_code,
            "name": p_name,
            "total_credits": 140
        })
        
        for b_tpl in BLOCK_TEMPLATES:
            curr_b_id = block_id_counter
            block_id_counter += 1
            CURRICULUM_BLOCKS.append({
                "id": curr_b_id,
                "program_id": curr_p_id,
                "code": b_tpl["code"],
                "name": b_tpl["name"],
                "block_type": b_tpl["type"],
                "required_subject_count": b_tpl["req_cnt"],
                "required_credits": b_tpl["req_cre"],
                "elective_subject_count": b_tpl["ele_cnt"],
                "elective_credits": b_tpl["ele_cre"],
                "display_order": b_tpl["order"]
            })
            
            if b_tpl["code"] == "GDDC":
                for sub_id in GDDC_SUBJECT_IDS:
                    CURRICULUM_BLOCK_SUBJECTS.append({
                        "block_id": curr_b_id,
                        "subject_id": sub_id,
                        "is_required": 1
                    })
            else:
                core_subs = MAJOR_CORE_SUBJECTS.get(m_id, [14, 16, 17, 22])
                for sub_id in core_subs:
                    is_req = 1 if b_tpl["code"] != "TC" else 0
                    CURRICULUM_BLOCK_SUBJECTS.append({
                        "block_id": curr_b_id,
                        "subject_id": sub_id,
                        "is_required": is_req
                    })

print("--- STEP 3: CLASSES & 3,000 STUDENTS ---")

HO_LIST = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đào", "Đoàn", "Vương", "Trịnh", "Đinh", "Lâm", "Phùng", "Mai", "Tô"]
DEM_NAM = ["Văn", "Đình", "Hữu", "Đức", "Minh", "Quang", "Công", "Tuấn", "Thành", "Hoàng", "Bảo", "Xuân", "Thanh", "Duy", "Khắc", "Hồng"]
DEM_NU = ["Thị", "Thu", "Thanh", "Ngọc", "Phương", "Khánh", "Hải", "Thùy", "Mỹ", "Kim", "Quỳnh", "Bích", "Hồng", "Mai", "Ánh", "Lan"]
TEN_NAM = ["An", "Anh", "Bách", "Bảo", "Cường", "Dũng", "Dương", "Đạt", "Đức", "Hải", "Hiếu", "Hoàng", "Hùng", "Huy", "Khang", "Khoa", "Khôi", "Kiên", "Lâm", "Long", "Minh", "Nam", "Nghĩa", "Nhật", "Phong", "Phúc", "Quân", "Quang", "Sơn", "Tài", "Tâm", "Thắng", "Thành", "Thịnh", "Tiến", "Toàn", "Trung", "Tú", "Tuấn", "Tùng", "Việt", "Vinh", "Vũ"]
TEN_NU = ["An", "Anh", "Ánh", "Bích", "Chi", "Diệp", "Dung", "Dương", "Giang", "Hà", "Hân", "Hằng", "Hạnh", "Hiền", "Hoa", "Hoài", "Hương", "Huyền", "Lam", "Lan", "Linh", "Loan", "Ly", "Mai", "Mi", "My", "Nga", "Ngân", "Ngọc", "Nhung", "Oanh", "Phương", "Quỳnh", "Thảo", "Thu", "Thư", "Thương", "Thúy", "Tiên", "Trang", "Trâm", "Trinh", "Trúc", "Tú", "Uyên", "Vân", "Vy", "Yến"]

STREETS = [
    "Số 18 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội",
    "Số 45 Đường Giải Phóng, Hai Bà Trưng, Hà Nội",
    "Số 102 Phố Chùa Láng, Đống Đa, Hà Nội",
    "Số 88 Đường Cầu Giấy, Cầu Giấy, Hà Nội",
    "Số 36 Phố Huế, Hoàn Kiếm, Hà Nội",
    "Số 79 Đường Xuân Thủy, Cầu Giấy, Hà Nội",
    "Số 120 Đường Quang Trung, Hà Đông, Hà Nội",
    "Số 54 Phố Tây Sơn, Đống Đa, Hà Nội",
    "Số 15 Phố Hoàng Diệu, Ba Đình, Hà Nội",
    "Số 63 Đường Lê Văn Lương, Thanh Xuân, Hà Nội",
    "Số 92 Đường Hồ Tùng Mậu, Cầu Giấy, Hà Nội",
    "Số 12 Phố Vạn Phúc, Hà Đông, Hà Nội",
    "Số 203 Đường Nguyễn Lương Bằng, Đống Đa, Hà Nội",
    "Số 110 Đường Trần Phú, Hà Đông, Hà Nội",
    "Số 85 Đường Kim Mã, Ba Đình, Hà Nội",
    "Số 72 Phố Bà Triệu, Hoàn Kiếm, Hà Nội",
    "Số 29 Đường Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
    "Số 168 Đường Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội",
    "Số 40 Đường Tố Hữu, Nam Từ Liêm, Hà Nội",
    "Số 55 Đường Hoàng Quốc Việt, Cầu Giấy, Hà Nội"
]

COHORT_SPECS = [
    {"cohort_id": 1, "cohort_code": "K16", "count": 600, "start_st_id": 1,    "prefix": "2300", "birth_year": 2002},
    {"cohort_id": 2, "cohort_code": "K17", "count": 750, "start_st_id": 601,  "prefix": "2400", "birth_year": 2003},
    {"cohort_id": 3, "cohort_code": "K18", "count": 800, "start_st_id": 1351, "prefix": "2500", "birth_year": 2004},
    {"cohort_id": 4, "cohort_code": "K19", "count": 850, "start_st_id": 2151, "prefix": "2600", "birth_year": 2005}
]

CLASSES = []
STUDENTS = []
USERS_STUDENTS = []
STUDENT_ABILITIES = {}
STUDENT_MAJOR = {}
STUDENT_COHORT = {}
CLASS_STUDENTS = {}

class_id_counter = 1
user_id_counter = 82

for c_spec in COHORT_SPECS:
    c_id = c_spec["cohort_id"]
    c_code = c_spec["cohort_code"]
    total_cohort_students = c_spec["count"]
    start_id = c_spec["start_st_id"]
    prefix = c_spec["prefix"]
    b_year = c_spec["birth_year"]
    
    base_per_major = total_cohort_students // len(MAJORS)
    remainder = total_cohort_students % len(MAJORS)
    current_cohort_st_id = start_id
    
    for m_idx, m in enumerate(MAJORS):
        m_id = m["id"]
        m_count = base_per_major + (1 if m_idx < remainder else 0)
        
        if m_count >= 35:
            classes_to_create = [
                {"code": f"{c_code}-{m['code']}1", "name": f"{m['name']} 1 - {c_code}", "size": m_count // 2},
                {"code": f"{c_code}-{m['code']}2", "name": f"{m['name']} 2 - {c_code}", "size": m_count - (m_count // 2)}
            ]
        else:
            classes_to_create = [
                {"code": f"{c_code}-{m['code']}1", "name": f"{m['name']} 1 - {c_code}", "size": m_count}
            ]
            
        for c_info in classes_to_create:
            curr_class_id = class_id_counter
            class_id_counter += 1
            
            CLASSES.append({
                "id": curr_class_id,
                "code": c_info["code"],
                "name": c_info["name"],
                "department_id": m["dept_id"],
                "academic_year": c_code,
                "major_id": m_id,
                "cohort_id": c_id,
                "is_active": 1
            })
            CLASS_STUDENTS[curr_class_id] = []
            
            for _ in range(c_info["size"]):
                st_id = current_cohort_st_id
                current_cohort_st_id += 1
                
                st_code_num = st_id - start_id + 1
                st_code = f"{prefix}{st_code_num:03d}"
                email = f"{st_code}@sv.sms.edu.vn"
                
                gender = "FEMALE" if random.random() < 0.45 else "MALE"
                ho = random.choice(HO_LIST)
                dem = random.choice(DEM_NAM if gender == "MALE" else DEM_NU)
                ten = random.choice(TEN_NAM if gender == "MALE" else TEN_NU)
                full_name = f"{ho} {dem} {ten}"
                
                dob = f"{b_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
                phone = f"0912{st_id:05d}"
                address = random.choice(STREETS)
                
                # Gaussian ability factor
                ability = round(random.gauss(7.0, 1.25), 2)
                ability = max(2.5, min(9.8, ability))
                
                curr_user_id = user_id_counter
                user_id_counter += 1
                
                USERS_STUDENTS.append({
                    "id": curr_user_id,
                    "username": st_code,
                    "password": "$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm",
                    "email": email,
                    "role_id": 3,
                    "is_active": 1
                })
                
                warn_lvl = 2 if ability < 3.5 else (1 if ability < 4.5 else 0)
                
                STUDENTS.append({
                    "id": st_id,
                    "user_id": curr_user_id,
                    "student_code": st_code,
                    "full_name": full_name,
                    "date_of_birth": dob,
                    "gender": gender,
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "class_id": curr_class_id,
                    "status": "ACTIVE",
                    "balance": 0.00,
                    "financial_hold": 0,
                    "academic_warning_level": warn_lvl
                })
                
                CLASS_STUDENTS[curr_class_id].append(st_id)
                STUDENT_ABILITIES[st_id] = ability
                STUDENT_MAJOR[st_id] = m_id
                STUDENT_COHORT[st_id] = c_id

print("--- STEP 4: ROADMAP & SEMESTER SIMULATION ---")

MAJOR_ROADMAPS = {
    1:  {1: [1, 4, 12, 14], 2: [2, 5, 13, 15, 16], 3: [10, 17, 18, 19], 4: [20, 21, 22, 23], 5: [6, 24, 25, 26], 6: [7, 27, 28, 33], 7: [8, 9, 34]},
    2:  {1: [1, 4, 12, 14], 2: [2, 5, 13, 15, 16], 3: [10, 17, 18, 19], 4: [21, 22, 23, 24], 5: [6, 25, 26, 27], 6: [7, 28, 33, 20], 7: [8, 9, 34]},
    3:  {1: [1, 2, 4, 14], 2: [10, 12, 15, 16], 3: [17, 18, 19, 28], 4: [13, 21, 29, 33], 5: [6, 30, 31, 32], 6: [7, 22, 26, 27], 7: [8, 9, 34]},
    4:  {1: [1, 2, 4, 14], 2: [10, 12, 15, 16], 3: [17, 18, 19, 20], 4: [13, 21, 28, 29], 5: [6, 23, 30, 33], 6: [7, 26, 31, 32], 7: [8, 9, 34]},
    5:  {1: [1, 3, 4, 35], 2: [2, 12, 36, 47], 3: [10, 37, 48, 49], 4: [13, 38, 39, 40], 5: [6, 41, 42, 5], 6: [7, 43, 26, 27], 7: [8, 9, 59]},
    6:  {1: [1, 3, 4, 35], 2: [2, 12, 36, 43], 3: [10, 37, 40, 48], 4: [13, 44, 45, 38], 5: [6, 46, 39, 5], 6: [7, 41, 42, 54], 7: [8, 9, 59]},
    7:  {1: [1, 3, 4, 35], 2: [2, 12, 47, 48], 3: [10, 37, 49, 36], 4: [13, 38, 39, 40], 5: [6, 41, 42, 5], 6: [7, 50, 52, 54], 7: [8, 9, 59]},
    8:  {1: [1, 3, 4, 35], 2: [2, 12, 47, 48], 3: [10, 49, 50, 36], 4: [13, 51, 52, 37], 5: [6, 53, 38, 5], 6: [7, 39, 41, 54], 7: [8, 9, 59]},
    9:  {1: [1, 3, 4, 11], 2: [2, 12, 47, 48], 3: [10, 54, 49, 35], 4: [13, 55, 37, 5], 5: [6, 43, 44, 39], 6: [7, 50, 56, 57], 7: [8, 9, 59]},
    10: {1: [1, 4, 11, 56], 2: [10, 12, 57, 5], 3: [13, 58, 89, 90], 4: [91, 92, 99, 100], 5: [6, 101, 105, 106], 6: [7, 54, 55, 2], 7: [8, 9, 59]},
    11: {1: [4, 5, 12, 60], 2: [6, 13, 61, 62], 3: [10, 63, 76, 77], 4: [64, 65, 66, 78], 5: [7, 69, 72, 82], 6: [8, 70, 73, 83], 7: [9, 75]},
    12: {1: [4, 5, 12, 60], 2: [6, 13, 61, 63], 3: [10, 62, 66, 77], 4: [67, 68, 72, 73], 5: [7, 64, 74, 82], 6: [8, 65, 69, 70], 7: [9, 75]},
    13: {1: [4, 5, 12, 60], 2: [6, 13, 61, 62], 3: [10, 69, 63, 77], 4: [70, 71, 72, 78], 5: [7, 64, 73, 82], 6: [8, 65, 74, 84], 7: [9, 75]},
    14: {1: [4, 5, 12, 60], 2: [6, 13, 61, 63], 3: [10, 72, 14, 77], 4: [66, 73, 74, 16], 5: [7, 67, 68, 22], 6: [8, 64, 69, 70], 7: [9, 75]},
    15: {1: [4, 5, 12, 60], 2: [6, 13, 61, 76], 3: [10, 77, 78, 62], 4: [82, 83, 84, 79], 5: [7, 85, 80, 81], 6: [8, 63, 64, 72], 7: [9, 86]},
    16: {1: [4, 5, 12, 60], 2: [6, 13, 61, 77], 3: [10, 76, 78, 62], 4: [79, 80, 81, 82], 5: [7, 83, 84, 85], 6: [8, 63, 64, 65], 7: [9, 86]},
    17: {1: [4, 11, 12, 87], 2: [5, 13, 88, 89], 3: [10, 90, 91, 92], 4: [93, 94, 99, 100], 5: [6, 95, 96, 102], 6: [7, 103, 104, 105], 7: [8, 9, 107]},
    18: {1: [4, 11, 12, 87], 2: [5, 13, 88, 89], 3: [10, 90, 91, 97], 4: [92, 93, 94, 98], 5: [6, 99, 100, 102], 6: [7, 95, 96, 103], 7: [8, 9, 107]},
    19: {1: [4, 11, 12, 87], 2: [5, 13, 89, 90], 3: [10, 91, 99, 100], 4: [92, 101, 102, 105], 5: [6, 93, 94, 106], 6: [7, 56, 57, 58], 7: [8, 9, 107]},
    20: {1: [4, 11, 12, 87], 2: [5, 13, 89, 90], 3: [10, 91, 103, 104], 4: [92, 93, 94, 100], 5: [6, 95, 96, 102], 6: [7, 105, 106, 62], 7: [8, 9, 107]},
    21: {1: [4, 11, 12, 87], 2: [5, 13, 89, 90], 3: [10, 91, 105, 106], 4: [92, 99, 100, 56], 5: [6, 57, 58, 101], 6: [7, 93, 94, 102], 7: [8, 9, 107]},
    22: {1: [4, 5, 12, 108], 2: [6, 13, 109, 110], 3: [10, 111, 112, 113], 4: [60, 62, 63, 114], 5: [7, 64, 72, 115], 6: [8, 65, 136, 137], 7: [9, 126]},
    23: {1: [4, 5, 12, 108], 2: [6, 13, 109, 114], 3: [10, 115, 116, 117], 4: [60, 62, 63, 118], 5: [7, 64, 72, 119], 6: [8, 65, 136, 137], 7: [9, 126]},
    24: {1: [4, 5, 12, 108], 2: [6, 13, 109, 118], 3: [10, 119, 120, 121], 4: [60, 62, 63, 122], 5: [7, 64, 72, 123], 6: [8, 65, 136, 137], 7: [9, 126]},
    25: {1: [4, 5, 12, 108], 2: [6, 13, 109, 122], 3: [10, 123, 124, 125], 4: [60, 62, 63, 114], 5: [7, 64, 72, 115], 6: [8, 65, 136, 137], 7: [9, 126]},
    26: {1: [4, 5, 12, 127], 2: [6, 13, 60, 128], 3: [10, 129, 130, 61], 4: [131, 132, 133, 62], 5: [7, 134, 64, 76], 6: [8, 65, 72, 77], 7: [9, 135]},
    27: {1: [4, 5, 12, 136], 2: [6, 13, 60, 137], 3: [10, 62, 63, 138], 4: [139, 140, 142, 66], 5: [7, 143, 65, 72], 6: [8, 64, 77, 109], 7: [9, 144]},
    28: {1: [4, 5, 12, 136], 2: [6, 13, 60, 137], 3: [10, 62, 63, 141], 4: [140, 142, 143, 66], 5: [7, 138, 65, 72], 6: [8, 64, 77, 109], 7: [9, 144]}
}

SEMESTER_COHORT_TERMS = {
    1: {1: 3, 2: 1},             # HK1-2024
    2: {1: 4, 2: 2},             # HK2-2024
    3: {1: 5, 2: 3, 3: 1},       # HK1-2025
    4: {1: 6, 2: 4, 3: 2},       # HK2-2025
    5: {1: 7, 2: 5, 3: 3, 4: 1}  # HK1-2026 (ACTIVE)
}

ROOMS = ["A101", "A102", "A103", "A201", "A202", "B101", "B102", "B201", "C101", "C102", "C201", "D101", "D102", "LAB1", "LAB2", "LAB3", "LAB4"]
DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
PERIODS = [
    ("07:00-09:30", 1, 3),
    ("09:35-12:05", 4, 6),
    ("13:20-15:50", 7, 9),
    ("16:00-18:25", 10, 12)
]

student_passed = {s["id"]: set() for s in STUDENTS}
student_failed = {s["id"]: set() for s in STUDENTS}

sections = []
schedules = []
enrollments = []
grades = []
invoices = []
exam_sessions = []
exam_rooms = []
exam_rosters = []

section_id_counter = 1
enrollment_id_counter = 1
grade_id_counter = 1
invoice_id_counter = 1
exam_session_id_counter = 1
exam_room_id_counter = 1
exam_roster_id_counter = 1

for sem in SEMESTERS:
    sem_id = sem["id"]
    sem_code = sem["semester_code"]
    sem_status = sem["status"]
    cohort_terms = SEMESTER_COHORT_TERMS[sem_id]
    
    print(f"  Simulating {sem_code} ({sem_status})...")
    
    # (subject_id, is_retake) -> list of student_ids
    subject_students = {}
    student_enrolled_this_sem = {s["id"]: set() for s in STUDENTS}
    
    for c_id, term_num in cohort_terms.items():
        cohort_students = [s["id"] for s in STUDENTS if STUDENT_COHORT[s["id"]] == c_id]
        
        for st_id in cohort_students:
            m_id = STUDENT_MAJOR[st_id]
            roadmap = MAJOR_ROADMAPS[m_id]
            
            # A. Retake
            retakes = sorted(list(student_failed[st_id]))
            for f_sub_id in retakes:
                if f_sub_id not in student_passed[st_id] and f_sub_id not in student_enrolled_this_sem[st_id]:
                    subject_students.setdefault((f_sub_id, True), []).append(st_id)
                    student_enrolled_this_sem[st_id].add(f_sub_id)
            
            # B. Regular courses
            term_subs = roadmap.get(term_num, [])
            for sub_id in term_subs:
                if sub_id not in student_passed[st_id] and sub_id not in student_enrolled_this_sem[st_id]:
                    prereq_id = SUBJECTS[sub_id]["prereq"]
                    if prereq_id and prereq_id not in student_passed[st_id]:
                        if prereq_id not in student_enrolled_this_sem[st_id]:
                            subject_students.setdefault((prereq_id, False), []).append(st_id)
                            student_enrolled_this_sem[st_id].add(prereq_id)
                    else:
                        subject_students.setdefault((sub_id, False), []).append(st_id)
                        student_enrolled_this_sem[st_id].add(sub_id)
                        
    section_index_by_subject = {}
    
    for (sub_id, is_retake), st_list in subject_students.items():
        if not st_list:
            continue
        
        st_list = sorted(list(set(st_list)))
        sub_info = SUBJECTS[sub_id]
        dept_id = sub_info["dept"]
        lec_candidates = DEPT_LECTURERS[dept_id]
        
        chunk_size = 50
        chunks = [st_list[i:i + chunk_size] for i in range(0, len(st_list), chunk_size)]
        
        for chunk in chunks:
            sec_idx = section_index_by_subject.get(sub_id, 0) + 1
            section_index_by_subject[sub_id] = sec_idx
            
            # Short clean section_code <= 30 chars
            sec_code = f"{sub_info['code']}-{sec_idx:02d}-{sem_code}"
            lec_id = lec_candidates[(sec_idx - 1) % len(lec_candidates)]
            
            day_str = DAYS[(section_id_counter + sec_idx) % len(DAYS)]
            day_of_week = ((section_id_counter + sec_idx) % len(DAYS)) + 2
            period_str, start_p, end_p = PERIODS[(section_id_counter * 3 + sec_idx) % len(PERIODS)]
            room_str = ROOMS[(section_id_counter * 2 + sec_idx) % len(ROOMS)]
            schedule_desc = f"{day_str} ({period_str})"
            
            sec_status = "COMPLETED" if sem_status == "COMPLETED" else "ACTIVE"
            sub_status = "PUBLISHED" if sem_status == "COMPLETED" else "DRAFT"
            
            curr_sec_id = section_id_counter
            section_id_counter += 1
            
            sections.append({
                "id": curr_sec_id,
                "section_code": sec_code,
                "subject_id": sub_id,
                "lecturer_id": lec_id,
                "semester_id": sem_id,
                "max_students": max(len(chunk) + 10, 50),
                "enrolled_count": len(chunk),
                "schedule": schedule_desc,
                "room": room_str,
                "status": sec_status,
                "section_type": "REGULAR",
                "min_students": 15,
                "scale_coefficient": 1.00,
                "base_tuition_rate": 450000.00,
                "grade_submission_status": sub_status
            })
            
            schedules.append({
                "id": curr_sec_id,
                "section_id": curr_sec_id,
                "day_of_week": day_of_week,
                "start_period": start_p,
                "end_period": end_p,
                "room": room_str,
                "start_date": sem["start_date"],
                "end_date": sem["end_date"]
            })
            
            exam_sess_id = exam_session_id_counter
            exam_session_id_counter += 1
            
            exam_sessions.append({
                "id": exam_sess_id,
                "semester_id": sem_id,
                "subject_id": sub_id,
                "session_name": f"Thi kết thúc môn {sub_info['name']} - {sem_code}",
                "exam_date": sem["end_date"],
                "start_time": "08:00:00",
                "end_time": "09:30:00"
            })
            
            exam_rm_id = exam_room_id_counter
            exam_room_id_counter += 1
            exam_rooms.append({
                "id": exam_rm_id,
                "session_id": exam_sess_id,
                "room_code": f"P.{sec_idx:02d}",
                "room_location": f"Tòa {room_str[0]} - Phòng {room_str}",
                "capacity": 55,
                "status": "FINALIZED" if sem_status == "COMPLETED" else "SCHEDULED"
            })
            
            for st_id in chunk:
                curr_enroll_id = enrollment_id_counter
                enrollment_id_counter += 1
                
                enroll_status = "COMPLETED" if sem_status == "COMPLETED" else "ENROLLED"
                enroll_type = "RETAKE" if is_retake else "FIRST_TIME"
                
                enrollments.append({
                    "id": curr_enroll_id,
                    "student_id": st_id,
                    "section_id": curr_sec_id,
                    "enrolled_at": f"{sem['start_date']} 08:30:00",
                    "status": enroll_status,
                    "enrollment_type": enroll_type,
                    "attendance_status": "QUALIFIED"
                })
                
                inv_status = "PAID" if sem_status == "COMPLETED" else ("PAID" if random.random() < 0.75 else "UNPAID")
                paid_at_str = f"{sem['start_date']} 14:00:00" if inv_status == "PAID" else None
                receipt_str = f"BL-{sem_code}-{curr_enroll_id:06d}" if inv_status == "PAID" else None
                
                invoices.append({
                    "id": invoice_id_counter,
                    "student_id": st_id,
                    "section_id": curr_sec_id,
                    "credits": sub_info["credits"],
                    "base_rate": 450000.00,
                    "coefficient": 1.00,
                    "amount": sub_info["credits"] * 450000.00,
                    "status": inv_status,
                    "paid_at": paid_at_str,
                    "paid_method": "BANK_TRANSFER" if inv_status == "PAID" else "CASH",
                    "receipt_number": receipt_str,
                    "cashier_user_id": 1 if inv_status == "PAID" else None,
                    "created_at": f"{sem['start_date']} 08:00:00"
                })
                invoice_id_counter += 1
                
                sbd_str = f"{sub_info['code']}-{curr_enroll_id:05d}"
                ability = STUDENT_ABILITIES[st_id]
                
                if sem_status == "COMPLETED":
                    cc1 = round(min(10.0, max(6.0, ability + random.gauss(0.5, 0.4))), 1)
                    cc2 = round(min(10.0, max(6.0, ability + random.gauss(0.4, 0.4))), 1)
                    mid = round(min(10.0, max(3.0, ability + random.gauss(0.0, 0.6))), 1)
                    final_exam = round(min(10.0, max(1.5, ability + random.gauss(-0.2, 0.8))), 1)
                    
                    total = round(cc1 * 0.05 + cc2 * 0.05 + mid * 0.30 + final_exam * 0.60, 2)
                    
                    if final_exam < 3.0 or total < 4.0:
                        letter = "F"
                        gpa = 0.0
                        student_failed[st_id].add(sub_id)
                    else:
                        if total >= 8.5:   letter, gpa = "A", 4.0
                        elif total >= 8.0: letter, gpa = "B+", 3.5
                        elif total >= 7.0: letter, gpa = "B", 3.0
                        elif total >= 6.5: letter, gpa = "C+", 2.5
                        elif total >= 5.5: letter, gpa = "C", 2.0
                        elif total >= 5.0: letter, gpa = "D+", 1.5
                        else:              letter, gpa = "D", 1.0
                        
                        student_passed[st_id].add(sub_id)
                        if sub_id in student_failed[st_id]:
                            student_failed[st_id].remove(sub_id)
                    
                    curr_grade_id = grade_id_counter
                    grade_id_counter += 1
                    
                    grades.append({
                        "id": curr_grade_id,
                        "enrollment_id": curr_enroll_id,
                        "cc1_score": cc1,
                        "cc2_score": cc2,
                        "midterm_score": mid,
                        "final_score": final_exam,
                        "total_score": total,
                        "letter_grade": letter,
                        "gpa_point": gpa,
                        "is_finalized": 1,
                        "finalized_at": f"{sem['end_date']} 16:00:00",
                        "special_grade": "NONE"
                    })
                    
                    exam_rosters.append({
                        "id": exam_roster_id_counter,
                        "exam_room_id": exam_rm_id,
                        "enrollment_id": curr_enroll_id,
                        "student_id": st_id,
                        "sbd": sbd_str,
                        "score": final_exam,
                        "special_grade": "NONE",
                        "scored_at": f"{sem['end_date']} 15:30:00",
                        "scored_by": 1
                    })
                    exam_roster_id_counter += 1
                else:
                    has_cc = (random.random() < 0.60)
                    cc1 = round(min(10.0, max(6.0, ability + random.gauss(0.5, 0.4))), 1) if has_cc else None
                    cc2 = round(min(10.0, max(6.0, ability + random.gauss(0.4, 0.4))), 1) if has_cc else None
                    
                    grades.append({
                        "id": grade_id_counter,
                        "enrollment_id": curr_enroll_id,
                        "cc1_score": cc1,
                        "cc2_score": cc2,
                        "midterm_score": None,
                        "final_score": None,
                        "total_score": None,
                        "letter_grade": None,
                        "gpa_point": None,
                        "is_finalized": 0,
                        "finalized_at": None,
                        "special_grade": "NONE"
                    })
                    grade_id_counter += 1
                    
                    exam_rosters.append({
                        "id": exam_roster_id_counter,
                        "exam_room_id": exam_rm_id,
                        "enrollment_id": curr_enroll_id,
                        "student_id": st_id,
                        "sbd": sbd_str,
                        "score": None,
                        "special_grade": "NONE",
                        "scored_at": None,
                        "scored_by": None
                    })
                    exam_roster_id_counter += 1

print(f"Simulation summary: Sections={len(sections)}, Enrollments={len(enrollments)}, Grades={len(grades)}")

print("--- STEP 5: SQL SERIALIZATION & DB IMPORT ---")

sql_parts = []

sql_parts.append("""-- ============================================================
-- STUDENT MANAGEMENT SYSTEM (SMS)
-- COMPREHENSIVE SEED DATASET (3,000 SV, 80 GV, 28 NGÀNH, 8 KHOA, 5 HỌC KỲ)
-- ============================================================
USE student_management;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE grade_audit_logs;
TRUNCATE TABLE exam_rosters;
TRUNCATE TABLE exam_rooms;
TRUNCATE TABLE exam_sessions;
TRUNCATE TABLE attendance_records;
TRUNCATE TABLE attendance_sessions;
TRUNCATE TABLE student_invoices;
TRUNCATE TABLE fee_scale_rules;
TRUNCATE TABLE class_opening_requests;
TRUNCATE TABLE grade_appeals;
TRUNCATE TABLE grades;
TRUNCATE TABLE schedules;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE course_sections;
TRUNCATE TABLE curriculum_block_subjects;
TRUNCATE TABLE curriculum_blocks;
TRUNCATE TABLE curriculum_programs;
TRUNCATE TABLE cohorts;
TRUNCATE TABLE majors;
TRUNCATE TABLE subject_prerequisites;
TRUNCATE TABLE subjects;
TRUNCATE TABLE lecturers;
TRUNCATE TABLE students;
TRUNCATE TABLE classes;
TRUNCATE TABLE departments;
TRUNCATE TABLE semesters;
TRUNCATE TABLE notifications;
TRUNCATE TABLE password_reset_requests;
TRUNCATE TABLE conduct_scores;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
""")

sql_parts.append("""-- 1. ROLES
INSERT INTO roles (id, name) VALUES (1, 'ADMIN'), (2, 'LECTURER'), (3, 'STUDENT');
""")

sql_parts.append("-- 2. DEPARTMENTS")
sql_parts.append(chunk_inserts("departments", ["id", "code", "name", "description"], DEPARTMENTS, chunk_size=50))

sql_parts.append("-- 3. MAJORS")
sql_parts.append(chunk_inserts("majors", ["id", "department_id", "code", "name", "description"], [
    {"id": m["id"], "department_id": m["dept_id"], "code": m["code"], "name": m["name"], "description": m["desc"]}
    for m in MAJORS
], chunk_size=50))

sql_parts.append("-- 4. COHORTS")
sql_parts.append(chunk_inserts("cohorts", ["id", "code", "name", "admission_year", "graduation_year"], COHORTS, chunk_size=50))

sql_parts.append("-- 5. CURRICULUM PROGRAMS")
sql_parts.append(chunk_inserts("curriculum_programs", ["id", "major_id", "cohort_id", "code", "name", "total_credits"], CURRICULUM_PROGRAMS, chunk_size=100))

sql_parts.append("-- 5.1 CURRICULUM BLOCKS")
sql_parts.append(chunk_inserts("curriculum_blocks", [
    "id", "program_id", "code", "name", "block_type",
    "required_subject_count", "required_credits", "elective_subject_count", "elective_credits", "display_order"
], CURRICULUM_BLOCKS, chunk_size=100))

sql_parts.append("-- 5.2 CURRICULUM BLOCK SUBJECTS")
sql_parts.append(chunk_inserts("curriculum_block_subjects", ["block_id", "subject_id", "is_required"], CURRICULUM_BLOCK_SUBJECTS, chunk_size=200))

sql_parts.append("-- 6. CLASSES")
sql_parts.append(chunk_inserts("classes", ["id", "code", "name", "department_id", "academic_year", "major_id", "cohort_id", "is_active"], CLASSES, chunk_size=100))

ALL_USERS = [
    {"id": 1, "username": "admin", "password": "$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm", "email": "admin@sms.edu.vn", "role_id": 1, "is_active": 1}
]
ALL_USERS.extend(USERS_LECTURERS)
ALL_USERS.extend(USERS_STUDENTS)

sql_parts.append("-- 7. USERS")
sql_parts.append(chunk_inserts("users", ["id", "username", "password", "email", "role_id", "is_active"], ALL_USERS, chunk_size=200))

sql_parts.append("-- 8. LECTURERS")
sql_parts.append(chunk_inserts("lecturers", [
    "id", "user_id", "lecturer_code", "full_name", "date_of_birth", "gender", "email", "phone", "department_id", "degree", "specialization"
], LECTURERS, chunk_size=100))

sql_parts.append("-- 9. SUBJECTS")
sql_parts.append(chunk_inserts("subjects", ["id", "subject_code", "subject_name", "credits", "description", "department_id"], [
    {"id": s["id"], "subject_code": s["code"], "subject_name": s["name"], "credits": s["credits"], "description": s["desc"], "department_id": s["dept"]}
    for s in SUBJECTS.values()
], chunk_size=100))

sql_parts.append("-- 9.1 SUBJECT PREREQUISITES")
sql_parts.append(chunk_inserts("subject_prerequisites", ["subject_id", "prerequisite_id"], SUBJECT_PREREQUISITES, chunk_size=100))

sql_parts.append("-- 10. SEMESTERS")
sql_parts.append(chunk_inserts("semesters", [
    "id", "semester_code", "semester_name", "start_date", "end_date", "academic_year", "semester_number", "is_current", "status"
], SEMESTERS, chunk_size=50))

sql_parts.append("""-- 11. FEE SCALE RULES
INSERT INTO fee_scale_rules (id, min_students, max_students, coefficient) VALUES
(1, 0, 4, 2.00), (2, 5, 9, 1.50), (3, 10, 19, 1.30),
(4, 20, 29, 1.20), (5, 30, 39, 1.10), (6, 40, 2147483647, 1.00);
""")

sql_parts.append("-- 12. STUDENTS")
sql_parts.append(chunk_inserts("students", [
    "id", "user_id", "student_code", "full_name", "date_of_birth", "gender", "email", "phone", "address", "class_id", "status",
    "balance", "financial_hold", "academic_warning_level"
], STUDENTS, chunk_size=200))

sql_parts.append("-- 13. COURSE SECTIONS")
sql_parts.append(chunk_inserts("course_sections", [
    "id", "section_code", "subject_id", "lecturer_id", "semester_id",
    "max_students", "enrolled_count", "schedule", "room", "status",
    "section_type", "min_students", "scale_coefficient", "base_tuition_rate", "grade_submission_status"
], sections, chunk_size=100))

sql_parts.append("-- 14. SCHEDULES")
sql_parts.append(chunk_inserts("schedules", [
    "id", "section_id", "day_of_week", "start_period", "end_period", "room", "start_date", "end_date"
], schedules, chunk_size=100))

sql_parts.append("-- 15. ENROLLMENTS")
sql_parts.append(chunk_inserts("enrollments", [
    "id", "student_id", "section_id", "enrolled_at", "status", "enrollment_type", "attendance_status"
], enrollments, chunk_size=200))

sql_parts.append("-- 16. GRADES")
sql_parts.append(chunk_inserts("grades", [
    "id", "enrollment_id", "cc1_score", "cc2_score", "midterm_score",
    "final_score", "total_score", "letter_grade", "gpa_point", "is_finalized", "finalized_at", "special_grade"
], grades, chunk_size=200))

sql_parts.append("-- 17. STUDENT INVOICES")
sql_parts.append(chunk_inserts("student_invoices", [
    "id", "student_id", "section_id", "credits", "base_rate",
    "coefficient", "amount", "status", "paid_at", "paid_method",
    "receipt_number", "cashier_user_id", "created_at"
], invoices, chunk_size=200))

sql_parts.append("-- 18. EXAM SESSIONS")
sql_parts.append(chunk_inserts("exam_sessions", [
    "id", "semester_id", "subject_id", "session_name", "exam_date", "start_time", "end_time"
], exam_sessions, chunk_size=100))

sql_parts.append("-- 18.1 EXAM ROOMS")
sql_parts.append(chunk_inserts("exam_rooms", [
    "id", "session_id", "room_code", "room_location", "capacity", "status"
], exam_rooms, chunk_size=100))

sql_parts.append("-- 18.2 EXAM ROSTERS")
sql_parts.append(chunk_inserts("exam_rosters", [
    "id", "exam_room_id", "enrollment_id", "student_id", "sbd", "score", "special_grade", "scored_at", "scored_by"
], exam_rosters, chunk_size=200))

sql_parts.append("""-- 19. SYSTEM CONFIGS & CONDUCT SCORES
INSERT INTO system_configs (config_key, config_value, description, created_at, updated_at) VALUES
('CURRENT_SEMESTER_ID', '5', 'ID học kỳ hiện tại đang hoạt động (HK1-2026)', NOW(), NOW()),
('CREDIT_TUITION_FEE_VND', '450000', 'Mức học phí chuẩn mỗi tín chỉ (VND)', NOW(), NOW()),
('MIN_ENROLLMENT_CREDITS', '10', 'Số tín chỉ đăng ký tối thiểu mỗi kỳ', NOW(), NOW()),
('MAX_ENROLLMENT_CREDITS', '24', 'Số tín chỉ đăng ký tối đa mỗi kỳ', NOW(), NOW()),
('ABSENCE_BAN_THRESHOLD_PERCENT', '20', 'Ngưỡng phần trăm số tiết vắng mặt tối đa trước khi bị cấm thi', NOW(), NOW()),
('APPEAL_WINDOW_DAYS', '7', 'Số ngày mở cửa sổ phúc khảo sau khi công bố điểm', NOW(), NOW()),
('ENROLLMENT_PORTAL_OPEN', 'true', 'Trạng thái mở cổng đăng ký tín chỉ trực tuyến (true/false)', NOW(), NOW())
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW();

INSERT IGNORE INTO conduct_scores (student_id, semester_id, score, classification, note, created_at, updated_at)
SELECT s.id, 5, 85, 'TOT', 'Tích cực tham gia phong trào Đoàn - Hội', NOW(), NOW()
FROM students s;

-- Cập nhật Trưởng khoa
UPDATE departments SET head_lecturer_id = 1 WHERE id = 1;
UPDATE departments SET head_lecturer_id = 11 WHERE id = 2;
UPDATE departments SET head_lecturer_id = 21 WHERE id = 3;
UPDATE departments SET head_lecturer_id = 31 WHERE id = 4;
UPDATE departments SET head_lecturer_id = 41 WHERE id = 5;
UPDATE departments SET head_lecturer_id = 51 WHERE id = 6;
UPDATE departments SET head_lecturer_id = 61 WHERE id = 7;
UPDATE departments SET head_lecturer_id = 71 WHERE id = 8;

UPDATE course_sections cs
SET enrolled_count = (
    SELECT COUNT(*) FROM enrollments e
    WHERE e.section_id = cs.id AND e.status != 'CANCELLED'
);

SET FOREIGN_KEY_CHECKS = 1;
""")

full_sql = "\n".join(sql_parts)

with open("database/seed.sql", "w", encoding="utf-8") as f:
    f.write(full_sql)

print(f"Successfully generated database/seed.sql ({len(full_sql):,} characters).")

print("Importing database/seed.sql into Docker MySQL...")
cmd = ["docker", "exec", "-i", "student_management_db", "mysql", "-uroot", "--default-character-set=utf8mb4", "student_management"]
with open("database/seed.sql", "rb") as f_in:
    p = subprocess.run(cmd, input=f_in.read(), capture_output=True)

if p.returncode == 0:
    print("SUCCESS: database/seed.sql loaded into Docker MySQL container successfully!")
else:
    err = p.stderr.decode('utf-8', errors='replace')
    print(f"ERROR loading database/seed.sql: {err}")
    sys.exit(1)
