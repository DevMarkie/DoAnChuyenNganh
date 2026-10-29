@echo off
title SMS - Che Do Tiet Kiem RAM (1 Backend)
cd /d "%~dp0"

echo ======================================================================
echo    KHOI DONG HE THONG: CHE DO TIET KIEM RAM (1 BACKEND DUY NHAT)
echo ======================================================================
echo.
echo [1/2] Dang chuyen doi sang 1 Backend duy nhat va giai phong RAM thua...
docker compose up -d --remove-orphans

echo.
echo [2/2] Kiem tra trang thai cac container dang chay:
docker compose ps

echo.
echo ======================================================================
echo  [OK] He thong dang chay Che Do Tiet Kiem (RAM duoi 600MB)!
echo  - Web:     http://localhost hoac http://localhost:5173
echo  - API:     http://localhost:8080/api/
echo  - Swagger: http://localhost:8080/swagger-ui.html
echo ======================================================================
echo.
pause