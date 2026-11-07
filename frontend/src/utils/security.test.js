import { describe, it, expect } from 'vitest';
import { maskCitizenId, maskPhone, maskEmail, maskBankAccount } from './security';

describe('PII Security & Data Masking Utilities', () => {
  describe('maskCitizenId', () => {
    it('che mờ đúng định dạng CCCD 12 số (0010****5678)', () => {
      expect(maskCitizenId('001099125678')).toBe('0010****5678');
    });

    it('che mờ đúng định dạng CMND 9 số (123***789)', () => {
      expect(maskCitizenId('123456789')).toBe('123***789');
    });

    it('xử lý giá trị rỗng hoặc null', () => {
      expect(maskCitizenId(null)).toBe('Chưa cập nhật');
      expect(maskCitizenId('')).toBe('Chưa cập nhật');
    });
  });

  describe('maskPhone', () => {
    it('che mờ số điện thoại 10 số (098****123)', () => {
      expect(maskPhone('0987654123')).toBe('098****123');
      expect(maskPhone('0912345678')).toBe('091****678');
    });

    it('xử lý giá trị rỗng hoặc null', () => {
      expect(maskPhone(null)).toBe('Chưa cập nhật');
      expect(maskPhone('')).toBe('Chưa cập nhật');
    });
  });

  describe('maskEmail', () => {
    it('che mờ email người dùng', () => {
      expect(maskEmail('student@sms.edu.vn')).toBe('s*****t@sms.edu.vn');
      expect(maskEmail('admin@sms.edu.vn')).toBe('a***n@sms.edu.vn');
    });

    it('xử lý null', () => {
      expect(maskEmail(null)).toBe('—');
    });
  });

  describe('maskBankAccount', () => {
    it('che mờ số tài khoản ngân hàng', () => {
      expect(maskBankAccount('9704123456789012')).toBe('9704****9012');
    });

    it('xử lý null', () => {
      expect(maskBankAccount(null)).toBe('Chưa cập nhật');
    });
  });
});
