@echo off
title SMS - Che Do Demo Cluster (3 Backend Load Balancing)
cd /d "%~dp0"

echo ======================================================================
echo    KHOI DONG HE THONG: CHE DO CLUSTER DEMO / TEST TAI CAO (3 BACKENDS)
echo ======================================================================
echo.
echo [1/2] Dang kich hoat 3 instances Backend va Nginx Load Balancing...
docker compose -f docker-compose.yml -f docker-compose.cluster.yml up -d

echo.
echo [2/2] Kiem tra trang thai cac container dang chay:
docker compose ps

echo.
echo ======================================================================
echo  [OK] He thong da chay o Che Do Cluster (3 Backend)!
echo  - Web:     http://localhost hoac http://localhost:5173
echo  - API:     http://localhost:8080/api/
echo  - Swagger: http://localhost:8080/swagger-ui.html
echo ======================================================================
echo.
pause