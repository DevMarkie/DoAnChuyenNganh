-- Normalize curriculum block names for databases created from the original
-- ASCII-only academic structure migration.
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
END
WHERE code IN ('GDDC', 'CSNG', 'CN', 'TN', 'TNK', 'TC01', 'TC02', 'TC03', 'TC04', 'TC05', 'TC06', 'TC07');
