"""
Curriculum Catalog & SMS Reference Data
Covers all 9 Majors, 4 Cohorts, 36 Classes, 45 Lecturers, 306 Subjects,
and 7 Semesters (6 COMPLETED + 1 ACTIVE) with strict Prerequisite DAGs.
"""

DEPARTMENTS = [
    {"id": 1, "code": "CNTT", "name": "Khoa Công nghệ Thông tin & Khoa học Máy tính", "desc": "Đào tạo Kỹ thuật phần mềm, Trí tuệ nhân tạo, Khoa học dữ liệu và An ninh mạng"},
    {"id": 2, "code": "KT_QTKD", "name": "Khoa Kinh tế & Quản trị Kinh doanh", "desc": "Đào tạo Quản trị kinh doanh, Marketing số, Logistics và Tài chính quốc tế"},
    {"id": 3, "code": "KT_DTVT", "name": "Khoa Kỹ thuật Điện - Điện tử & Tự động hóa", "desc": "Đào tạo Điện tử viễn thông, Hệ thống nhúng, IoT, Vi mạch bán dẫn và Tự động hóa"},
    {"id": 4, "code": "COKHI", "name": "Khoa Kỹ thuật Cơ khí & Ô tô", "desc": "Đào tạo Cơ điện tử, Thiết kế máy CNC, Kỹ thuật ô tô và Động cơ hiện đại"},
    {"id": 5, "code": "NN", "name": "Khoa Ngoại ngữ", "desc": "Đào tạo Ngôn ngữ Anh thương mại, Biên phiên dịch học thuật và Tiếng Anh chuyên ngành"},
    {"id": 6, "code": "KETOAN", "name": "Khoa Kế toán - Kiểm toán", "desc": "Đào tạo Kế toán doanh nghiệp, Kiểm toán tài chính và Hệ thống thông tin kế toán"},
    {"id": 7, "code": "LUAT", "name": "Khoa Luật & Pháp luật Kinh tế", "desc": "Đào tạo Luật kinh tế, Pháp luật thương mại quốc tế, Hợp đồng và Sở hữu trí tuệ"},
    {"id": 8, "code": "XD", "name": "Khoa Kỹ thuật Xây dựng", "desc": "Đào tạo Kỹ thuật công trình xây dựng, Kết cấu bê tông thép, BIM và Quản lý dự án"},
    {"id": 9, "code": "YD", "name": "Khoa Y - Dược học", "desc": "Đào tạo Dược học lâm sàng, Hóa dược, Bào chế thuốc, Dược liệu và Quản lý kinh tế dược"}
]

MAJORS = [
    {"id": 1, "dept_id": 1, "code": "CNTT", "name": "Công nghệ thông tin", "desc": "Kỹ thuật phần mềm, trí tuệ nhân tạo, an toàn thông tin và khoa học máy tính"},
    {"id": 2, "dept_id": 2, "code": "QTKD", "name": "Quản trị kinh doanh", "desc": "Quản trị doanh nghiệp số, marketing, quản lý chuỗi cung ứng và tài chính"},
    {"id": 3, "dept_id": 3, "code": "DTVT", "name": "Kỹ thuật Điện tử - Viễn thông", "desc": "Hệ thống nhúng thông minh, IoT, vi mạch điện tử và mạng viễn thông thế hệ mới"},
    {"id": 4, "dept_id": 4, "code": "CK", "name": "Kỹ thuật Cơ khí & Công nghệ Ô tô", "desc": "Cơ điện tử, công nghệ gia công CNC, kỹ thuật động cơ ô tô và thiết kế cơ khí"},
    {"id": 5, "dept_id": 5, "code": "NN", "name": "Ngôn ngữ Anh", "desc": "Tiếng Anh thương mại, biên phiên dịch học thuật và ứng dụng ngôn ngữ"},
    {"id": 6, "dept_id": 6, "code": "KT", "name": "Kế toán - Kiểm toán", "desc": "Kế toán tài chính, kế toán quản trị doanh nghiệp và kiểm toán độc lập"},
    {"id": 7, "dept_id": 7, "code": "LUAT", "name": "Luật kinh tế", "desc": "Pháp luật doanh nghiệp, hợp đồng thương mại quốc tế và giải quyết tranh chấp kinh tế"},
    {"id": 8, "dept_id": 8, "code": "XD", "name": "Kỹ thuật Xây dựng", "desc": "Kết cấu xây dựng dân dụng - công nghiệp, công nghệ BIM và quản lý thi công"},
    {"id": 9, "dept_id": 9, "code": "YD", "name": "Dược học", "desc": "Dược học lâm sàng, bào chế dược phẩm, hóa dược, kiểm nghiệm thuốc và dược lý học"}
]

COHORTS = [
    {"id": 1, "code": "K16", "name": "Khóa 16", "start_year": 2023, "grad_year": 2027},
    {"id": 2, "code": "K17", "name": "Khóa 17", "start_year": 2024, "grad_year": 2028},
    {"id": 3, "code": "K18", "name": "Khóa 18", "start_year": 2025, "grad_year": 2029},
    {"id": 4, "code": "K19", "name": "Khóa 19", "start_year": 2026, "grad_year": 2030}
]

# 45 Lecturers (5 per department)
LECTURERS = [
    # Khoa 1: CNTT
    {"id": 1, "dept": 1, "code": "GV001", "name": "PGS.TS. Trần Văn Long", "email": "long.tv@sms.edu.vn", "phone": "0912345001", "title": "Phó Giáo sư, Tiến sĩ"},
    {"id": 2, "dept": 1, "code": "GV002", "name": "TS. Lê Thị Mai Lan", "email": "lan.ltm@sms.edu.vn", "phone": "0912345002", "title": "Tiến sĩ"},
    {"id": 3, "dept": 1, "code": "GV003", "name": "ThS. Phạm Quang Huy", "email": "huy.pq@sms.edu.vn", "phone": "0912345003", "title": "Thạc sĩ"},
    {"id": 4, "dept": 1, "code": "GV004", "name": "TS. Hoàng Đức Thắng", "email": "thang.hd@sms.edu.vn", "phone": "0912345004", "title": "Tiến sĩ"},
    {"id": 5, "dept": 1, "code": "GV005", "name": "ThS. Đỗ Phương Thảo", "email": "thao.dp@sms.edu.vn", "phone": "0912345005", "title": "Thạc sĩ"},
    # Khoa 2: QTKD
    {"id": 6, "dept": 2, "code": "GV006", "name": "PGS.TS. Nguyễn Mạnh Cường", "email": "cuong.nm@sms.edu.vn", "phone": "0912345006", "title": "Phó Giáo sư, Tiến sĩ"},
    {"id": 7, "dept": 2, "code": "GV007", "name": "TS. Vũ Thu Hà", "email": "ha.vt@sms.edu.vn", "phone": "0912345007", "title": "Tiến sĩ"},
    {"id": 8, "dept": 2, "code": "GV008", "name": "ThS. Đặng Quốc Hưng", "email": "hung.dq@sms.edu.vn", "phone": "0912345008", "title": "Thạc sĩ"},
    {"id": 9, "dept": 2, "code": "GV009", "name": "TS. Bùi Minh Tuấn", "email": "tuan.bm@sms.edu.vn", "phone": "0912345009", "title": "Tiến sĩ"},
    {"id": 10, "dept": 2, "code": "GV010", "name": "ThS. Mai Thị Bích Ngọc", "email": "ngoc.mtb@sms.edu.vn", "phone": "0912345010", "title": "Thạc sĩ"},
    # Khoa 3: DTVT
    {"id": 11, "dept": 3, "code": "GV011", "name": "TS. Ngô Quang Đăng", "email": "dang.nq@sms.edu.vn", "phone": "0912345011", "title": "Tiến sĩ"},
    {"id": 12, "dept": 3, "code": "GV012", "name": "ThS. Trịnh Xuân Bách", "email": "bach.tx@sms.edu.vn", "phone": "0912345012", "title": "Thạc sĩ"},
    {"id": 13, "dept": 3, "code": "GV013", "name": "TS. Lưu Quốc Bảo", "email": "bao.lq@sms.edu.vn", "phone": "0912345013", "title": "Tiến sĩ"},
    {"id": 14, "dept": 3, "code": "GV014", "name": "ThS. Nguyễn Hồng Quân", "email": "quan.nh@sms.edu.vn", "phone": "0912345014", "title": "Thạc sĩ"},
    {"id": 15, "dept": 3, "code": "GV015", "name": "TS. Chu Anh Tuấn", "email": "tuan.ca@sms.edu.vn", "phone": "0912345015", "title": "Tiến sĩ"},
    # Khoa 4: Cơ khí
    {"id": 16, "dept": 4, "code": "GV016", "name": "PGS.TS. Đinh Văn Hiệp", "email": "hiep.dv@sms.edu.vn", "phone": "0912345016", "title": "Phó Giáo sư, Tiến sĩ"},
    {"id": 17, "dept": 4, "code": "GV017", "name": "TS. Phan Văn Phúc", "email": "phuc.pv@sms.edu.vn", "phone": "0912345017", "title": "Tiến sĩ"},
    {"id": 18, "dept": 4, "code": "GV018", "name": "ThS. Đào Trọng Hải", "email": "hai.dt@sms.edu.vn", "phone": "0912345018", "title": "Thạc sĩ"},
    {"id": 19, "dept": 4, "code": "GV019", "name": "TS. Nguyễn Công Minh", "email": "minh.nc@sms.edu.vn", "phone": "0912345019", "title": "Tiến sĩ"},
    {"id": 20, "dept": 4, "code": "GV020", "name": "ThS. Tạ Hữu Dũng", "email": "dung.th@sms.edu.vn", "phone": "0912345020", "title": "Thạc sĩ"},
    # Khoa 5: Ngoại ngữ
    {"id": 21, "dept": 5, "code": "GV021", "name": "TS. Hoàng Diệu Linh", "email": "linh.hd@sms.edu.vn", "phone": "0912345021", "title": "Tiến sĩ"},
    {"id": 22, "dept": 5, "code": "GV022", "name": "ThS. Vũ Khánh Huyền", "email": "huyen.vk@sms.edu.vn", "phone": "0912345022", "title": "Thạc sĩ"},
    {"id": 23, "dept": 5, "code": "GV023", "name": "TS. Robert Davis", "email": "robert.davis@sms.edu.vn", "phone": "0912345023", "title": "Tiến sĩ"},
    {"id": 24, "dept": 5, "code": "GV024", "name": "ThS. Nguyễn Quỳnh Trang", "email": "trang.nq@sms.edu.vn", "phone": "0912345024", "title": "Thạc sĩ"},
    {"id": 25, "dept": 5, "code": "GV025", "name": "ThS. Dương Thanh Hương", "email": "huong.dt@sms.edu.vn", "phone": "0912345025", "title": "Thạc sĩ"},
    # Khoa 6: Kế toán - Kiểm toán
    {"id": 26, "dept": 6, "code": "GV026", "name": "PGS.TS. Nguyễn Thị Hồng Nga", "email": "nga.nth@sms.edu.vn", "phone": "0912345026", "title": "Phó Giáo sư, Tiến sĩ"},
    {"id": 27, "dept": 6, "code": "GV027", "name": "TS. Trương Vĩnh Bình", "email": "binh.tv@sms.edu.vn", "phone": "0912345027", "title": "Tiến sĩ"},
    {"id": 28, "dept": 6, "code": "GV028", "name": "ThS. Lê Thanh Hằng", "email": "hang.lt@sms.edu.vn", "phone": "0912345028", "title": "Thạc sĩ"},
    {"id": 29, "dept": 6, "code": "GV029", "name": "TS. Phạm Gia Khánh", "email": "khanh.pg@sms.edu.vn", "phone": "0912345029", "title": "Tiến sĩ"},
    {"id": 30, "dept": 6, "code": "GV030", "name": "ThS. Trần Thu Uyên", "email": "uyen.tt@sms.edu.vn", "phone": "0912345030", "title": "Thạc sĩ"},
    # Khoa 7: Luật
    {"id": 31, "dept": 7, "code": "GV031", "name": "PGS.TS. Hà Quốc Đạt", "email": "dat.hq@sms.edu.vn", "phone": "0912345031", "title": "Phó Giáo sư, Tiến sĩ"},
    {"id": 32, "dept": 7, "code": "GV032", "name": "TS. Vũ Đình Thành", "email": "thanh.vd@sms.edu.vn", "phone": "0912345032", "title": "Tiến sĩ"},
    {"id": 33, "dept": 7, "code": "GV033", "name": "ThS. Hoàng Phương Nam", "email": "nam.hp@sms.edu.vn", "phone": "0912345033", "title": "Thạc sĩ"},
    {"id": 34, "dept": 7, "code": "GV034", "name": "TS. Đặng Thùy Dương", "email": "duong.dt@sms.edu.vn", "phone": "0912345034", "title": "Tiến sĩ"},
    {"id": 35, "dept": 7, "code": "GV035", "name": "ThS. Nguyễn Thế Anh", "email": "anh.nt@sms.edu.vn", "phone": "0912345035", "title": "Thạc sĩ"},
    # Khoa 8: Xây dựng
    {"id": 36, "dept": 8, "code": "GV036", "name": "PGS.TS. Bùi Văn Cường", "email": "cuong.bv@sms.edu.vn", "phone": "0912345036", "title": "Phó Giáo sư, Tiến sĩ"},
    {"id": 37, "dept": 8, "code": "GV037", "name": "TS. Lê Khắc Hiếu", "email": "hieu.lk@sms.edu.vn", "phone": "0912345037", "title": "Tiến sĩ"},
    {"id": 38, "dept": 8, "code": "GV038", "name": "ThS. Nguyễn Tuấn Kiệt", "email": "kiet.nt@sms.edu.vn", "phone": "0912345038", "title": "Thạc sĩ"},
    {"id": 39, "dept": 8, "code": "GV039", "name": "TS. Tạ Quang Trung", "email": "trung.tq@sms.edu.vn", "phone": "0912345039", "title": "Tiến sĩ"},
    {"id": 40, "dept": 8, "code": "GV040", "name": "ThS. Phạm Đình Trọng", "email": "trong.pd@sms.edu.vn", "phone": "0912345040", "title": "Thạc sĩ"},
    # Khoa 9: Y - Dược
    {"id": 41, "dept": 9, "code": "GV041", "name": "PGS.TS.DS. Nguyễn Thị Minh Tâm", "email": "tam.ntm@sms.edu.vn", "phone": "0912345041", "title": "Phó Giáo sư, Tiến sĩ Dược học"},
    {"id": 42, "dept": 9, "code": "GV042", "name": "TS.DS. Võ Hoàng Yến", "email": "yen.vh@sms.edu.vn", "phone": "0912345042", "title": "Tiến sĩ Dược học"},
    {"id": 43, "dept": 9, "code": "GV043", "name": "ThS.DS. Trần Quốc Việt", "email": "viet.tq@sms.edu.vn", "phone": "0912345043", "title": "Thạc sĩ Dược học"},
    {"id": 44, "dept": 9, "code": "GV044", "name": "TS.BS. Phan Cẩm Thơ", "email": "tho.pc@sms.edu.vn", "phone": "0912345044", "title": "Tiến sĩ Y khoa"},
    {"id": 45, "dept": 9, "code": "GV045", "name": "ThS.DS. Đỗ Mai Phương", "email": "phuong.dm@sms.edu.vn", "phone": "0912345045", "title": "Thạc sĩ Dược học"}
]

DEPT_LECTURERS = {}
for l in LECTURERS:
    DEPT_LECTURERS.setdefault(l["dept"], []).append(l["id"])

# 36 Classes across 9 Majors x 4 Cohorts
CLASSES = {}
class_id_seq = 1
for mid in range(1, 10):
    m_info = MAJORS[mid - 1]
    m_code = m_info["code"]
    dept_id = m_info["dept_id"]
    for cid in range(1, 5):
        c_info = COHORTS[cid - 1]
        c_code = c_info["code"]
        class_code = f"{c_code}-{m_code}1"
        class_name = f"Lớp {m_info['name']} 1 - {c_code}"
        CLASSES[class_id_seq] = {
            "id": class_id_seq,
            "code": class_code,
            "name": class_name,
            "dept": dept_id,
            "cohort": cid,
            "major": mid,
            "cohort_name": c_code,
            "students": []
        }
        class_id_seq += 1

# 7 Semesters
SEMESTERS = [
    {"id": 1, "code": "HK1-2023", "name": "Học kỳ 1 (2023-2024)", "start": "2023-09-01", "end": "2024-01-15", "year": "2023-2024", "sem_num": 1, "curr": 0, "status": "COMPLETED"},
    {"id": 2, "code": "HK2-2023", "name": "Học kỳ 2 (2023-2024)", "start": "2024-02-01", "end": "2024-06-30", "year": "2023-2024", "sem_num": 2, "curr": 0, "status": "COMPLETED"},
    {"id": 3, "code": "HK1-2024", "name": "Học kỳ 1 (2024-2025)", "start": "2024-09-01", "end": "2025-01-15", "year": "2024-2025", "sem_num": 1, "curr": 0, "status": "COMPLETED"},
    {"id": 4, "code": "HK2-2024", "name": "Học kỳ 2 (2024-2025)", "start": "2025-02-01", "end": "2025-06-30", "year": "2024-2025", "sem_num": 2, "curr": 0, "status": "COMPLETED"},
    {"id": 5, "code": "HK1-2025", "name": "Học kỳ 1 (2025-2026)", "start": "2025-09-01", "end": "2026-01-15", "year": "2025-2026", "sem_num": 1, "curr": 0, "status": "COMPLETED"},
    {"id": 6, "code": "HK2-2025", "name": "Học kỳ 2 (2025-2026)", "start": "2026-02-01", "end": "2026-06-30", "year": "2025-2026", "sem_num": 2, "curr": 0, "status": "COMPLETED"},
    {"id": 7, "code": "HK1-2026", "name": "Học kỳ 1 (2026-2027)", "start": "2026-09-01", "end": "2027-01-15", "year": "2026-2027", "sem_num": 1, "curr": 1, "status": "ACTIVE"}
]

# Import verified SUBJECTS, PREREQUISITES, and MAJOR_ROADMAP
from scripts.generate_curriculum_catalog import SUBJECTS, PREREQUISITES, MAJOR_ROADMAP
