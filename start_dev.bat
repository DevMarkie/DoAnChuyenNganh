@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Khoi chay He Thong Quan Ly Sinh Vien

echo ======================================================================
echo    HE THONG QUAN LY SINH VIEN (SMS) - KHOI CHAY PHAT TRIEN
echo ======================================================================
echo.

:: -----------------------------------------------------------------------
:: 1. Kiem tra & xac dinh MySQL Database
:: -----------------------------------------------------------------------
echo [1/3] Dang kiem tra ket noi Database MySQL...

set "DB_PORT=3308"
set "DB_USER=sms_app"
set "DB_PASS=sms_dev_pw"

netstat -ano | findstr ":3308 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [MySQL] Phat hien MySQL Docker Container dang chay tren cong 3308.
    set "DB_PORT=3308"
    set "DB_USER=sms_app"
    set "DB_PASS=sms_dev_pw"
    goto :db_ready
)

netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [MySQL] Phat hien MySQL cu bo dang chay tren cong 3306.
    set "DB_PORT=3306"
    set "DB_USER=root"
    set "DB_PASS="
    goto :db_ready
)

:: Thu bat service MySQL80 cuc bo
echo [MySQL] Dang thu khoi dong dich vu MySQL80...
net start MySQL80 >nul 2>&1
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [MySQL] Khoi dong MySQL80 thanh cong tren cong 3306.
    set "DB_PORT=3306"
    set "DB_USER=root"
    set "DB_PASS="
    goto :db_ready
)

:: Thu qua Docker
echo [MySQL] Thu khoi dong qua Docker...
docker start student_management_db >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    docker compose up -d db >nul 2>&1
)
set "DB_PORT=3308"
set "DB_USER=sms_app"
set "DB_PASS=sms_dev_pw"

:db_ready
echo [MySQL] San sang ket noi co so du lieu. (Port: !DB_PORT!, User: !DB_USER!)

:: Tao file env tam de truyen DB config vao cua so con
set "ENV_FILE=%~dp0.env_dev_tmp.bat"
(
    echo @echo off
    echo set "SPRING_DATASOURCE_URL=jdbc:mysql://localhost:!DB_PORT!/student_management?useSSL=false^&serverTimezone=Asia/Ho_Chi_Minh^&allowPublicKeyRetrieval=true^&useUnicode=true^&characterEncoding=UTF-8"
    echo set "SPRING_DATASOURCE_USERNAME=!DB_USER!"
    echo set "SPRING_DATASOURCE_PASSWORD=!DB_PASS!"
) > "!ENV_FILE!"

:: -----------------------------------------------------------------------
:: 2. Khoi chay Backend trong cua so rieng
:: -----------------------------------------------------------------------
echo.
echo [2/3] Dang khoi chay Spring Boot Backend (Cong 8080)...
start "SMS Backend (Spring Boot 8080)" cmd /k "call "%~dp0.env_dev_tmp.bat" && cd /d "%~dp0backend" && mvnw.cmd spring-boot:run"

:: -----------------------------------------------------------------------
:: 3. Khoi chay Frontend trong cua so rieng
:: -----------------------------------------------------------------------
echo.
echo [3/3] Dang khoi chay React Frontend (Cong 5173)...
start "SMS Frontend (React Vite 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: -----------------------------------------------------------------------
:: Hien thi thong tin truy cap
:: -----------------------------------------------------------------------
echo.
echo ======================================================================
echo                     HE THONG DANG DUOC KHOI DONG!
echo ======================================================================
echo.
echo [1] TRUY CAP TREN MAY NAY:
echo    - Frontend App:   http://localhost:5173
echo    - Backend API:    http://localhost:8080/api
echo    - Swagger Docs:   http://localhost:8080/swagger-ui.html
echo.
echo [2] TRUY CAP TU THIET BI KHAC TRONG MANG LAN / CUNG WI-FI:
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr "192.168."') do (
    set LOCAL_IP=%%a
    goto :ip_found
)
:ip_found
set LOCAL_IP=!LOCAL_IP: =!
if "!LOCAL_IP!"=="" (
    echo    - [Luu y] Khong tim thay IP LAN 192.168.x.x. Kiem tra Wi-Fi/LAN.
) else (
    echo    - Mo trinh duyet tren dien thoai/laptop khac, go dia chi:
    echo      http://!LOCAL_IP!:5173
)
echo.
echo [3] TAI KHOAN DANG NHAP MAU:
echo    + Quan tri vien (Admin)        : admin       / 123456
echo    + Can bo Phong Dao tao (SMS)   : daotao      / Daotao@2026!  (hoac 123456)
echo    + Can bo Khao thi              : khaothi     / Khaothi@2026! (hoac 123456)
echo    + Giao vu Khoa CNTT            : giaovu_cntt / 123456
echo    + Giang vien dai dien          : 1000001     / 123456
echo    + Sinh vien dai dien           : 2500001     / 123456
echo.
echo [4] De chia se link ra toan Internet:
echo    Chay file: share_internet.bat
echo ======================================================================
pause
