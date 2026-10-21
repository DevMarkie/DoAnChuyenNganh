package com.sms;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

// Test này nạp toàn bộ Spring context + kết nối MySQL thật, chỉ chạy khi đặt DB_IT=true.
// Mặc định `mvn test` bỏ qua để bộ test chạy nhanh và không phụ thuộc DB ngoài.
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_IT", matches = "true")
class StudentManagementApplicationTests {

	@Test
	void contextLoads() {
	}

}
