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

            helper.setFrom(fromEmail, "Đại học Phenikaa - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[Phenikaa SMS] Thông Báo Cấp Lại Mật Khẩu Tài Khoản");

            String roleDisplay = "STUDENT".equalsIgnoreCase(role) ? "Sinh viên" : "Cán bộ / Giảng viên";

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
                    .header { background: linear-gradient(135deg, #1d4ed8, #2563eb); padding: 28px 32px; color: #ffffff; text-align: center; }
                    .header h1 { margin: 0; font-size: 20px; letter-spacing: -0.5px; }
                    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; }
                    .content { padding: 32px; }
                    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
                    .info-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 18px 20px; border-radius: 6px; margin: 20px 0; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                    .info-row:last-child { margin-bottom: 0; }
                    .label { color: #64748b; font-weight: 500; }
                    .val { font-weight: 700; color: #0f172a; }
                    .password-highlight { font-size: 18px; color: #1d4ed8; letter-spacing: 1px; font-family: monospace; background: #e0e7ff; padding: 2px 8px; border-radius: 4px; }
                    .note { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }
                    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="header">
                      <h1>TRƯỜNG ĐẠI HỌC PHENIKAA</h1>
                      <p>CỔNG THÔNG TIN ĐÀO TẠO & QUẢN LÝ SINH VIÊN (SMS)</p>
                    </div>
                    <div class="content">
                      <div class="greeting">Kính gửi: %s (%s)</div>
                      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                        Ban Quản trị Đào tạo trường Đại học Phenikaa đã tiếp nhận và xử lý yêu cầu cấp lại mật khẩu của bạn. Dưới đây là thông tin đăng nhập mới:
                      </p>
                      
                      <div class="info-box">
                        <div class="info-row">
                          <span class="label">Tên đăng nhập:</span>
                          <span class="val">%s</span>
                        </div>
                        <div class="info-row">
                          <span class="label">Mật khẩu mới:</span>
                          <span class="val password-highlight">%s</span>
                        </div>
                        <div class="info-row">
                          <span class="label">Thời gian cấp lại:</span>
                          <span class="val">%s</span>
                        </div>
                      </div>

                      <div class="note">
                        ⚠️ <strong>Lưu ý bảo mật:</strong> Để đảm bảo an toàn cho tài khoản cá nhân, vui lòng đăng nhập vào cổng tương ứng và thực hiện <strong>đổi lại mật khẩu</strong> ngay trong lần truy cập đầu tiên.
                      </div>
                    </div>
                    <div class="footer">
                      © 2026 Phenikaa University • Email này được gửi tự động từ Hệ thống SMS.
                    </div>
                  </div>
                </body>
                </html>
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

            helper.setFrom(fromEmail, "Đại học Phenikaa - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[Phenikaa SMS] Thông Báo Về Yêu Cầu Cấp Lại Mật Khẩu");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
                  <h2>TRƯỜNG ĐẠI HỌC PHENIKAA</h2>
                  <p>Kính gửi: <strong>%s</strong> (Tài khoản: %s),</p>
                  <p>Yêu cầu cấp lại mật khẩu của bạn đã <strong>bị từ chối</strong> bởi Ban Quản trị với lý do sau:</p>
                  <blockquote style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; color: #991b1b;">
                    %s
                  </blockquote>
                  <p>Nếu cần hỗ trợ thêm, vui lòng liên hệ trực tiếp Phòng Đào tạo hoặc Bộ phận Kỹ thuật trường Đại học Phenikaa.</p>
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
