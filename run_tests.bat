@echo off
chcp 65001 >nul
title Kiem Thu He Thong SMS (System Test Runner)

echo ======================================================================
echo    CHẠY BỘ TEST CASE KIỂM THỬ HỆ THỐNG (SYSTEM TESTING)
echo ======================================================================
echo.

REM 1. Kiem tra Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Lỗi] Không tìm thấy Node.js trên máy tính!
    echo Vui lòng cài đặt Node.js từ https://nodejs.org để thực thi kiểm thử.
    echo.
    pause
    exit /b 1
)

REM 2. Kiem tra va Tu dong khoi dong MySQL neu chua chay
echo [1/3] Đang kiểm tra trạng thái Cơ sở dữ liệu MySQL...
netstat -ano | findstr ":3308 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto db_ready

netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto db_ready

echo [MySQL] Database chưa chạy. Đang tự động bật container MySQL...
docker start student_management_db >nul 2>&1
timeout /t 3 /nobreak >nul

:db_ready
echo [✓] Cơ sở dữ liệu MySQL: Sẵn sàng.

REM 3. Kiem tra Backend cong 8080
echo.
echo [2/3] Đang kiểm tra cổng Backend 8080...
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Cảnh báo] Backend Spring Boot chưa bật trên cổng 8080.
    echo Vui lòng chạy file start_dev.bat trước để khởi động Backend!
    echo.
    pause
    exit /b 1
)
echo [✓] Backend Spring Boot: Đang lắng nghe trên cổng 8080.

REM 4. Kiem tra suc khoe Backend va ket noi Database
echo.
echo [3/3] Đang xác thực kết nối giữa Backend và Database...
node "%~dp0tests\utils\health_check.js" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto health_ready

echo [Cảnh báo] Backend đang bật nhưng chưa thể kết nối tới MySQL!
echo Đang thử kích hoạt lại container student_management_db...
docker start student_management_db >nul 2>&1
timeout /t 3 /nobreak >nul

node "%~dp0tests\utils\health_check.js" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto health_ready

echo [Lỗi] Backend không thể kết nối tới Database MySQL.
echo Vui lòng kiểm tra Docker Desktop hoặc dịch vụ MySQL rồi thử lại!
echo.
pause
exit /b 1

:health_ready
echo [✓] Hệ thống Backend và MySQL hoạt động hoàn hảo, sẵn sàng kiểm thử!
echo.

REM 5. Menu lua chon
echo ======================================================================
echo              CHỌN CHU TRÌNH KIỂM THỬ THEO CHU KỲ RELEASE
echo ======================================================================
echo [1] 💨 SMOKE TEST: Kiểm thử nhanh sau deploy (< 30s, 10 Luồng Cốt Lõi)
echo [2] 🛡️ REGRESSION TEST: Kiểm thử hồi quy toàn diện (56 Cases: RBAC, SQLi, BR)
echo [3] ⚡ PERFORMANCE REGRESSION: Kiểm thử tải tranh chấp (600 SV Concurrency)
echo [4] 🚀 FULL RELEASE AUDIT: Chạy toàn bộ chu trình (Smoke -> Regression)
echo [5] 📋 Kiểm thử API & Toàn vẹn CSDL (46 Test Cases: Mã 200/400/500, Schema & DB CRUD)
echo [6] 🔒 BASIC SECURITY AUDIT: Kiểm thử Bảo mật cơ bản (26 Cases)
echo [0] Thoát
echo ======================================================================
echo.
set /p TEST_CHOICE="Nhập lựa chọn của bạn [Mặc định: 1]: "

if defined TEST_CHOICE set TEST_CHOICE=%TEST_CHOICE: =%
if "%TEST_CHOICE%"=="" set TEST_CHOICE=1
if "%TEST_CHOICE%"=="0" exit /b 0
if "%TEST_CHOICE%"=="1" goto run_smoke
if "%TEST_CHOICE%"=="2" goto run_comprehensive
if "%TEST_CHOICE%"=="3" goto run_overload
if "%TEST_CHOICE%"=="4" goto run_release_audit
if "%TEST_CHOICE%"=="5" goto run_basic
if "%TEST_CHOICE%"=="6" goto run_security
goto run_smoke

:run_smoke
echo.
echo Đang chạy bộ kiểm thử khói [Smoke Test Gate < 30s]...
node "%~dp0tests\smoke\smoke_test.js"
goto finish

:run_overload
echo.
echo Đang chạy bộ kiểm thử áp lực quá tải [Overload and Stress Test]...
node "%~dp0tests\performance\overload_stress_test.js"
goto finish

:run_basic
echo.
echo Đang chạy bộ kiểm thử API & Toàn vẹn CSDL [46 test cases: Mã 200/400/500, Schema, DB CRUD]...
node "%~dp0tests\e2e\system_e2e_test.js"
goto finish

:run_comprehensive
echo.
echo Đang chạy bộ kiểm thử hồi quy toàn diện [56 test cases]...
node "%~dp0tests\e2e\comprehensive_system_test.js"
goto finish

:run_security
echo.
echo Đang chạy bộ kiểm thử bảo mật cơ bản [26 test cases: Password/Token, IDOR, SQLi/XSS]...
node "%~dp0tests\security\basic_security_test.js"
goto finish

:run_release_audit
echo.
echo ======================================================================
echo [BƯỚC 1/2] Đang kích hoạt SMOKE TEST GATE (Kiểm tra liveness)...
echo ======================================================================
node "%~dp0tests\smoke\smoke_test.js"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [CẢNH BÁO ĐỎ] Smoke Test thất bại! Hủy bỏ chạy Regression Test.
    goto finish
)
echo.
echo ======================================================================
echo [BƯỚC 2/2] Smoke Test Đạt! Tiếp tục chạy REGRESSION TEST SUITE...
echo ======================================================================
node "%~dp0tests\e2e\comprehensive_system_test.js"
goto finish

:finish
echo.
echo ======================================================================
echo Báo cáo chi tiết đã lưu trong thư mục tests/reports/ và tests/results/
echo ======================================================================
pause
