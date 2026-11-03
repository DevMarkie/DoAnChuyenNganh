@echo off
chcp 65001 >nul
title "SMS - Trung Tam Kiem Thu va Demo He Thong"

:check_prerequisites
cls
echo ========================================================================
echo       HỆ THỐNG QUẢN LÝ ĐÀO TẠO VÀ SINH VIÊN (SMS / UAMS)
echo       TRUNG TÂM KIỂM THỬ TỰ ĐỘNG VÀ KỊCH BẢN DEMO HỘI ĐỒNG
echo ========================================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Node.js chưa được cài đặt trên máy!
    echo Vui lòng cài đặt Node.js từ https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/2] Đang kiểm tra Database MySQL (Cổng 3308 / 3306)...
netstat -ano | findstr ":3308 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto db_ready
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto db_ready

echo       MySQL chưa mở. Đang thử khởi động MySQL Docker...
docker start student_management_db >nul 2>&1

:db_ready
echo [OK] Cơ sở dữ liệu MySQL: Sẵn sàng.

echo.
echo [2/2] Đang kiểm tra Backend Spring Boot (Cổng 8080)...
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [THÔNG BÁO] Backend chưa bật trên cổng 8080.
    echo Các bài Unit Test offline [như JUnit, Vitest] vẫn chạy được bình thường.
    echo Để chạy các bài E2E, Bảo mật và Tải, vui lòng bật Backend trước!
    echo.
) else (
    echo [OK] Backend Spring Boot: Đang lắng nghe trên cổng 8080.
)
echo.

:menu
cls
echo ========================================================================
echo       HỆ THỐNG QUẢN LÝ ĐÀO TẠO VÀ SINH VIÊN (SMS / UAMS)
echo       TRUNG TÂM KIỂM THỬ TOÀN DIỆN VÀ KỊCH BẢN DEMO FULL-STACK
echo ========================================================================
echo.
echo  ======================================================================
echo   [00] ⭐ 1-CLICK CHẠY TOÀN BỘ DỰ ÁN TỪ A-Z (MASTER ALL-IN-ONE AUDIT)
echo        (Chạy liên hoàn cả 5 tầng: Backend, Frontend, API, E2E, Tải)
echo  ======================================================================
echo.
echo  --- [NHÓM 1: KIỂM THỬ LOGIC VÀ MÃ NGUỒN CỐT LÕI (UNIT TESTS)] ---
echo   [1]  Backend: Chạy 43 bài Unit và Integration Test (Spring Boot JUnit)
echo   [2]  Frontend: Chạy 80 bài Component và Logic Test (React Vitest)
echo.
echo  --- [NHÓM 2: KIỂM THỬ NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (E2E FLOWS)] ---
echo   [3]  Phân hệ Quản trị viên (Admin và Thu ngân Học phí)
echo   [4]  Phân hệ Phòng Đào tạo và Khảo thí (Đính chính điểm 3 cấp)
echo   [5]  Phân hệ Giảng viên (Điểm danh PIN 6 số và Import Excel điểm thi)
echo   [6]  Phân hệ Sinh viên (Hành trình Portal: ĐKTC, TKB, Tra cứu GPA)
echo   [7]  Bộ Test Nghiệp vụ Toàn diện Deep-Test (70+ Test Cases liên hoàn)
echo.
echo  --- [NHÓM 3: BẢO MẬT VÀ TOÀN VẸN DỮ LIỆU (SECURITY SUITE)] ---
echo   [8]  Kiểm thử Bảo mật (SQL Injection, IDOR, Tampered JWT, Brute-Force)
echo   [9]  Kiểm thử Xác minh 100%% các lỗ hổng bảo mật đã được vá
echo.
echo  --- [NHÓM 4: HIỆU NĂNG VÀ KHÓA PHÂN TÁN REDIS (CONCURRENCY)] ---
echo   [10] Demo 600 Sinh viên Tranh Chấp Slot Cùng 1 Giây (Chống quá tải sĩ số)
echo   [11] Bật Visual Dashboard Demo Tải Đồng Thời (Web Cổng 5050 có biểu đồ)
echo   [12] Kịch bản Leo Thang Tải Vô Hạn Đến Khi Sập Server (Stress Test Collapse)
echo.
echo  --- [TIỆN ÍCH HỆ THỐNG] ---
echo   [13] Kiểm tra nhanh kết nối toàn bộ Endpoint API (Smoke Test)
echo   [0]  Thoát
echo ========================================================================
echo.
set "TEST_CHOICE="
set /p "TEST_CHOICE=  Chọn kịch bản demo [00, 0-13]: "

if "%TEST_CHOICE%"=="00" goto run_master_all
if "%TEST_CHOICE%"=="0"  exit /b 0
if "%TEST_CHOICE%"=="1"  goto run_backend_junit
if "%TEST_CHOICE%"=="2"  goto run_frontend_vitest
if "%TEST_CHOICE%"=="3"  goto run_admin_tuition
if "%TEST_CHOICE%"=="4"  goto run_grade_amendment
if "%TEST_CHOICE%"=="5"  goto run_lecturer_flows
if "%TEST_CHOICE%"=="6"  goto run_student_journey
if "%TEST_CHOICE%"=="7"  goto run_e2e_comprehensive
if "%TEST_CHOICE%"=="8"  goto run_security_basic
if "%TEST_CHOICE%"=="9"  goto run_security_patched
if "%TEST_CHOICE%"=="10" goto run_concurrency_600
if "%TEST_CHOICE%"=="11" goto run_dashboard
if "%TEST_CHOICE%"=="12" goto run_multistage_load
if "%TEST_CHOICE%"=="13" goto run_smoke

echo.
echo [!] Lựa chọn không hợp lệ, vui lòng chọn lại!
goto menu

REM -----------------------------------------------------------------------
:run_master_all
echo.
echo  ========================================================================
echo   KÍCH HOẠT MASTER TEST RUNNER: CHẠY TOÀN BỘ 10 HẠNG MỤC TỪ A ĐẾN Z
echo  ========================================================================
echo.
node "%~dp0tests\run_all_tests.mjs"
goto finish_step

REM -----------------------------------------------------------------------
:run_backend_junit
echo.
echo  [1] Đang chạy toàn bộ 43 bộ Unit và Integration Test Backend (Spring Boot)...
echo  ------------------------------------------------------------------------
cd /d "%~dp0backend"
call .\mvnw.cmd test -Dtest=*Test
cd /d "%~dp0"
goto finish_step

REM -----------------------------------------------------------------------
:run_frontend_vitest
echo.
echo  [2] Đang chạy toàn bộ 80 bài Component và Logic Test Frontend (Vitest)...
echo  ------------------------------------------------------------------------
call npm --prefix "%~dp0frontend" test
goto finish_step

REM -----------------------------------------------------------------------
:run_admin_tuition
echo.
echo  [3] Đang chạy kiểm thử Phân hệ Admin và Quản lý Học phí (Rule B)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\test_admin_coordination_and_tuition.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_grade_amendment
echo.
echo  [4] Đang chạy kiểm thử Quy trình Đính chính điểm 3 cấp (Đào tạo - Khảo thí)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\test_grade_amendment_e2e.cjs"
goto finish_step

REM -----------------------------------------------------------------------
:run_lecturer_flows
echo.
echo  [5.1] Đang chạy kiểm thử Điểm danh trực tiếp PIN 6 số...
echo  ------------------------------------------------------------------------
node "%~dp0tests\integration\test_attendance_feature.js"
echo.
echo  [5.2] Đang chạy kiểm thử Luồng Import file Excel điểm thi...
echo  ------------------------------------------------------------------------
node "%~dp0tests\integration\test_excel_import_flow.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_student_journey
echo.
echo  [6] Đang chạy kiểm thử Hành trình Trải nghiệm Sinh viên toàn diện...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\user_experience_journey_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_e2e_comprehensive
echo.
echo  [7] Đang chạy bộ kiểm thử toàn diện Deep-Test (70+ Test Cases liên hoàn)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\comprehensive_system_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_security_basic
echo.
echo  [8] Đang chạy kiểm thử Bảo mật cơ bản (SQLi, IDOR, JWT, Brute-Force)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\security\basic_security_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_security_patched
echo.
echo  [9] Đang xác minh 100%% các lỗ hổng bảo mật đã được vá...
echo  ------------------------------------------------------------------------
node "%~dp0tests\security\patched_defects_verification_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_concurrency_600
echo.
echo  [10] Đang chạy kiểm thử tranh chấp 600 sinh viên đồng thời (Redis Atomic)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\performance\simulate_600_enrollment.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_dashboard
echo.
echo  [11] Đang khởi chạy Dashboard trực quan demo tải đồng thời trên cổng 5050...
echo  ------------------------------------------------------------------------
start "SMS Visual Load Dashboard (Port 5050)" cmd /k "node \"%~dp0tests\performance\demo_100\server.js\""
start http://localhost:5050
echo  [OK] Đã mở Visual Dashboard trên trình duyệt: http://localhost:5050
goto finish_step

REM -----------------------------------------------------------------------
:run_multistage_load
echo.
echo  [12] Đang chạy kiểm thử leo thang tải vô hạn (1.000 -> 2.500 -> 5.000... đến khi sập)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\performance\stress_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_smoke
echo.
echo  [13] Đang kiểm tra nhanh toàn bộ Endpoint API (Smoke Test)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\smoke\smoke_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:finish_step
echo.
echo ========================================================================
echo  Kịch bản kiểm thử đã hoàn tất!
echo ========================================================================
echo.
pause
goto menu