const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("1. Đang dọn dẹp các Tunnel cũ (nếu có)...");
try { execSync('taskkill /F /IM cloudflared.exe 2>nul'); } catch(e){}

// Xóa file log cũ
fs.writeFileSync('cloudflare.log', '');

console.log("2. Đang khởi động Cloudflare Tunnel mới kết nối tới Backend (8080)...");
const out = fs.openSync('cloudflare.log', 'a');
const err = fs.openSync('cloudflare.log', 'a');
const tunnel = spawn('cloudflared.exe', ['tunnel', '--url', 'http://localhost:8080'], { 
    detached: true, 
    stdio: ['ignore', out, err] 
});
tunnel.unref();

console.log("3. Đang chờ Cloudflare cấp phát đường dẫn HTTPS (7 giây)...");
setTimeout(() => {
    try {
        const log = fs.readFileSync('cloudflare.log', 'utf8');
        const match = log.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        
        if (match) {
            const url = match[0];
            console.log("\n✅ Đã lấy được link Public an toàn: " + url);
            
            console.log("\n4. Đang cập nhật link này vào cấu hình Frontend...");
            fs.writeFileSync('frontend/.env.production', `VITE_API_URL=${url}/api\n`);
            
            console.log("-> Đang build bản đóng gói Frontend mới nhất...");
            execSync('npm --prefix frontend run build', { stdio: 'inherit' });
            
            console.log("-> Chuẩn bị file 404.html cho GitHub Pages...");
            fs.copyFileSync(
                path.join(__dirname, 'frontend', 'dist', 'index.html'),
                path.join(__dirname, 'frontend', 'dist', '404.html')
            );

            console.log("-> Đang đẩy trực tiếp bản build lên nhánh gh-pages của GitHub...");
            const distDir = path.join(__dirname, 'frontend', 'dist');
            execSync('git init', { cwd: distDir, stdio: 'ignore' });
            execSync('git checkout -B gh-pages', { cwd: distDir, stdio: 'ignore' });
            execSync('git add -A', { cwd: distDir, stdio: 'ignore' });
            execSync('git commit -m "Deploy latest build with Cloudflare Tunnel & HashRouter"', { cwd: distDir, stdio: 'ignore' });
            execSync('git push -f https://github.com/DevMarkie/DoAnChuyenNganh.git gh-pages', { cwd: distDir, stdio: 'inherit' });
            try {
                fs.rmSync(path.join(distDir, '.git'), { recursive: true, force: true });
            } catch(e) {}
            
            console.log("\n🎉 HOÀN TẤT 100%! Website trên GitHub Pages đã được kích hoạt.");
            console.log("👉 Link truy cập chính thức của bạn:");
            console.log("   https://devmarkie.github.io/DoAnChuyenNganh/#/");
            console.log("   Cổng Admin: https://devmarkie.github.io/DoAnChuyenNganh/#/admin/login");
        } else {
            console.log("\n❌ Không tìm thấy link Cloudflare trong log. Vui lòng kiểm tra lại mạng hoặc chạy lại file này.");
        }
    } catch (err) {
        console.log("\n❌ Có lỗi xảy ra: ", err.message);
    }
}, 7000);
