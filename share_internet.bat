@echo off
chcp 65001 >nul
title Chia sẻ Hệ Thống ra Internet (Public Tunnel)

echo ======================================================================
echo    CHIA SẺ HỆ THỐNG QUẢN LÝ SINH VIÊN RA INTERNET (HTTPS PUBLIC)
echo ======================================================================
echo.

:: 1. Kiểm tra Frontend đã chạy trên cổng 5173 chưa
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Cảnh báo] Frontend chưa bật trên cổng 5173.
    echo Vui lòng chạy start_dev.bat trước để khởi động App, rồi chạy lại file này!
    echo.
    pause
    exit /b 1
)
echo [✓] Frontend đang chạy trên cổng 5173.
echo.

echo Chọn dịch vụ tạo đường hầm Internet:
echo   [1] Cloudflare Tunnel  (Khuyên dùng - ổn định, HTTPS)
echo   [2] Localtunnel        (Cần Node.js, dùng npx)
echo.
set /p TUN_CHOICE="Nhập lựa chọn [Mặc định: 1]: "
if "%TUN_CHOICE%"=="" set TUN_CHOICE=1

if "%TUN_CHOICE%"=="2" goto :localtunnel

:cloudflare
:: Tìm cloudflared: PATH -> .tools\cloudflared.exe -> tải về
set "CF=cloudflared"
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "CF=%~dp0.tools\cloudflared.exe"
    if not exist "%~dp0.tools\cloudflared.exe" (
        echo [Tải về] Chưa có cloudflared, đang tải bản chính thức cho Windows...
        if not exist "%~dp0.tools" mkdir "%~dp0.tools"
        powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0.tools\cloudflared.exe' } catch { exit 1 }"
        if %ERRORLEVEL% NEQ 0 (
            echo [Lỗi] Không tải được cloudflared. Kiểm tra kết nối mạng rồi thử lại.
            pause
            exit /b 1
        )
        echo [✓] Đã tải cloudflared vào thư mục .tools
    )
)
echo.
echo ======================================================================
echo  Đang mở đường hầm... GIỮ NGUYÊN cửa sổ này trong lúc demo.
echo  Copy đường link https://....trycloudflare.com bên dưới để chia sẻ.
echo ======================================================================
echo.
"%CF%" tunnel --url http://localhost:5173
goto :eof

:localtunnel
echo.
echo ======================================================================
echo  Đang mở Localtunnel... GIỮ NGUYÊN cửa sổ này trong lúc demo.
echo ======================================================================
echo.
npx --yes localtunnel --port 5173
goto :eof
