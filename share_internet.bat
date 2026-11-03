@echo off
chcp 65001 >nul
title Chia sẻ Hệ Thống ra Internet - Public Tunnel

echo ======================================================================
echo    CHIA SẺ HỆ THỐNG QUẢN LÝ SINH VIÊN RA INTERNET (HTTPS PUBLIC)
echo ======================================================================
echo.

REM Kiem tra Frontend dang chay tren cong 5173 hoac 80
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PORT=5173"
    echo [OK] Phat hien Frontend dang chay tren cong 5173 [Dev mode].
    goto :port_ready
)

netstat -ano | findstr ":80 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PORT=80"
    echo [OK] Phat hien Frontend dang chay tren cong 80 [Docker mode].
    goto :port_ready
)

echo [Canh bao] Frontend chua bat tren cong 5173 hoac cong 80.
echo Vui long chay start_dev.bat hoac bat_tiet_kiem_ram.bat truoc de khoi dong App!
echo.
pause
exit /b 1

:port_ready
echo.
echo Chon dich vu tao duong ham Internet:
echo   [1] Cloudflare Tunnel  - Khuyen dung, on dinh, HTTPS mien phi
echo   [2] Localtunnel        - Can Node.js, chay qua npx
echo.
set "TUN_CHOICE=1"
set /p "TUN_CHOICE=Nhap lua chon [Mac dinh: 1]: "

if "%TUN_CHOICE%"=="2" goto :localtunnel

:cloudflare
set "CF=cloudflared"
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "CF=%~dp0.tools\cloudflared.exe"
    if not exist "%~dp0.tools\cloudflared.exe" (
        echo [Tai ve] Dang tai cloudflared chinh thuc cho Windows...
        if not exist "%~dp0.tools" mkdir "%~dp0.tools"
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0.tools\cloudflared.exe'"
        if not exist "%~dp0.tools\cloudflared.exe" (
            echo [Loi] Khong tai duoc cloudflared. Chuyen sang che do Localtunnel...
            goto :localtunnel
        )
        echo [OK] Da tai cloudflared vao thu muc .tools
    )
)

echo.
echo ======================================================================
echo  Dang mo duong ham Cloudflare Tunnel tren cong %PORT%...
echo  GIU NGUYEN cua so nay trong suot qua trinh demo.
echo  Copy link https://...trycloudflare.com ben duoi de chia se!
echo ======================================================================
echo.
"%CF%" tunnel --url http://localhost:%PORT%
goto :eof

:localtunnel
echo.
echo ======================================================================
echo  Dang mo Localtunnel tren cong %PORT%...
echo  GIU NGUYEN cua so nay trong suot qua trinh demo.
echo ======================================================================
echo.
call npx --yes localtunnel --port %PORT%
goto :eof