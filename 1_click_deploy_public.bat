@echo off
chcp 65001 >nul
title 1-Click Deploy Public HTTPS 
echo ====================================================================
echo        CÔNG CỤ TỰ ĐỘNG CẬP NHẬT LINK CLOUDFLARE CHO WEBSITE
echo ====================================================================
echo Yêu cầu: Bạn đã bật Backend (localhost:8080) trước khi chạy file này!
echo.
node update_tunnel_and_deploy.js
echo.
pause
