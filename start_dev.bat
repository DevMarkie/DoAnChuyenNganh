@echo off
chcp 65001 >nul
title Khởi chạy Hệ Thống Quản Lý Sinh Viên

echo ======================================================================
echo    HỆ THỐNG QUẢN LÝ SINH VIÊN (SMS) - KHỞI CHẠY PHÁT TRIỂN & NỘI BỘ
echo ======================================================================
echo.

:: 1. Kiểm tra & khởi động MySQL Database Container
echo [1/3] Đang kiểm tra Database Container...
docker inspect student_management_db >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [MySQL] Container chưa tồn tại, đang tạo và chạy qua docker-compose...
    docker compose up -d db
) else (
    docker ps -q -f name=student_management_db | findstr . >nul
    if %ERRORLEVEL% NEQ 0 (
        echo [MySQL] Đang khởi động container student_management_db...
        docker start student_management_db
    ) else (
        echo [MySQL] Database đã sẵn sàng trên cổng 3308.
    )
)

:: 2. Khởi chạy Backend trong cửa sổ riêng
echo.
echo [2/3] Đang khởi chạy Spring Boot Backend (Cổng 8080)...
start "SMS Backend (Spring Boot 8080)" cmd /k "cd /d "%~dp0backend" && .\mvnw.cmd spring-boot:run"

:: 3. Khởi chạy Frontend trong cửa sổ riêng
echo.
echo [3/3] Đang khởi chạy React Frontend (Cổng 5173)...
start "SMS Frontend (React Vite 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ======================================================================
echo                     HỆ THỐNG ĐANG ĐƯỢC KHỞI ĐỘNG!
echo ======================================================================
echo.
echo 💻 TRUY CẬP TRÊN MÁY NÀY:
echo    - Frontend App:   http://localhost:5173
echo    - Backend API:    http://localhost:8080/api
echo    - Swagger Docs:   http://localhost:8080/swagger-ui.html
echo.
echo 📱 TRUY CẬP TỪ THIẾT BỊ KHÁC TRONG MẠNG LAN / CÙNG WI-FI:
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set LOCAL_IP=%%a
    goto :ip_found
)
:ip_found
echo    - Mở trình duyệt trên điện thoại/laptop khác gõ:
echo      http://%LOCAL_IP%:5173
echo.
echo 🔑 TÀI KHOẢN MẪU:
echo    + Admin:       admin    / 123456
echo    + Giảng viên:  1000001  / 123456
echo    + Sinh viên:   2500001  / 123456
echo.
echo 🌐 Để chia sẻ link ra toàn Internet cho mọi người truy cập:
echo    Chạy file: share_internet.bat
echo ======================================================================
pause
