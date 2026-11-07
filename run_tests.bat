@echo off
chcp 65001 >nul
title Trung Tam Kiem Thu Toan Dien He Thong SMS

cd /d "%~dp0"

:: -----------------------------------------------------------------------
:: Kiem tra moi truong Node.js va Backend
:: -----------------------------------------------------------------------
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Khong tim thay Node.js trong PATH!
    echo Vui long cai dat Node.js LTS tu https://nodejs.org/
    pause
    exit /b 1
)

:: Kiem tra Backend co dang chay cong 8080 khong
set "BACKEND_ONLINE=0"
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "BACKEND_ONLINE=1"
)

if "%BACKEND_ONLINE%"=="0" (
    echo.
    echo ========================================================================
    echo  [LUU Y] Backend Spring Boot [cong 8080] hien CHUA DUOC BAT!
    echo  - Ban van co the chay bai [1] JUnit Backend va [2] Vitest Frontend.
    echo  - De chay bai [3] den [15], vui long chay start_dev.bat truoc!
    echo ========================================================================
    echo.
) else (
    echo [OK] Backend Spring Boot: Dang lang nghe tren cong 8080.
)
echo.

:menu
cls
echo ========================================================================
echo       HE THONG QUAN LY DAO TAO VA SINH VIEN (SMS / UAMS)
echo       TRUNG TAM KIEM THU TOAN DIEN VA KICH BAN DEMO FULL-STACK
echo ========================================================================
echo.
echo  ======================================================================
echo   [00] CHAY TOAN BO DU AN TU A-Z (MASTER ALL-IN-ONE AUDIT)
echo        (Chay lien hoan ca 5 tang: Backend, Frontend, API, E2E, Tai, NFR)
echo  ======================================================================
echo.
echo  --- [TANG 1: KIEM THU LOGIC VA MA NGUON COT LOI (UNIT TESTS)] ---
echo   [1]  Backend: Chay 43 bai Unit va Integration Test (Spring Boot JUnit)
echo   [2]  Frontend: Chay 80 bai Component va Logic Test (React Vitest)
echo.
echo  --- [TANG 2: KIEM TRA SUC KHOE API ^& HA TANG (SMOKE TEST)] ---
echo   [3]  Kiem tra nhanh ket noi toan bo Endpoint API (Smoke Test)
echo.
echo  --- [TANG 3: KIEM THU NGHIEP VU LIEN THONG 4 PHAN HE (E2E FLOWS)] ---
echo   [4]  Phan he Quan tri vien (Admin va Thu ngan Hoc phi)
echo   [5]  Phan he Hoc phi, Mien giam, Cong VNPAY va Gach no IPN (Suite 12 E2E)
echo   [6]  Phan he Phong Dao tao va Khao thi (Dinh chinh diem 3 cap)
echo   [7]  Phan he Giang vien (Diem danh PIN 6 so va Import Excel diem thi)
echo   [8]  Phan he Thoi khoa bieu va Lich thi (Chong trung, iCal, Excel, Ca thi)
echo   [9]  Phan he Sinh vien (Hanh trinh Portal: DKTC, TKB, Tra cuu GPA)
echo   [10] Bo Test Nghiep vu Toan dien Deep-Test (70+ Test Cases lien hoan)
echo.
echo  --- [TANG 4: AN NINH VA BAO MAT HE THONG (SECURITY AUDIT)] ---
echo   [11] Kiem thu Bao mat co ban (SQL Injection, IDOR, Tampered JWT, Brute-Force)
echo   [12] Bo Phan quyen va Bao mat Chot (RBAC 5 Roles, IDOR, PII, Session Management)
echo.
echo  --- [TANG 5: HIEU NANG, QUA TAI ^& KHOA PHAN TAN (PERFORMANCE ^& STRESS)] ---
echo   [13] Kiem thu Qua tai ^& Ap luc he thong chuyen sau (Overload ^& Stress Test 5 giai doan)
echo   [14] Demo 600 Sinh vien Tranh Chap Slot Cung 1 Giay (Redis Atomic)
echo   [15] KIEM THU PHI CHUC NANG (4 Tru cot NFR: Tai Dinh, Race 1-Slot, Excel lon, Mobile)
echo.
echo  --- [TIEN ICH HE THONG ^& DEMO TRUC QUAN] ---
echo   [16] Bat Visual Dashboard Demo Tai Dong Thoi (Web Cong 5050 co bieu do)
echo   [17] Kich ban Leo Thang Tai Vo Han Den Khi Sap Server (Stress Test Collapse)
echo   [0]  Thoat
echo ========================================================================
echo.
set "TEST_CHOICE="
set /p "TEST_CHOICE=  Chon kich ban demo [00, 0-17]: "

if "%TEST_CHOICE%"=="00" goto run_master_all
if "%TEST_CHOICE%"=="0"  exit /b 0
if "%TEST_CHOICE%"=="1"  goto run_backend_junit
if "%TEST_CHOICE%"=="2"  goto run_frontend_vitest
if "%TEST_CHOICE%"=="3"  goto run_smoke
if "%TEST_CHOICE%"=="4"  goto run_admin_tuition
if "%TEST_CHOICE%"=="5"  goto run_tuition_vnpay_suite
if "%TEST_CHOICE%"=="6"  goto run_grade_amendment
if "%TEST_CHOICE%"=="7"  goto run_lecturer_flows
if "%TEST_CHOICE%"=="8"  goto run_schedule_and_exam
if "%TEST_CHOICE%"=="9"  goto run_student_journey
if "%TEST_CHOICE%"=="10" goto run_e2e_comprehensive
if "%TEST_CHOICE%"=="11" goto run_security_basic
if "%TEST_CHOICE%"=="12" goto run_security_authorization_final
if "%TEST_CHOICE%"=="13" goto run_overload_stress
if "%TEST_CHOICE%"=="14" goto run_concurrency_600
if "%TEST_CHOICE%"=="15" goto run_non_functional_suite
if "%TEST_CHOICE%"=="16" goto run_dashboard
if "%TEST_CHOICE%"=="17" goto run_multistage_load

echo.
echo [!] Lua chon khong hop le, vui long chon lai!
goto menu

REM -----------------------------------------------------------------------
:run_master_all
echo.
echo  ========================================================================
echo   KICH HOAT MASTER TEST RUNNER: CHAY TOAN BO CAC HANG MUC TU A DEN Z
echo  ========================================================================
echo.
node "%~dp0tests\run_all_tests.mjs"
goto finish_step

REM -----------------------------------------------------------------------
:run_backend_junit
echo.
echo  [1] Dang chay toan bo 43 bo Unit va Integration Test Backend (Spring Boot)...
echo  ------------------------------------------------------------------------
cd /d "%~dp0backend"
call .\mvnw.cmd test -Dtest=*Test
cd /d "%~dp0"
goto finish_step

REM -----------------------------------------------------------------------
:run_frontend_vitest
echo.
echo  [2] Dang chay toan bo 80 bai Component va Logic Test Frontend (Vitest)...
echo  ------------------------------------------------------------------------
call npm --prefix "%~dp0frontend" test
goto finish_step

REM -----------------------------------------------------------------------
:run_smoke
echo.
echo  [3] Dang kiem tra nhanh toan bo Endpoint API (Smoke Test)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\smoke\smoke_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_admin_tuition
echo.
echo  [4] Dang chay kiem thu Phan he Admin va Quan ly Hoc phi (Rule B)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\test_admin_coordination_and_tuition.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_tuition_vnpay_suite
echo.
echo  [5] Dang chay kiem thu Phan he Hoc phi, Mien giam ^& Cong VNPAY (Suite 12)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\test_tuition_and_payment_gateway.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_grade_amendment
echo.
echo  [6] Dang chay kiem thu Quy trinh Dinh chinh diem 3 cap (Dao tao - Khao thi)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\test_grade_amendment_e2e.cjs"
goto finish_step

REM -----------------------------------------------------------------------
:run_lecturer_flows
echo.
echo  [7.1] Dang chay kiem thu Diem danh truc tiep PIN 6 so...
echo  ------------------------------------------------------------------------
node "%~dp0tests\integration\test_attendance_feature.js"
echo.
echo  [7.2] Dang chay kiem thu Luong Import file Excel diem thi...
echo  ------------------------------------------------------------------------
node "%~dp0tests\integration\test_excel_import_flow.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_schedule_and_exam
echo.
echo  [8] Dang chay Kiem thu Phan he Thoi khoa bieu ^& Lich thi (Chong trung, iCal, Excel)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\integration\test_schedule_and_exam_module.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_student_journey
echo.
echo  [9] Dang chay kiem thu Hanh trinh Trai nghiem Sinh vien toan dien...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\user_experience_journey_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_e2e_comprehensive
echo.
echo  [10] Dang chay bo kiem thu toan dien Deep-Test (70+ Test Cases lien hoan)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\e2e\comprehensive_system_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_security_basic
echo.
echo  [11] Dang chay kiem thu Bao mat co ban (SQLi, IDOR, JWT, Brute-Force)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\security\basic_security_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_security_authorization_final
echo.
echo  [12] Dang chay Bo Kiem thu Phan quyen ^& Bao mat Chot (RBAC, IDOR, PII, Session)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\security\final_security_authorization_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_overload_stress
echo.
echo  [13] Dang chay Kiem thu Qua tai ^& Ap luc he thong chuyen sau (5 giai doan)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\performance\overload_stress_test.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_concurrency_600
echo.
echo  [14] Dang chay kiem thu tranh chap 600 sinh vien dong thoi (Redis Atomic)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\performance\simulate_600_enrollment.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_non_functional_suite
echo.
echo  [15] Dang chay Bo Kiem thu Phi chuc nang (4 Tru cot NFR: Tai Dinh, Race 1-Slot, Excel lon, Mobile)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\non_functional\run_all.js"
goto finish_step

REM -----------------------------------------------------------------------
:run_dashboard
echo.
echo  [16] Dang khoi chay Dashboard truc quan demo tai dong thoi tren cong 5050...
echo  ------------------------------------------------------------------------
start "SMS Visual Load Dashboard (Port 5050)" cmd /k "node \"%~dp0tests\performance\demo_100\server.js\""
start http://localhost:5050
echo  [OK] Da mo Visual Dashboard tren trinh duyet: http://localhost:5050
goto finish_step

REM -----------------------------------------------------------------------
:run_multistage_load
echo.
echo  [17] Dang chay kiem thu leo thang tai vo han (1.000 toi 2.500 toi 5.000... den khi sap)...
echo  ------------------------------------------------------------------------
node "%~dp0tests\performance\stress_test.js"
goto finish_step

:finish_step
echo.
echo ========================================================================
echo  KICH BAN DA HOAN TAT. Nhan phim bat ky de quay lai menu chinh...
echo ========================================================================
pause
goto menu