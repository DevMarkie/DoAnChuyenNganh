@echo off
chcp 65001 >nul
title Đẩy Mã Nguồn Lên GitHub & Tự Động Deploy
color 0A

echo ======================================================================
echo    ĐẨY DỰ ÁN LÊN GITHUB & TỰ ĐỘNG DEPLOY (GITHUB PAGES)
echo    Dự án: DevMarkie/DoAnChuyenNganh
echo ======================================================================
echo.

:: 1. Kiểm tra git
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Lỗi] Máy tính chưa cài Git hoặc chưa thêm vào PATH.
    pause
    exit /b 1
)

echo [1/3] Đang gom toàn bộ file mã nguồn mới nhất...
git add .

echo [2/3] Đang tạo bản ghi commit...
set COMMIT_MSG=Hoan thien du an, bao mat, bo test toan dien va cau hinh deploy GitHub
git commit -m "%COMMIT_MSG%"

echo.
echo [3/3] Đang đẩy lên GitHub (git push origin main)...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo  CHÚC MỪNG! MÃ NGUỒN ĐÃ ĐƯỢC ĐẨY LÊN GITHUB THÀNH CÔNG!
    echo ======================================================================
    echo.
    echo 📌 Để trang web tự động chạy trên GitHub Pages:
    echo 1. Mở link cài đặt: https://github.com/DevMarkie/DoAnChuyenNganh/settings/pages
    echo 2. Tại mục "Build and deployment" ^> "Source":
    echo    Chọn: "GitHub Actions" (Khuyên dùng - Đã có sẵn workflow tự động)
    echo.
    echo 🌐 Sau 1 phút, trang web của bạn sẽ công khai tại:
    echo    👉 https://devmarkie.github.io/DoAnChuyenNganh/
    echo ======================================================================
) else (
    echo.
    echo [Cảnh báo] Lệnh push chưa thành công. Vui lòng kiểm tra quyền đăng nhập tài khoản GitHub trên máy!
)

echo.
pause
