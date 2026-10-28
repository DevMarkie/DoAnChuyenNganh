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
                    org.springframework.web.util.HtmlUtils.htmlEscape(fullName),
                    roleDisplay,
                    org.springframework.web.util.HtmlUtils.htmlEscape(username),
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
     * Gửi email thông báo điều chỉnh điểm sau khóa sổ chính thức cho sinh viên hoặc giảng viên.
     */
    public boolean sendGradeAmendmentEmail(String toEmail, String recipientName, String subjectName, String sectionCode, String componentName, java.math.BigDecimal oldScore, java.math.BigDecimal newScore, String reason) {
        log.info("Chuẩn bị gửi email thông báo sửa điểm sau khóa sổ tới: {}", toEmail);

        if (mailSender == null) {
            log.warn("JavaMailSender chưa được cấu hình SMTP. Bỏ qua gửi email thực tế.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Phòng Quản lý Đào tạo - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[SMS Portal] Thông Báo Điều Chỉnh Điểm Số Chính Thức - Học phần " + subjectName);

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #1e3a8a; margin-top: 0;">HỆ THỐNG QUẢN LÝ ĐÀO TẠO & ĐIỂM (SMS)</h2>
                  <p>Kính gửi: <strong>%s</strong>,</p>
                  <p>Phòng Quản lý Đào tạo thông báo: Yêu cầu điều chỉnh điểm sau khóa sổ cho học phần <strong>%s</strong> (Mã lớp: <code>%s</code>) đã được phê duyệt chính thức.</p>
                  <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0;">
                    <p style="margin: 4px 0;"><strong>Thành phần điểm:</strong> %s</p>
                    <p style="margin: 4px 0;"><strong>Điểm cũ:</strong> <span style="color: #64748b; text-decoration: line-through;">%s</span> ➔ <strong>Điểm mới:</strong> <span style="color: #059669; font-size: 16px; font-weight: bold;">%s</span></p>
                    <p style="margin: 4px 0;"><strong>Lý do điều chỉnh:</strong> %s</p>
                    <p style="margin: 4px 0; font-size: 12px; color: #64748b;">Thời gian phê duyệt: %s</p>
                  </div>
                  <p style="font-size: 13px; color: #475569;">Bảng điểm học tập và điểm trung bình tích lũy (GPA/CPA) đã được hệ thống tự động cập nhật lại tương ứng.</p>
                  <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Trân trọng,<br/>Phòng Quản lý Đào tạo.</p>
                </div>
            """.formatted(
                org.springframework.web.util.HtmlUtils.htmlEscape(recipientName != null ? recipientName : "Thầy/Cô/Sinh viên"),
                org.springframework.web.util.HtmlUtils.htmlEscape(subjectName != null ? subjectName : ""),
                org.springframework.web.util.HtmlUtils.htmlEscape(sectionCode != null ? sectionCode : ""),
                componentName != null ? componentName : "",
                oldScore != null ? oldScore.toPlainString() : "-",
                newScore != null ? newScore.toPlainString() : "-",
                org.springframework.web.util.HtmlUtils.htmlEscape(reason != null ? reason : ""),
                java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
            );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Đã gửi email điều chỉnh điểm thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email thông báo sửa điểm qua SMTP: {}", e.getMessage());
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
                """.formatted(
                    org.springframework.web.util.HtmlUtils.htmlEscape(fullName),
                    org.springframework.web.util.HtmlUtils.htmlEscape(username),
                    org.springframework.web.util.HtmlUtils.htmlEscape((reason != null && !reason.isBlank()) ? reason : "Thông tin xác minh không khớp."));

            helper.setText(htmlContent, true);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email từ chối: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send email notification when student is disqualified from taking the final exam due to >= 20% absence.
     */
    public boolean sendAttendanceDisqualificationEmail(String toEmail, String fullName, String studentCode,
                                                       String subjectCode, String subjectName,
                                                       int absentPeriods, int totalPeriods, double absentRatePercent) {
        log.info("Chuẩn bị gửi email cảnh báo cấm thi tới: {} (MSSV: {}, Môn: {})", toEmail, studentCode, subjectCode);
        if (mailSender == null) {
            log.warn("JavaMailSender chưa được khởi tạo. Bỏ qua gửi email thực tế.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Phòng Đào Tạo & Khảo Thí - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject(String.format("[SMS Portal] Quyết Định Cấm Thi Học Phần %s - %s", subjectCode, subjectName));

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                    <h2 style="color: #dc2626; margin-top: 0; border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">THÔNG BÁO CẤM THI HỌC PHẦN</h2>
                    <p>Kính gửi sinh viên: <strong>%s</strong> (MSSV: <strong>%s</strong>),</p>
                    <p>Hệ thống Đào tạo & Quản lý Sinh viên thông báo bạn <strong>bị cấm tham gia kỳ thi kết thúc học phần</strong> đối với môn học sau theo Quy chế đào tạo:</p>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0;">
                      <p style="margin: 4px 0;"><strong>Học phần:</strong> %s - %s</p>
                      <p style="margin: 4px 0;"><strong>Số tiết vắng:</strong> <span style="color: #dc2626; font-weight: bold;">%d / %d tiết</span></p>
                      <p style="margin: 4px 0;"><strong>Tỷ lệ vắng mặt:</strong> <span style="color: #dc2626; font-weight: bold;">%.1f%%</span> (Quy chế: tối đa 20.0%%)</p>
                      <p style="margin: 4px 0;"><strong>Trạng thái học vụ:</strong> <span style="color: #b91c1c; font-weight: bold;">CẤM THI (DISQUALIFIED)</span></p>
                    </div>
                    <p style="font-size: 14px; color: #475569;">
                      Tên của bạn đã tự động được rút khỏi danh sách tất cả các phòng thi cuối kỳ của học phần này. Điểm chuyên cần và điều kiện dự thi của học phần được ghi nhận 0 điểm (Điểm F).
                    </p>
                    <p style="font-size: 13px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                      Nếu có thắc mắc hoặc sai sót về dữ liệu điểm danh, bạn vui lòng liên hệ ngay với Giảng viên phụ trách lớp học phần để kiểm tra và xác minh.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                    org.springframework.web.util.HtmlUtils.htmlEscape(fullName),
                    org.springframework.web.util.HtmlUtils.htmlEscape(studentCode),
                    org.springframework.web.util.HtmlUtils.htmlEscape(subjectCode),
                    org.springframework.web.util.HtmlUtils.htmlEscape(subjectName),
                    absentPeriods,
                    totalPeriods,
                    absentRatePercent
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi email cảnh báo cấm thi thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email cảnh báo cấm thi: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send email notification when student account is placed on FINANCIAL HOLD due to overdue tuition.
     */
    public boolean sendFinancialHoldNotificationEmail(String toEmail, String fullName, String studentCode,
                                                      java.math.BigDecimal totalOverdueAmount, int overdueInvoiceCount) {
        log.info("Chuẩn bị gửi email thông báo Financial Hold tới: {} (MSSV: {})", toEmail, studentCode);
        if (mailSender == null) {
            log.warn("JavaMailSender chưa được khởi tạo. Bỏ qua gửi email thực tế.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Phòng Kế Hoạch - Tài Chính - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[SMS Portal] Quyết Định Tạm Khóa Dịch Vụ Học Vụ (FINANCIAL HOLD) Do Quá Hạn Học Phí");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                    <h2 style="color: #b91c1c; margin-top: 0; border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">THÔNG BÁO FINANCIAL HOLD</h2>
                    <p>Kính gửi sinh viên: <strong>%s</strong> (MSSV: <strong>%s</strong>),</p>
                    <p>Hệ thống Đào tạo & Tài chính thông báo tài khoản học vụ của bạn đã bị áp dụng chế tài <strong>Đóng băng dịch vụ học vụ (FINANCIAL HOLD)</strong> do còn công nợ học phí quá hạn quy định:</p>
                    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 16px; margin: 16px 0;">
                      <p style="margin: 4px 0;"><strong>Số khoản nợ quá hạn:</strong> %d hóa đơn</p>
                      <p style="margin: 4px 0;"><strong>Tổng tiền học phí nợ:</strong> <span style="color: #c2410c; font-weight: bold; font-size: 16px;">%,.0f VNĐ</span></p>
                      <p style="margin: 4px 0;"><strong>Trạng thái áp dụng:</strong> <span style="color: #b91c1c; font-weight: bold;">FINANCIAL HOLD = TRUE</span></p>
                    </div>
                    <p style="font-size: 14px; color: #475569;">
                      <strong>Phạm vi hạn chế:</strong> Cổng Đăng ký tín chỉ kỳ sau bị khóa; Tra cứu bảng điểm chính thức kết thúc học kỳ tạm ẩn chi tiết điểm và GPA.
                    </p>
                    <p style="font-size: 14px; color: #15803d;">
                      💡 <em>Chế tài FINANCIAL HOLD sẽ được hệ thống tự động gỡ bỏ ngay lập tức sau khi bạn hoàn tất thanh toán công nợ tại quầy thu ngân hoặc các cổng thanh toán liên kết.</em>
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                    org.springframework.web.util.HtmlUtils.htmlEscape(fullName),
                    org.springframework.web.util.HtmlUtils.htmlEscape(studentCode),
                    overdueInvoiceCount,
                    totalOverdueAmount != null ? totalOverdueAmount.doubleValue() : 0.0
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi email thông báo Financial Hold thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email Financial Hold: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send email notification when FINANCIAL HOLD is automatically released.
     */
    public boolean sendFinancialHoldReleasedEmail(String toEmail, String fullName, String studentCode) {
        log.info("Chuẩn bị gửi email dỡ bỏ Financial Hold tới: {} (MSSV: {})", toEmail, studentCode);
        if (mailSender == null) {
            log.warn("JavaMailSender chưa được khởi tạo. Bỏ qua gửi email thực tế.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Phòng Kế Hoạch - Tài Chính - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[SMS Portal] Dỡ Bỏ Đóng Băng Dịch Vụ Học Vụ (FINANCIAL HOLD)");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                    <h2 style="color: #15803d; margin-top: 0; border-bottom: 2px solid #bbf7d0; padding-bottom: 12px;">DỠ BỎ FINANCIAL HOLD</h2>
                    <p>Kính gửi sinh viên: <strong>%s</strong> (MSSV: <strong>%s</strong>),</p>
                    <p>Hệ thống xác nhận bạn đã hoàn thành nghĩa vụ học phí. Chế tài <strong>FINANCIAL HOLD</strong> đã được tự động dỡ bỏ.</p>
                    <p style="font-size: 14px; color: #15803d;">
                      Toàn bộ quyền lợi học vụ (Đăng ký tín chỉ và tra cứu bảng điểm chính thức) đã được khôi phục trạng thái hoạt động bình thường.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                    org.springframework.web.util.HtmlUtils.htmlEscape(fullName),
                    org.springframework.web.util.HtmlUtils.htmlEscape(studentCode)
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi email dỡ bỏ Financial Hold thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email dỡ bỏ Financial Hold: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Gửi email thông báo Cảnh báo học vụ & điều chỉnh hạn mức tín chỉ.
     */
    public boolean sendAcademicWarningEmail(String toEmail, String fullName, String studentCode,
                                            int warningLevel, String notice, int maxCredits) {
        log.info("Chuẩn bị gửi email Cảnh báo học vụ tới: {} (MSSV: {}, Mức: {})", toEmail, studentCode, warningLevel);
        if (mailSender == null) {
            log.warn("JavaMailSender chưa được khởi tạo. Bỏ qua gửi email thực tế.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Phòng Đào Tạo & Quản Lý Học Vụ - SMS");
            helper.setTo(toEmail);
            String title = warningLevel >= 3 
                    ? "[SMS Portal] Quyết Định Buộc Thôi Học Do Vi Phạm Quy Chế Đào Tạo"
                    : String.format("[SMS Portal] Quyết Định Cảnh Báo Học Vụ Mức %d", warningLevel);
            helper.setSubject(title);

            String statusText = warningLevel >= 3 ? "BUỘC THÔI HỌC" : ("CẢNH BÁO MỨC " + warningLevel);
            String creditRuleText = warningLevel >= 3
                    ? "Cổng đăng ký tín chỉ và các dịch vụ học vụ của bạn đã bị khóa hoàn toàn (0 tín chỉ)."
                    : String.format("Hạn mức đăng ký tín chỉ ở học kỳ tiếp theo của bạn bị siết tối đa <strong>%d tín chỉ</strong>.", maxCredits);

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                    <h2 style="color: #dc2626; margin-top: 0; border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">THÔNG BÁO XỬ LÝ HỌC VỤ TỰ ĐỘNG</h2>
                    <p>Kính gửi sinh viên: <strong>%s</strong> (MSSV: <strong>%s</strong>),</p>
                    <p>Hội đồng xét xử lý học vụ thông báo bạn thuộc diện: <strong style="color: #dc2626;">%s</strong>.</p>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0;">
                      <p style="margin: 4px 0;"><strong>Lý do:</strong> %s</p>
                      <p style="margin: 4px 0;"><strong>Chế tài áp dụng:</strong> %s</p>
                    </div>
                    <p style="font-size: 14px; color: #475569;">
                      Vui lòng liên hệ Cố vấn học tập hoặc Văn phòng Khoa để được tư vấn lộ trình học tập cải thiện kết quả.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                    org.springframework.web.util.HtmlUtils.htmlEscape(fullName),
                    org.springframework.web.util.HtmlUtils.htmlEscape(studentCode),
                    statusText,
                    org.springframework.web.util.HtmlUtils.htmlEscape(notice != null ? notice : "Dưới chuẩn quy chế học vụ"),
                    creditRuleText
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi email cảnh báo học vụ thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email cảnh báo học vụ: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send OTP email for streamlined password reset.
     */
    public boolean sendOtpEmail(String toEmail, String fullName, String username, String otp) {
        log.info("Chuẩn bị gửi email mã OTP đặt lại mật khẩu tới: {} (Tài khoản: {})", toEmail, username);

        if (mailSender == null) {
            log.warn("JavaMailSender chưa được khởi tạo. Không thể gửi email thực tế qua SMTP.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Ban Quản Trị Đào Tạo - Hệ thống SMS");
            helper.setTo(toEmail);
            helper.setSubject("[SMS Portal] Mã OTP Đặt Lại Mật Khẩu");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
                  <div style="max-width: 540px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                    <h2 style="color: #2563eb; margin-top: 0; border-bottom: 2px solid #dbeafe; padding-bottom: 12px;">HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN</h2>
                    <p>Kính gửi: <strong>%s</strong> (Tài khoản: <strong>%s</strong>),</p>
                    <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản trên Cổng thông tin đào tạo.</p>
                    <p>Mã xác thực OTP của bạn là:</p>
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: center;">
                      <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8;">%s</span>
                    </div>
                    <p style="font-size: 13px; color: #64748b;">
                      Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn tài khoản.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                    org.springframework.web.util.HtmlUtils.htmlEscape(fullName),
                    org.springframework.web.util.HtmlUtils.htmlEscape(username),
                    otp
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi email mã OTP thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi gửi email mã OTP: {}", e.getMessage());
            return false;
        }
    }
}
