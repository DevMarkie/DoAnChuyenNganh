/**
 * Pre-flight System & Database Health Check
 * Kiểm tra tính sẵn sàng của Backend Spring Boot và Kết nối Cơ sở Dữ liệu MySQL
 * Trả về exit code:
 *   0: Toàn bộ hệ thống sẵn sàng (Backend + MySQL OK)
 *   1: Backend chưa bật (Cổng 8080 không phản hồi)
 *   2: Backend đang bật nhưng KHÔNG kết nối được Cơ sở dữ liệu MySQL
 */

const BASE_URL = "http://localhost:8080/api";

async function checkSystemHealth() {
  // 1. Kiểm tra Backend có đang lắng nghe và phản hồi HTTP không (endpoint không cần DB)
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("BACKEND_DOWN: Không thể kết nối tới Backend trên cổng 8080.");
    process.exitCode = 1;
    return;
  }

  // 2. Kiểm tra Kết nối Database thông qua đăng nhập Admin
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456" }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.data?.role === "ADMIN") {
      console.log("HEALTHY: Backend và Database MySQL đang hoạt động hoàn hảo!");
      process.exitCode = 0;
      return;
    }

    console.error(`DB_ERROR: Backend phản hồi lỗi khi truy vấn cơ sở dữ liệu: ${data.message || res.status}`);
    process.exitCode = 2;
  } catch (err) {
    console.error("DB_TIMEOUT: Hết thời gian chờ kết nối Cơ sở dữ liệu (MySQL có thể đang tắt).");
    process.exitCode = 2;
  }
}

checkSystemHealth();
