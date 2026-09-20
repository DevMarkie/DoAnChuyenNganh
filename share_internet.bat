@echo off
chcp 65001 >nul
title Chia sẻ Hệ Thống Quản Lý Sinh Viên ra Internet

echo ======================================================================
echo    CHIA SẺ HỆ THỐNG RA TOÀN INTERNET (PUBLIC HTTPS URL)
echo ======================================================================
echo.
echo Hệ thống cần đang chạy trên cổng 5173 (chạy file start_dev.bat trước).
echo.
echo Bạn muốn sử dụng phương thức chia sẻ nào?
echo.
echo [1] Cloudflare Tunnel (Khuyên dùng: Miễn phí, tốc độ cao, link HTTPS an toàn)
echo [2] LocalTunnel (Chạy trực tiếp qua Node.js npx)
echo [3] Pinggy SSH Tunnel (Dùng sẵn OpenSSH của Windows, không cần cài đặt)
echo.
set /p CHOICE="Nhập lựa chọn của bạn (1, 2, hoặc 3) [Mặc định: 1]: "

if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" goto :cloudflare
if "%CHOICE%"=="2" goto :localtunnel
if "%CHOICE%"=="3" goto :pinggy

:cloudflare
echo.
echo [Cloudflare] Đang kiểm tra công cụ Cloudflare Tunnel...
if not exist "%~dp0cloudflared.exe" (
    echo [Cloudflare] Đang tải cloudflared.exe trực tiếp từ Cloudflare...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe', '%~dp0cloudflared.exe')"
    if not exist "%~dp0cloudflared.exe" (
        echo [Lỗi] Không tải được cloudflared.exe. Đang chuyển sang LocalTunnel...
        goto :localtunnel
    )
)
echo.
echo ======================================================================
echo ĐANG TẠO ĐƯỜNG LINK HTTPS CÔNG KHAI QUA CLOUDFLARE TUNNEL...
echo Tìm dòng có dạng: https://xxxxxxxxxxxx.trycloudflare.com
echo Copy link đó gửi cho thầy cô / bạn bè để truy cập trực tiếp!
echo (Giữ cửa sổ này mở trong suốt quá trình cho người khác truy cập)
echo ======================================================================
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:5173
goto :end

:localtunnel
echo.
echo ======================================================================
echo ĐANG TẠO ĐƯỜNG LINK HTTPS CÔNG KHAI QUA LOCALTUNNEL...
echo ======================================================================
echo.
call npx -y localtunnel --port 5173
goto :end

:pinggy
echo.
echo ======================================================================
echo ĐANG TẠO ĐƯỜNG LINK HTTPS CÔNG KHAI QUA PINGGY (SSH)...
echo ======================================================================
echo.
ssh -p 443 -R0:localhost:5173 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 a.pinggy.io
goto :end

:end
pause
