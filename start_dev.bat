@echo off
chcp 65001 >nul
title Khởi chạy Hệ Thống Quản Lý Sinh Viên

echo ======================================================================
echo    HỆ THỐNG QUẢN LÝ SINH VIÊN (SMS) - KHỞI CHẠY PHÁT TRIỂN ^& NỘI BỘ
echo ======================================================================
echo.

:: 1. Kiểm tra & xác định MySQL Database
echo [1/3] Đang kiểm tra kết nối Database MySQL...
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [MySQL] Phát hiện MySQL Database cục bộ đang chạy trên cổng 3306.
    set "SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/student_management?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8"
    goto :db_ready
)

netstat -ano | findstr ":3308 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [MySQL] Phát hiện MySQL Docker Container đang chạy trên cổng 3308.
    set "SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3308/student_management?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8"
    goto :db_ready
)

:: Nếu chưa có port nào mở, thử bật service MySQL80 cục bộ
echo [MySQL] Đang kiểm tra khởi động dịch vụ MySQL80...
net start MySQL80 >nul 2>&1
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [MySQL] Khởi động MySQL80 thành công trên cổng 3306.
    set "SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/student_management?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8"
    goto :db_ready
)

:: Nếu không có MySQL cục bộ, thử qua Docker
echo [MySQL] Thử khởi động qua Docker...
docker start student_management_db >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    docker compose up -d db >nul 2>&1
)
set "SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3308/student_management?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8"

:db_ready
echo [MySQL] Sẵn sàng kết nối cơ sở dữ liệu.

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
