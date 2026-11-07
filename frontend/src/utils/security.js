/**
 * ==============================================================================
 * BẢO VỆ DỮ LIỆU CÁ NHÂN (PII PROTECTION & DATA MASKING UTILITIES)
 * Hệ thống Quản lý Đào tạo & Sinh viên (SMS)
 * 
 * Tuân thủ quy chuẩn an toàn thông tin & bảo vệ dữ liệu cá nhân:
 * - Che mờ số Căn cước công dân (CCCD): Giữ 4 số đầu, 4 số cuối, che 4 số giữa (0010****5678)
 * - Che mờ Số điện thoại (Phone): Giữ 3 số đầu, 3 số cuối, che 4 số giữa (098****123)
 * - Che mờ Địa chỉ Email: Giữ ký tự đầu & cuối tên người dùng (s*****t@domain)
 * - Che mờ Số tài khoản ngân hàng (Bank): Giữ 4 số đầu, 4 số cuối (9704****1234)
 * ==============================================================================
 */

/**
 * Che mờ số CCCD / CMND trên giao diện công cộng / người dùng
 * @param {string|number} id - Số CCCD 12 số hoặc CMND 9 số
 * @returns {string} Chuỗi định dạng an toàn đã được che mờ
 */
export function maskCitizenId(id) {
  if (!id) return 'Chưa cập nhật';
  const str = String(id).trim();
  if (str.length <= 4) return '****';
  if (str.length === 12) {
    return `${str.slice(0, 4)}****${str.slice(-4)}`;
  }
  if (str.length === 9) {
    return `${str.slice(0, 3)}***${str.slice(-3)}`;
  }
  const visible = Math.min(3, Math.floor(str.length / 3));
  return `${str.slice(0, visible)}${'*'.repeat(Math.max(4, str.length - visible * 2))}${str.slice(-visible)}`;
}

/**
 * Che mờ số điện thoại liên hệ
 * @param {string} phone - Số điện thoại
 * @returns {string} Chuỗi SĐT an toàn (098****123)
 */
export function maskPhone(phone) {
  if (!phone) return 'Chưa cập nhật';
  const str = String(phone).trim();
  if (str.length < 7) return '****';
  return `${str.slice(0, 3)}****${str.slice(-3)}`;
}

/**
 * Che mờ địa chỉ email
 * @param {string} email - Địa chỉ email
 * @returns {string} Chuỗi email che mờ (u*****r@domain.com)
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '—';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(5, user.length - 2))}${user.slice(-1)}@${domain}`;
}

/**
 * Che mờ số tài khoản ngân hàng
 * @param {string} account - Số tài khoản ngân hàng
 * @returns {string} Chuỗi STK an toàn (9704****5678)
 */
export function maskBankAccount(account) {
  if (!account) return 'Chưa cập nhật';
  const str = String(account).trim();
  if (str.length <= 6) return '****';
  return `${str.slice(0, 4)}****${str.slice(-4)}`;
}
