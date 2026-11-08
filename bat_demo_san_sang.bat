@echo off
chcp 65001 >nul
title KHOI DONG TRINH DIEN DEMO DO AN TOT NGHIEP - PHENIKAA SMS

echo ======================================================================
echo    HE THONG QUAN LY DAO TAO ^& SINH VIEN (SMS / UAMS) - PHENIKAA 2026
echo            CHUNG TRINH CHUAN BI DEMO 1-CLICK TRUOC GIO G
echo ======================================================================
echo.

:: 1. Kiem tra Docker Containers
echo [1/4] Kiem tra trang thai dich vu he thong...
docker ps | findstr "student_management_backend_1" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Docker] Cac container chua bat. Dang khoi dong bang docker compose up -d...
    docker compose up -d
    echo [Docker] Cho 8 giay de Spring Boot va Database khoi dong on dinh...
    timeout /t 8 /nobreak >nul
) else (
    echo [OK] Cac container Docker dang hoat dong on dinh: MySQL, Redis, Backend, Frontend.
)
echo.

:: 2. Chay Smoke Test kiem tra 10/10 Endpoint
echo [2/4] Chay Smoke Test xac thuc ket noi he thong [Fail-Fast Gate]...
node tests/smoke/smoke_test.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [CANH BAO] Smoke Test co loi! Vui long kiem tra lai cac container.
    pause
    exit /b 1
)
echo.

:: 3. Khoi dong Visual Dashboard Concurrency Test [Port 5050] trong cua so moi
echo [3/4] Dang bat Visual Dashboard Test Tai Dong Thoi [Port 5050]...
netstat -ano | findstr ":5050 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    start "SMS Visual Concurrency Dashboard (5050)" cmd /k "cd /d "%~dp0" && node tests\performance\demo_100\server.js"
    echo [OK] May chu Dashboard 5050 da duoc khoi dong trong cua so rieng.
) else (
    echo [OK] May chu Dashboard 5050 da dang lang nghe tren cong 5050.
)
echo.

:: 4. Tu dong mo cac Tab trinh duyet phuc vu Demo
echo [4/4] Dang mo cac tab trinh duyet phuc vu trinh chieu...
start http://localhost:5173
start http://localhost:5050
start http://localhost:8080/swagger-ui/index.html

echo.
echo ======================================================================
echo                    TAT CA HE THONG DA SAN SANG!
echo ======================================================================
echo.
echo  [CUA SO 1] http://localhost:5173              - Giao dien chinh [Dang nhap cac Role]
echo  [CUA SO 2] http://localhost:5050              - Dashboard Test Tai Dong Thoi [Tiet muc dinh]
echo  [CUA SO 3] http://localhost:8080/swagger-ui   - Tai lieu 33 REST API Controllers
echo.
echo ----------------------------------------------------------------------
echo  BANG TAI KHOAN DEMO [MAT KHAU CHUNG: 123456]
echo ----------------------------------------------------------------------
echo  1. Phong Dao tao:   daotao      [Quan ly khung CTDT, xet tot nghiep TT08]
echo  2. Giao vu Khoa:    giaovu_cntt [Mo lop hoc phan, duyet sua diem Cap 1]
echo  3. Giang vien:      1000001     [TS. Nguyễn Hoàng Long - Điểm danh PIN, sổ điểm]
echo  4. Sinh vien K16:   2300001     [Nguyễn Minh Vinh - ĐKTC, TKB, CPA, bảng điểm]
echo  5. Khao thi:        khaothi     [Chia phong thi, giai quyet phuc khao truc tuyen]
echo  6. Quan tri vien:   admin       [Phan quyen RBAC, bulk reset password theo DOB]
echo ----------------------------------------------------------------------
echo.
echo [MEO] Mo 3 Profile / Cua so An danh khac nhau cho Giang vien, Sinh vien, Dao tao
echo       de tranh bi de Token JWT!
echo.
echo ======================================================================
