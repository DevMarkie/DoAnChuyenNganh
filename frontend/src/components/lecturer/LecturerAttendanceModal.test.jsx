import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LecturerAttendanceModal from './LecturerAttendanceModal';
import { attendanceService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  attendanceService: {
    getLiveSession: vi.fn(),
    startSession: vi.fn(),
    saveSession: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('LecturerAttendanceModal Component', () => {
  const mockCourseSection = {
    id: 201,
    sectionCode: 'IT301-03',
    subject: { subjectName: 'Phát triển ứng dụng Web' },
    room: 'A205',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders start session UI when attendance has not started', async () => {
    attendanceService.getLiveSession.mockResolvedValueOnce({
      data: {
        data: {
          status: 'NOT_STARTED',
          attendanceKeyword: null,
          totalStudents: 30,
          presentCount: 0,
          absentCount: 30,
          students: [],
        },
      },
    });

    render(<LecturerAttendanceModal courseSection={mockCourseSection} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Bắt đầu phiên điểm danh hôm nay')).toBeDefined();
      expect(screen.getByText('Tạo mã điểm danh')).toBeDefined();
    });
  });

  it('renders open session with attendance keyword, counts and students', async () => {
    attendanceService.getLiveSession.mockResolvedValueOnce({
      data: {
        data: {
          status: 'OPEN',
          attendanceKeyword: 'WEB888',
          totalStudents: 2,
          presentCount: 1,
          absentCount: 1,
          students: [
            {
              enrollmentId: 1,
              studentCode: '25000001',
              fullName: 'Ngô Phương Anh',
              className: 'K18-CNTT1',
              present: true,
            },
            {
              enrollmentId: 2,
              studentCode: '25000002',
              fullName: 'Phan Mạnh Bảo',
              className: 'K18-CNTT1',
              present: false,
            },
          ],
        },
      },
    });

    render(<LecturerAttendanceModal courseSection={mockCourseSection} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('WEB888')).toBeDefined();
      expect(screen.getByText('Ngô Phương Anh')).toBeDefined();
      expect(screen.getByText('Phan Mạnh Bảo')).toBeDefined();
      expect(screen.getByText('Lưu điểm danh & Chốt sổ')).toBeDefined();
    });
  });

  it('calls startSession when clicking Tạo mã điểm danh', async () => {
    attendanceService.getLiveSession.mockResolvedValueOnce({
      data: {
        data: {
          status: 'NOT_STARTED',
          attendanceKeyword: null,
          students: [],
        },
      },
    });

    attendanceService.startSession.mockResolvedValueOnce({
      data: {
        data: {
          status: 'OPEN',
          attendanceKeyword: 'ABC123',
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          students: [],
        },
      },
    });

    render(<LecturerAttendanceModal courseSection={mockCourseSection} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Tạo mã điểm danh')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Tạo mã điểm danh'));

    await waitFor(() => {
      expect(attendanceService.startSession).toHaveBeenCalledWith({
        sectionId: 201,
        durationMinutes: 10,
      });
      expect(screen.getByText('ABC123')).toBeDefined();
    });
  });
});
