import { describe, it, expect } from 'vitest';
import { genderLabel, studentStatusLabel, studentStatusBadgeClass } from '../utils/labels';

describe('SMS Utility Functions - labels.js', () => {
  describe('genderLabel', () => {
    it('returns "Nam" for MALE', () => {
      expect(genderLabel('MALE')).toBe('Nam');
    });

    it('returns "Nữ" for FEMALE', () => {
      expect(genderLabel('FEMALE')).toBe('Nữ');
    });

    it('returns "Khác" for OTHER', () => {
      expect(genderLabel('OTHER')).toBe('Khác');
    });

    it('returns placeholder "—" for falsy values', () => {
      expect(genderLabel(null)).toBe('—');
      expect(genderLabel(undefined)).toBe('—');
      expect(genderLabel('')).toBe('—');
    });

    it('falls back to raw value for unrecognized gender codes', () => {
      expect(genderLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('studentStatusLabel', () => {
    it('maps ACTIVE to "Đang học"', () => {
      expect(studentStatusLabel('ACTIVE')).toBe('Đang học');
    });

    it('maps INACTIVE to "Ngừng học"', () => {
      expect(studentStatusLabel('INACTIVE')).toBe('Ngừng học');
    });

    it('maps GRADUATED to "Đã tốt nghiệp"', () => {
      expect(studentStatusLabel('GRADUATED')).toBe('Đã tốt nghiệp');
    });

    it('maps SUSPENDED to "Đình chỉ"', () => {
      expect(studentStatusLabel('SUSPENDED')).toBe('Đình chỉ');
    });

    it('returns placeholder "—" for missing values', () => {
      expect(studentStatusLabel(null)).toBe('—');
    });
  });

  describe('studentStatusBadgeClass', () => {
    it('returns appropriate badge class names', () => {
      expect(studentStatusBadgeClass('ACTIVE')).toBe('badge-success');
      expect(studentStatusBadgeClass('GRADUATED')).toBe('badge-info');
      expect(studentStatusBadgeClass('SUSPENDED')).toBe('badge-danger');
      expect(studentStatusBadgeClass('INACTIVE')).toBe('badge-neutral');
      expect(studentStatusBadgeClass('OTHER')).toBe('badge-neutral');
    });
  });
});
