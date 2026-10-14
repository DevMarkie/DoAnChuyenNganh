import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton from './Skeleton';
import TableRowSkeleton from './TableRowSkeleton';
import LoadingFallback from './LoadingFallback';

describe('Common UI Components', () => {
  describe('Skeleton component', () => {
    it('renders with default width and height', () => {
      const { container } = render(<Skeleton />);
      const el = container.firstChild;
      expect(el).not.toBeNull();
      expect(el.className).toContain('skeleton');
      expect(el.style.width).toBe('100%');
      expect(el.style.height).toBe('20px');
      expect(el.style.borderRadius).toBe('4px');
    });

    it('renders with custom dimensions and classes', () => {
      const { container } = render(
        <Skeleton width="120px" height="30px" borderRadius="8px" className="custom-class" />
      );
      const el = container.firstChild;
      expect(el.className).toContain('skeleton');
      expect(el.className).toContain('custom-class');
      expect(el.style.width).toBe('120px');
      expect(el.style.height).toBe('30px');
      expect(el.style.borderRadius).toBe('8px');
    });
  });

  describe('TableRowSkeleton component', () => {
    it('renders correct number of rows and columns inside a table', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton rows={3} columns={4} />
          </tbody>
        </table>
      );
      const rows = container.querySelectorAll('tr');
      expect(rows.length).toBe(3);

      const cells = container.querySelectorAll('td');
      expect(cells.length).toBe(12);
    });
  });

  describe('LoadingFallback component', () => {
    it('renders loading indicators and descriptive texts', () => {
      render(<LoadingFallback />);
      expect(screen.getByText('Đang nạp phân hệ...')).toBeDefined();
      expect(screen.getByText('Tối ưu hóa tải trang thông minh')).toBeDefined();
    });
  });
});
