@echo off
chcp 65001 >nul
title SMS - Bo Kiem Thu Dang Ky Tin Chi (Course Enrollment Test Suite)

cls
echo.
echo  ========================================================================
echo       HE THONG QUAN LY SINH VIEN - CHUYEN DE DANG KY TIN CHI
echo       Student Management System - Course Enrollment Test Suite
echo  ========================================================================
echo.

REM --- Kiem tra tien quyet: Node.js ---
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [LOI] Node.js chua duoc cai dat tren may!
    echo  Vui long tai va cai dat tai: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM --- Buoc 1: Kiem tra MySQL ---
echo  [1/3] Kiem tra trang thai co so du lieu MySQL...
netstat -ano | findstr ":3308 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto db_ready
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto db_ready

echo        MySQL chua khoi dong. Dang tu dong khoi chay container...
docker start student_management_db >nul 2>&1
timeout /t 4 /nobreak >nul

:db_ready
echo  [OK] Co so du lieu MySQL: San sang.

REM --- Buoc 2: Kiem tra Backend ---
echo  [2/3] Kiem tra Backend Spring Boot (cong 8080)...
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [LOI] Backend chua khoi dong tren cong 8080.
    echo        Vui long chay start_dev.bat truoc roi thu lai.
    echo.
    pause
    exit /b 1
)
echo  [OK] Backend Spring Boot: Dang lang nghe tren cong 8080.

REM --- Buoc 3: Kiem tra ket noi Backend-Database ---
echo  [3/3] Kiem tra ket noi Backend - Database...
node "%~dp0tests\utils\health_check.js" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto health_ready

echo        Backend online nhung chua ket noi duoc MySQL. Thu khoi dong lai...
docker start student_management_db >nul 2>&1
timeout /t 4 /nobreak >nul
node "%~dp0tests\utils\health_check.js" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto health_ready

echo.
echo  [LOI] Backend khong ket noi duoc voi MySQL.
echo        Vui long kiem tra Docker Desktop hoac dich vu MySQL roi thu lai.
echo.
pause
exit /b 1

:health_ready
echo  [OK] He thong hoat dong on dinh. San sang thuc thi kiem thu!
echo.

REM --- Menu lua chon ---
echo  ========================================================================
echo           CAC KICH BAN KIEM THU DANG KY TIN CHI (ENROLLMENT TESTS)
echo  ========================================================================
echo.
echo   [1]  KIEM THU NHANH TRANG THAI HE THONG (Smoke Test)
echo        Kiem tra ket noi API Dang ky hoc phan, Danh muc mon va Lop tin chi
echo.
echo   [2]  KIEM THU TRANH CHAP TAI DONG THOI (600 SV Concurrency)
echo        600 sinh vien tranh slot - Kiem tra chong tran si so (Over-enrollment)
echo.
echo   [3]  KIEM THU TAI DA CAP DO (Multi-stage Load Test: 500 - 5.000 Reqs)
echo        Danh gia hieu nang Nginx Load Balancer + 3 Backend Replicas
echo.
echo   [4]  KIEM THU SUC CHIU TAI CUC HAN (Stress Test To Failure)
echo        Leo thang tai tu dong den khi he thong dat nguong cham dut
echo.
echo   [0]  Thoat
echo.
echo  ========================================================================
echo.
set /p TEST_CHOICE="  Nhap lua chon [1-4, hoac 0 de thoat]: "

if defined TEST_CHOICE set TEST_CHOICE=%TEST_CHOICE: =%
if "%TEST_CHOICE%"=="" set TEST_CHOICE=1
if "%TEST_CHOICE%"=="0" exit /b 0
if "%TEST_CHOICE%"=="1" goto run_smoke
if "%TEST_CHOICE%"=="2" goto run_concurrency_600
if "%TEST_CHOICE%"=="3" goto run_multistage_load
if "%TEST_CHOICE%"=="4" goto run_stress_failure
goto run_smoke

REM -----------------------------------------------------------------------
:run_smoke
echo.
echo  [1] Dang kiem tra nhanh cac API phuc vu Dang ky hoc phan...
echo  ------------------------------------------------------------------------
node "%~dp0tests\smoke\smoke_test.js"
goto finish

REM -----------------------------------------------------------------------
:run_concurrency_600
echo.
echo  [2] Dang chay kiem thu tranh chap 600 sinh vien dong thoi...
echo  ------------------------------------------------------------------------
node "%~dp0tests\performance\simulate_600_enrollment.js"
goto finish

REM -----------------------------------------------------------------------
:run_multistage_load
echo.
echo  [3] Dang chay kiem thu tai da cap do (500 -> 5.000 requests)...
echo  ------------------------------------------------------------------------
node "%~dp0stress_test.js"
goto finish

REM -----------------------------------------------------------------------
:run_stress_failure
echo.
echo  ========================================================================
echo   CANH BAO: STRESS TEST TO FAILURE
echo   He thong se bi day len muc tai cao nhat de do nguong sup do.
echo  ========================================================================
echo.
set /p CONFIRM="  Ban co chac chan muon chay Stress Test To Failure? (Y/N): "
if /i "%CONFIRM%" NEQ "Y" goto finish
echo.
echo  [4] Dang chay Stress Test leo thang...
echo  ------------------------------------------------------------------------
node "%~dp0stress_test_to_death.js"
goto finish

REM -----------------------------------------------------------------------
:finish
echo.
echo  ========================================================================
echo   Ket thuc qua trinh kiem thu!
echo  ========================================================================
echo.
pause
