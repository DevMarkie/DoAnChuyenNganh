-- Replace CRUD-test department names with real academic departments.
-- IDs remain unchanged so existing scale-data foreign keys stay valid.
USE student_management;
START TRANSACTION;

INSERT IGNORE INTO departments (id, code, name, description) VALUES
	(6, 'KETOAN', 'Khoa Ke toan - Kiem toan', 'Dao tao ke toan, kiem toan va phan tich tai chinh'),
	(7, 'LUAT', 'Khoa Luat', 'Dao tao phap luat kinh te va quan tri cong'),
	(8, 'XAYDUNG', 'Khoa Ky thuat Xay dung', 'Dao tao ky thuat xay dung va quan ly cong trinh'),
	(9, 'YDUOC', 'Khoa Y Duoc', 'Dao tao y khoa, duoc hoc va cham soc suc khoe'),
	(10, 'DULICH', 'Khoa Du lich', 'Dao tao quan tri du lich, khach san va dich vu'),
	(11, 'TRUYEN', 'Khoa Truyen thong', 'Dao tao truyen thong so, bao chi va quan he cong chung'),
	(12, 'KHXH', 'Khoa Khoa hoc Xa hoi', 'Dao tao tam ly, xa hoi hoc va quan tri nhan luc'),
	(13, 'NGONNGU', 'Khoa Ngon ngu', 'Dao tao ngon ngu Anh, Nhat va cac ngon ngu ung dung');

UPDATE departments SET code='KETOAN', name='Khoa Kế toán - Kiểm toán', description='Đào tạo kế toán, kiểm toán và phân tích tài chính' WHERE id=6;
UPDATE departments SET code='LUAT', name='Khoa Luật', description='Đào tạo Luật kinh tế và pháp luật' WHERE id=7;
UPDATE departments SET code='XAYDUNG', name='Khoa Kỹ thuật xây dựng', description='Đào tạo kỹ thuật xây dựng và quản lý công trình' WHERE id=8;
UPDATE departments SET code='YDUOC', name='Khoa Dược', description='Đào tạo Dược học và nghiên cứu phát triển thuốc' WHERE id=9;
UPDATE departments SET code='DL', name='Khoa Du lịch - Khách sạn', description='Đào tạo quản trị du lịch, khách sạn và dịch vụ' WHERE id=10;
UPDATE departments SET code='TRUYEN', name='Khoa Truyền thông và Khoa học xã hội', description='Đào tạo truyền thông đa phương tiện và quan hệ công chúng' WHERE id=11;
UPDATE departments SET code='SH', name='Khoa Sinh học - Hóa học - Công nghệ thực phẩm', description='Đào tạo công nghệ sinh học, hóa học và công nghệ thực phẩm' WHERE id=12;
UPDATE departments SET code='NN', name='Khoa Ngoại ngữ', description='Đào tạo Ngôn ngữ Anh và tiếng Anh chuyên ngành' WHERE id=13;

COMMIT;
