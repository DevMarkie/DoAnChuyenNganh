USE student_management;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. DEPARTMENTS
UPDATE departments SET name = 'Khoa Công nghệ Thông tin & Máy tính', description = 'Đào tạo Trí tuệ nhân tạo, Khoa học dữ liệu, Kỹ thuật phần mềm, An ninh mạng và Thiết kế vi mạch bán dẫn' WHERE code = 'CNTT';
UPDATE departments SET name = 'Khoa Kinh tế & Quản trị Kinh doanh', description = 'Đào tạo Logistics, Quản lý chuỗi cung ứng, Thương mại điện tử, Digital Marketing, Phân tích kinh doanh và Fintech' WHERE code = 'KT_QTKD';
UPDATE departments SET name = 'Khoa Kỹ thuật & Công nghệ Tự động', description = 'Đào tạo Kỹ thuật Cơ điện tử, Robotics, Công nghệ Kỹ thuật Ô tô điện và Năng lượng tái tạo' WHERE code = 'KT_TDH';
UPDATE departments SET name = 'Khoa Cơ khí & Công nghệ Ô tô', description = 'Đào tạo Kỹ thuật Cơ khí, Cơ điện tử, Công nghệ Ô tô và Chế tạo máy' WHERE code = 'COKHI';
UPDATE departments SET name = 'Khoa Ngoại ngữ', description = 'Đào tạo Ngôn ngữ Anh, Trung, Hàn, Nhật thương mại, Biên phiên dịch và Tiếng Anh chuyên ngành' WHERE code = 'NN';
UPDATE departments SET name = 'Khoa Kế toán - Kiểm toán', description = 'Đào tạo Kế toán doanh nghiệp, Kiểm toán tài chính, Thuế và Kế toán công' WHERE code = 'KT';
UPDATE departments SET name = 'Khoa Luật & Quốc tế học', description = 'Đào tạo Luật kinh tế, Luật thương mại quốc tế và Quan hệ quốc tế' WHERE code = 'LUAT';
UPDATE departments SET name = 'Khoa Kỹ thuật Xây dựng', description = 'Đào tạo Kỹ thuật công trình xây dựng, Quản lý dự án xây dựng và Hạ tầng thông minh' WHERE code = 'XD';
UPDATE departments SET name = 'Khoa Y Dược', description = 'Đào tạo Y đa khoa, Dược học, Điều dưỡng và Kỹ thuật xét nghiệm y học' WHERE code = 'YD';

-- 2. MAJORS
UPDATE majors SET name = 'Công nghệ thông tin', description = 'Kỹ thuật phần mềm, trí tuệ nhân tạo, an toàn thông tin' WHERE code = 'CNTT';
UPDATE majors SET name = 'Quản trị kinh doanh', description = 'Quản trị doanh nghiệp, marketing và thương mại điện tử' WHERE code = 'QTKD';
UPDATE majors SET name = 'Điện - Điện tử', description = 'Điện tử viễn thông, điều khiển và hệ thống nhúng' WHERE code = 'DTVT';
UPDATE majors SET name = 'Cơ khí', description = 'Cơ điện tử, kỹ thuật ô tô và chế tạo máy' WHERE code = 'CK';
UPDATE majors SET name = 'Ngoại ngữ', description = 'Ngôn ngữ Anh, Nhật và biên phiên dịch' WHERE code = 'NN';
UPDATE majors SET name = 'Kế toán - Kiểm toán', description = 'Kế toán tài chính và kiểm toán' WHERE code = 'KT';
UPDATE majors SET name = 'Luật', description = 'Luật kinh tế và pháp luật công' WHERE code = 'LUAT';
UPDATE majors SET name = 'Kỹ thuật Xây dựng', description = 'Kỹ thuật xây dựng và quản lý công trình' WHERE code = 'XD';
UPDATE majors SET name = 'Y Dược', description = 'Y khoa, dược học và chăm sóc sức khỏe' WHERE code = 'YD';
UPDATE majors SET name = 'Du lịch', description = 'Quản trị du lịch, khách sạn và dịch vụ' WHERE code = 'DL';
UPDATE majors SET name = 'Truyền thông', description = 'Truyền thông số, báo chí và quan hệ công chúng' WHERE code = 'TT';
UPDATE majors SET name = 'Khoa học Xã hội', description = 'Tâm lý, xã hội học và quản trị nhân lực' WHERE code = 'XH';
UPDATE majors SET name = 'Ngôn ngữ', description = 'Ngôn ngữ ứng dụng và giao tiếp liên văn hóa' WHERE code = 'NNG';

-- 3. COHORTS
UPDATE cohorts SET name = 'Khóa 16' WHERE code = 'K16';
UPDATE cohorts SET name = 'Khóa 17' WHERE code = 'K17';
UPDATE cohorts SET name = 'Khóa 18' WHERE code = 'K18';
UPDATE cohorts SET name = 'Khóa 19' WHERE code = 'K19';

-- 4. CURRICULUM PROGRAMS
UPDATE curriculum_programs p
JOIN majors m ON p.major_id = m.id
JOIN cohorts c ON p.cohort_id = c.id
SET p.name = CONCAT('Chương trình đào tạo ', m.name, ' - ', c.name);

-- 5. CURRICULUM BLOCKS
UPDATE curriculum_blocks
SET name = CASE code
    WHEN 'GDDC' THEN 'Khối kiến thức giáo dục đại cương'
    WHEN 'CSNG' THEN 'Khối kiến thức cơ sở ngành'
    WHEN 'CN' THEN 'Khối kiến thức chuyên ngành'
    WHEN 'TN' THEN 'Thực tập'
    WHEN 'TNK' THEN 'Khóa luận tốt nghiệp'
    WHEN 'TC01' THEN 'Giáo dục thể chất'
    WHEN 'TC02' THEN 'Giáo dục quốc phòng - an ninh'
    WHEN 'TC03' THEN 'Khối kiến thức bổ trợ'
    WHEN 'TC04' THEN 'Khối kiến thức điều kiện'
    WHEN 'TC05' THEN 'Khối kiến thức chuyên ngành tự chọn 1'
    WHEN 'TC06' THEN 'Khối kiến thức chuyên ngành tự chọn 2'
    WHEN 'TC07' THEN 'Đồ án/Khóa luận tốt nghiệp tự chọn'
    ELSE name
END;

-- 6. SUBJECTS (37 subjects)
UPDATE subjects SET subject_name = 'Giải tích 1', description = 'Giới hạn, đạo hàm, vi phân và tích phân hàm một biến' WHERE subject_code = 'MATH101';
UPDATE subjects SET subject_name = 'Đại số tuyến tính', description = 'Ma trận, định thức, hệ phương trình tuyến tính và không gian vector' WHERE subject_code = 'MATH102';
UPDATE subjects SET subject_name = 'Vật lý đại cương 1', description = 'Cơ học, nhiệt học và điện từ học cơ bản' WHERE subject_code = 'PHYS101';
UPDATE subjects SET subject_name = 'Triết học Mác - Lênin', description = 'Những nguyên lý cơ bản của triết học Mác - Lênin' WHERE subject_code = 'PHIL101';
UPDATE subjects SET subject_name = 'Pháp luật đại cương', description = 'Những vấn đề cơ bản về nhà nước và pháp luật Việt Nam' WHERE subject_code = 'LAW101';
UPDATE subjects SET subject_name = 'Nhập môn lập trình', description = 'Tư duy thuật toán và lập trình căn bản' WHERE subject_code = 'CS101';
UPDATE subjects SET subject_name = 'Lập trình hướng đối tượng', description = 'Lập trình hướng đối tượng, kế thừa và đa hình' WHERE subject_code = 'CS201';
UPDATE subjects SET subject_name = 'Cơ sở dữ liệu', description = 'Mô hình quan hệ, chuẩn hóa và truy vấn SQL' WHERE subject_code = 'CS202';
UPDATE subjects SET subject_name = 'Cấu trúc dữ liệu và giải thuật', description = 'Cấu trúc dữ liệu, thuật toán tìm kiếm và sắp xếp' WHERE subject_code = 'CS203';
UPDATE subjects SET subject_name = 'Phát triển ứng dụng Web', description = 'Kiến trúc và phát triển ứng dụng Web' WHERE subject_code = 'CS301';
UPDATE subjects SET subject_name = 'Mạng máy tính', description = 'Mô hình mạng, giao thức TCP/IP và định tuyến' WHERE subject_code = 'CS302';
UPDATE subjects SET subject_name = 'Trí tuệ nhân tạo', description = 'Các phương pháp tìm kiếm, học máy và mạng nơ-ron' WHERE subject_code = 'CS303';
UPDATE subjects SET subject_name = 'Công nghệ phần mềm', description = 'Phân tích, thiết kế và quản lý quy trình phát triển phần mềm' WHERE subject_code = 'CS304';
UPDATE subjects SET subject_name = 'Kiểm thử phần mềm', description = 'Kỹ thuật và quy trình kiểm thử phần mềm' WHERE subject_code = 'CS305';
UPDATE subjects SET subject_name = 'An toàn thông tin', description = 'Mật mã, an ninh mạng và an toàn ứng dụng' WHERE subject_code = 'CS401';
UPDATE subjects SET subject_name = 'Kiến trúc và thiết kế phần mềm', description = 'Kiến trúc hệ thống, mẫu thiết kế và thiết kế phần mềm' WHERE subject_code = 'CS402';
UPDATE subjects SET subject_name = 'DevOps và điện toán đám mây', description = 'Tích hợp liên tục, container và triển khai ứng dụng trên đám mây' WHERE subject_code = 'CS403';
UPDATE subjects SET subject_name = 'Nguyên lý quản trị', description = 'Hoạch định, tổ chức, lãnh đạo và kiểm soát' WHERE subject_code = 'BUS101';
UPDATE subjects SET subject_name = 'Kinh tế vi mô', description = 'Cung cầu, thị trường và hành vi doanh nghiệp' WHERE subject_code = 'ECO101';
UPDATE subjects SET subject_name = 'Kinh tế vĩ mô', description = 'Tăng trưởng, lạm phát, thất nghiệp và chính sách kinh tế' WHERE subject_code = 'ECO102';
UPDATE subjects SET subject_name = 'Marketing căn bản', description = 'Hành vi khách hàng, sản phẩm, giá và truyền thông' WHERE subject_code = 'MKT201';
UPDATE subjects SET subject_name = 'Kế toán tài chính 1', description = 'Nguyên lý kế toán và lập báo cáo tài chính' WHERE subject_code = 'ACC201';
UPDATE subjects SET subject_name = 'Tài chính doanh nghiệp', description = 'Giá trị thời gian của tiền và quyết định đầu tư' WHERE subject_code = 'FIN301';
UPDATE subjects SET subject_name = 'Quản trị nguồn nhân lực', description = 'Tuyển dụng, đào tạo, đánh giá và đãi ngộ' WHERE subject_code = 'HRM301';
UPDATE subjects SET subject_name = 'Mạch điện 1', description = 'Mạch điện một chiều, xoay chiều và các định luật cơ bản' WHERE subject_code = 'EE101';
UPDATE subjects SET subject_name = 'Kỹ thuật điện tử', description = 'Linh kiện bán dẫn, mạch khuếch đại và mạch số' WHERE subject_code = 'EE201';
UPDATE subjects SET subject_name = 'Điều khiển tự động', description = 'Mô hình hóa, hàm truyền và bộ điều khiển PID' WHERE subject_code = 'EE202';
UPDATE subjects SET subject_name = 'Đo lường và cảm biến', description = 'Đo lường điện và cảm biến trong hệ thống kỹ thuật' WHERE subject_code = 'EE301';
UPDATE subjects SET subject_name = 'Hệ thống nhúng và Internet vạn vật', description = 'Vi điều khiển, giao thức kết nối và ứng dụng IoT' WHERE subject_code = 'EE302';
UPDATE subjects SET subject_name = 'Cơ học kỹ thuật', description = 'Tĩnh học, động học và động lực học cơ hệ' WHERE subject_code = 'ME101';
UPDATE subjects SET subject_name = 'Vẽ kỹ thuật và CAD', description = 'Tiêu chuẩn bản vẽ kỹ thuật và thiết kế hỗ trợ máy tính' WHERE subject_code = 'ME201';
UPDATE subjects SET subject_name = 'Động cơ đốt trong', description = 'Nguyên lý, kết cấu và hệ thống của động cơ đốt trong' WHERE subject_code = 'ME202';
UPDATE subjects SET subject_name = 'Sức bền vật liệu', description = 'Ứng suất, biến dạng và tính bền kết cấu' WHERE subject_code = 'ME301';
UPDATE subjects SET subject_name = 'Công nghệ chế tạo máy', description = 'Quy trình gia công và công nghệ CNC' WHERE subject_code = 'ME302';
UPDATE subjects SET subject_name = 'Tiếng Anh 1', description = 'Kỹ năng tiếng Anh nền tảng trong môi trường đại học' WHERE subject_code = 'ENG101';
UPDATE subjects SET subject_name = 'Tiếng Anh chuyên ngành Công nghệ thông tin', description = 'Thuật ngữ và đọc hiểu tài liệu công nghệ thông tin' WHERE subject_code = 'ENG201';
UPDATE subjects SET subject_name = 'Tiếng Anh chuyên ngành Kỹ thuật', description = 'Tiếng Anh chuyên ngành kỹ thuật và công nghệ' WHERE subject_code = 'ENG202';
