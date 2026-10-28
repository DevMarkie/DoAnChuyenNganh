import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentCheckInModal from './StudentCheckInModal';
import { attendanceService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  attendanceService: {
    checkIn: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('StudentCheckInModal Component', () => {
  const mockCourseSection = {
    id: 105,
    sectionCode: 'IT301-03',
    subject: { subjectName: 'Phát triển ứng dụng Web' },
    room: 'A205',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders check-in input and subject details', () => {
    render(
      <StudentCheckInModal
        courseSection={mockCourseSection}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Điểm danh buổi học')).toBeDefined();
    expect(screen.getByText('Phát triển ứng dụng Web')).toBeDefined();
    expect(screen.getByPlaceholderText('VD: 842911')).toBeDefined();
  });

  it('submits code successfully and triggers onSuccess', async () => {
    const onSuccess = vi.fn();
    attendanceService.checkIn.mockResolvedValueOnce({
      data: {
        message: 'Điểm danh thành công! Bạn đã được ghi nhận có mặt.',
      },
    });

    render(
      <StudentCheckInModal
        courseSection={mockCourseSection}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    const input = screen.getByPlaceholderText('VD: 842911');
    fireEvent.change(input, { target: { value: 'code99' } });
    expect(input.value).toBe('CODE99');

    const submitBtn = screen.getByText('Xác nhận điểm danh');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(attendanceService.checkIn).toHaveBeenCalledWith({
        code: 'CODE99',
        sectionId: 105,
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(screen.getByText(/Điểm danh thành công/)).toBeDefined();
    });
  });

  it('displays error message when check-in fails', async () => {
    attendanceService.checkIn.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Mã điểm danh không đúng hoặc bạn không thuộc lớp học này',
        },
      },
    });

    render(
      <StudentCheckInModal
        courseSection={mockCourseSection}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('VD: 842911');
    fireEvent.change(input, { target: { value: 'WRONG' } });

    fireEvent.click(screen.getByText('Xác nhận điểm danh'));

    await waitFor(() => {
      expect(screen.getByText('Mã điểm danh không đúng hoặc bạn không thuộc lớp học này')).toBeDefined();
    });
  });
});
