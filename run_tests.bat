@echo off
chcp 65001 >nul
title Kiểm Thử Toàn Diện Hệ Thống (Deep System Testing)

echo ======================================================================
echo    CHẠY BỘ TEST CASE KIỂM THỬ MỌI TRƯỜNG HỢP (DEEP TESTING)
echo ======================================================================
echo.

:: 1. Kiểm tra Backend đã chạy trên cổng 8080 chưa
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Cảnh báo] Backend chưa bật trên cổng 8080.
    echo Vui lòng chạy file start_dev.bat trước để khởi động Backend!
    echo.
    pause
    exit /b 1
)

echo [✓] Backend đang hoạt động trên cổng 8080.
echo.
echo Bạn muốn chạy bộ kiểm thử nào?
echo [1] Bộ Kiểm Thử Toàn Diện Mọi Trường Hợp (56 Test Cases: SQLi, XSS, RBAC, BR)
echo [2] Bộ Kiểm Thử Áp Lực Quá Tải Chuyên Sâu (Overload, Stress, Concurrency, HikariCP)
echo [3] Bộ Kiểm Thử Nghiệp Vụ Cơ Bản (39 Test Cases)
echo.
set /p TEST_CHOICE="Nhập lựa chọn [Mặc định: 1]: "

if "%TEST_CHOICE%"=="" set TEST_CHOICE=1

if "%TEST_CHOICE%"=="2" (
    echo.
    echo Đang chạy bộ kiểm thử áp lực quá tải (Overload & Stress Test)...
    node "%~dp0tests\overload_stress_test.js"
) else if "%TEST_CHOICE%"=="3" (
    echo.
    echo Đang chạy bộ kiểm thử cơ bản (39 test cases)...
    node "%~dp0tests\system_e2e_test.js"
) else (
    echo.
    echo Đang chạy bộ kiểm thử toàn diện mọi trường hợp (56 test cases)...
    node "%~dp0tests\comprehensive_system_test.js"
)

echo.
echo ======================================================================
echo Báo cáo chi tiết đã lưu trong thư mục tests/
echo ======================================================================
pause
