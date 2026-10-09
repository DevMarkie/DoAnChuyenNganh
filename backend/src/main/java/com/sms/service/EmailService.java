package com.sms.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@sms.edu.vn}")
    private String fromEmail;

    /**
     * Send password reset success email with HTML layout.
     * Returns true if sent successfully, false if sending failed (handled gracefully).
     */
    public boolean sendPasswordResetEmail(String toEmail, String fullName, String username, String newPassword, String role) {
        log.info("Chuẩn bị gửi email cấp lại mật khẩu tới: {} (Tài khoản: {})", toEmail, username);

        if (mailSender == null) {
            log.warn("JavaMailSender chưa được khởi tạo. Không thể gửi email thực tế qua SMTP.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Ban Quản Trị Đào Tạo - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[SMS Portal] Thông Báo Cấp Lại Mật Khẩu Tài Khoản");

            String roleDisplay = "STUDENT".equalsIgnoreCase(role) ? "Sinh viên" : "Cán bộ / Giảng viên";

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 540px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #1d4ed8; margin-top: 0;">HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS)</h2>
                  <p>Kính gửi: <strong>%s</strong> (%s),</p>
                  <p>Yêu cầu cấp lại mật khẩu của bạn đã được xử lý. Dưới đây là thông tin đăng nhập mới:</p>
                  <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
                    <p style="margin: 4px 0;"><strong>Tên đăng nhập:</strong> %s</p>
                    <p style="margin: 4px 0;"><strong>Mật khẩu mới:</strong> <code style="font-size: 16px; color: #1d4ed8; background: #e0e7ff; padding: 2px 6px; border-radius: 4px;">%s</code></p>
                    <p style="margin: 4px 0; font-size: 13px; color: #64748b;">Thời gian: %s</p>
                  </div>
                  <p style="font-size: 13px; color: #b45309;">⚠️ <em>Lưu ý: Vui lòng đăng nhập và đổi lại mật khẩu ngay trong lần truy cập đầu tiên.</em></p>
                </div>
                """.formatted(
                    fullName,
                    roleDisplay,
                    username,
                    newPassword,
                    java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi email cấp lại mật khẩu thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email qua SMTP: {}. Mật khẩu mới vẫn được cập nhật trong CSDL.", e.getMessage());
            return false;
        }
    }

    /**
     * Send rejection notification email.
     */
    public boolean sendRejectionEmail(String toEmail, String fullName, String username, String reason) {
        if (mailSender == null) return false;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Ban Quản Trị Đào Tạo - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[SMS Portal] Thông Báo Về Yêu Cầu Cấp Lại Mật Khẩu");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
                  <h2>HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN</h2>
                  <p>Kính gửi: <strong>%s</strong> (Tài khoản: %s),</p>
                  <p>Yêu cầu cấp lại mật khẩu của bạn đã <strong>bị từ chối</strong> bởi Ban Quản trị với lý do sau:</p>
                  <blockquote style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; color: #991b1b;">
                    %s
                  </blockquote>
                  <p>Nếu cần hỗ trợ thêm, vui lòng liên hệ trực tiếp Phòng Đào tạo hoặc Quản trị viên Hệ thống SMS.</p>
                </body>
                </html>
                """.formatted(fullName, username, (reason != null && !reason.isBlank()) ? reason : "Thông tin xác minh không khớp.");

            helper.setText(htmlContent, true);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email từ chối: {}", e.getMessage());
            return false;
        }
    }
}
