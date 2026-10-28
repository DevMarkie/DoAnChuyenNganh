import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentClassListModal from './StudentClassListModal';
import api from '../../services/api';
import { attendanceService } from '../../services/dataService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../services/dataService', () => ({
  attendanceService: {
    getStudentToday: vi.fn(),
    checkIn: vi.fn(),
  },
}));

vi.mock('../../store/authStore', () => ({
  default: () => ({
    user: {
      username: '2400001',
      studentId: 1,
    },
  }),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('StudentClassListModal Component', () => {
  const mockCourseSection = {
    id: 101,
    sectionCode: 'IT301-01-HK1-26',
    subject: { subjectName: 'Phát triển ứng dụng Web' },
    room: 'A101',
  };

  const mockStudents = [
    {
      id: 1,
      student: {
        id: 1,
        studentCode: '2400001',
        fullName: 'Hoàng Quang Anh',
      },
      absenceCount: 5,
    },
    {
      id: 2,
      student: {
        id: 2,
        studentCode: '2400002',
        fullName: 'Bùi Tuấn Bách',
      },
      absenceCount: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        data: mockStudents,
      },
    });
    attendanceService.getStudentToday.mockResolvedValue({
      data: {
        data: [],
      },
    });
  });

  it('renders modal header, student roster and default "Nhập mã điểm danh" button', async () => {
    render(
      <StudentClassListModal
        courseSection={mockCourseSection}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Học phần: Phát triển ứng dụng Web/i)).toBeDefined();
    expect(screen.getByText(/IT301-01-HK1-26/i)).toBeDefined();

    const checkInBtn = screen.getByRole('button', { name: /Nhập mã điểm danh/i });
    expect(checkInBtn).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Hoàng Quang')).toBeDefined();
      expect(screen.getByText('Anh')).toBeDefined();
      expect(screen.getByText('Bách')).toBeDefined();
      expect(screen.getByText('Bạn')).toBeDefined();
    });
  });

  it('renders "⚡ Điểm danh ngay" button when session is OPEN', async () => {
    const todayAttendance = {
      101: {
        sectionId: 101,
        sessionStatus: 'OPEN',
        isPresent: false,
      },
    };

    render(
      <StudentClassListModal
        courseSection={mockCourseSection}
        todayAttendance={todayAttendance}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      const checkInBtn = screen.getByRole('button', { name: /Điểm danh ngay/i });
      expect(checkInBtn).toBeDefined();
    });
  });

  it('renders "Đã có mặt hôm nay" badge when student is already marked present', async () => {
    const todayAttendance = {
      101: {
        sectionId: 101,
        sessionStatus: 'OPEN',
        isPresent: true,
      },
    };

    render(
      <StudentClassListModal
        courseSection={mockCourseSection}
        todayAttendance={todayAttendance}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Đã có mặt hôm nay/i)).toBeDefined();
      expect(screen.queryByRole('button', { name: /Nhập mã điểm danh/i })).toBeNull();
    });
  });

  it('opens StudentCheckInModal when clicking "Nhập mã điểm danh"', async () => {
    render(
      <StudentClassListModal
        courseSection={mockCourseSection}
        onClose={vi.fn()}
      />
    );

    const checkInBtn = screen.getByRole('button', { name: /Nhập mã điểm danh/i });
    fireEvent.click(checkInBtn);

    await waitFor(() => {
      expect(screen.getByText('Điểm danh buổi học')).toBeDefined();
      expect(screen.getByPlaceholderText('VD: 842911')).toBeDefined();
      expect(screen.getByRole('button', { name: /Xác nhận điểm danh/i })).toBeDefined();
    });
  });
});
