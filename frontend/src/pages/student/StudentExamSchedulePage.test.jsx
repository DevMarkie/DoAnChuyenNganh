import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentExamSchedulePage from './StudentExamSchedulePage';
import { examService, semesterService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  examService: {
    getMyExamSchedule: vi.fn(),
    exportMyExamIcs: vi.fn(),
  },
  semesterService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../../store/authStore', () => ({
  default: () => ({
    user: {
      username: '24010001',
      fullName: 'Nguyễn Văn An',
      role: 'STUDENT',
    },
  }),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('StudentExamSchedulePage Component', () => {
  const mockSemesters = [
    { id: 1, semesterName: 'Học kỳ 1 (2026-2027)', isCurrent: true },
    { id: 2, semesterName: 'Học kỳ 2 (2026-2027)', isCurrent: false },
  ];

  const mockExamSchedules = [
    {
      enrollmentId: 101,
      subjectId: 1,
      subjectCode: 'IT301',
      subjectName: 'Lập trình Web',
      credits: 3,
      sectionCode: 'IT301-01',
      attendanceStatus: 'QUALIFIED',
      absenceCount: 0,
      absentPeriods: 0,
      absentRate: 0.0,
      disqualified: false,
      hasExamSchedule: true,
      examDate: '2026-12-15',
      startTime: '07:30',
      endTime: '09:30',
      roomCode: 'P.201',
      roomLocation: 'Giảng đường A2',
      sbd: 'IT301-P01-001',
      score: 8.5,
    },
    {
      enrollmentId: 102,
      subjectId: 2,
      subjectCode: 'IT302',
      subjectName: 'Cơ sở dữ liệu nâng cao',
      credits: 3,
      sectionCode: 'IT302-01',
      attendanceStatus: 'QUALIFIED',
      absenceCount: 1,
      absentPeriods: 3,
      absentRate: 0.06,
      disqualified: false,
      hasExamSchedule: false,
      examDate: null,
      startTime: null,
      endTime: null,
      roomCode: null,
      sbd: null,
    },
    {
      enrollmentId: 103,
      subjectId: 3,
      subjectCode: 'MAT101',
      subjectName: 'Giải tích 1',
      credits: 4,
      sectionCode: 'MAT101-02',
      attendanceStatus: 'DISQUALIFIED',
      absenceCount: 6,
      absentPeriods: 18,
      absentRate: 0.30,
      disqualified: true,
      disqualifiedReason: 'Không đủ điều kiện dự thi do vắng quá 20% số tiết (18/60 tiết, 30%)',
      hasExamSchedule: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    semesterService.getAll.mockResolvedValue({ data: { data: mockSemesters } });
    examService.getMyExamSchedule.mockResolvedValue({ data: { data: mockExamSchedules } });
  });

  it('renders page header and statistics cards properly', async () => {
    render(<StudentExamSchedulePage />);

    expect(screen.getByText('Đang tải thông tin lịch thi...')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/Lịch Thi & Lịch Đánh Giá Học Kỳ/i)).toBeDefined();
    });

    // Check stats
    expect(screen.getByText('Học phần trong kỳ')).toBeDefined();
    expect(screen.getByText('Đã có lịch thi chính thức')).toBeDefined();
    expect(screen.getByText('Chờ xếp phòng & SBD')).toBeDefined();
    expect(screen.getByText('Bị cấm thi (vắng >20%)')).toBeDefined();

    // Check subjects rendered
    expect(screen.getByText('Lập trình Web')).toBeDefined();
    expect(screen.getByText('Cơ sở dữ liệu nâng cao')).toBeDefined();
    expect(screen.getByText('Giải tích 1')).toBeDefined();

    // Check badges
    expect(screen.getByText('ĐỦ ĐIỀU KIỆN')).toBeDefined();
    expect(screen.getByText('CHỜ XẾP LỊCH')).toBeDefined();
    expect(screen.getByText('CẤM THI')).toBeDefined();

    // Check SBD and Room
    expect(screen.getByText('IT301-P01-001')).toBeDefined();
    expect(screen.getByText('P.201')).toBeDefined();
  });

  it('can switch to table view', async () => {
    render(<StudentExamSchedulePage />);

    await waitFor(() => {
      expect(screen.getByText('Lập trình Web')).toBeDefined();
    });

    const tableButton = screen.getByTitle('Xem dạng bảng');
    fireEvent.click(tableButton);

    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText('Số Báo Danh')).toBeDefined();
  });

  it('filters courses by status', async () => {
    render(<StudentExamSchedulePage />);

    await waitFor(() => {
      expect(screen.getByText('Lập trình Web')).toBeDefined();
    });

    // Filter only scheduled
    const scheduledFilterBtn = screen.getByRole('button', { name: /Đã có lịch/i });
    fireEvent.click(scheduledFilterBtn);

    expect(screen.getByText('Lập trình Web')).toBeDefined();
    expect(screen.queryByText('Cơ sở dữ liệu nâng cao')).toBeNull();
    expect(screen.queryByText('Giải tích 1')).toBeNull();

    // Filter only disqualified
    const disqFilterBtn = screen.getByRole('button', { name: /Cấm thi/i });
    fireEvent.click(disqFilterBtn);

    expect(screen.queryByText('Lập trình Web')).toBeNull();
    expect(screen.getByText('Giải tích 1')).toBeDefined();
  });

  it('searches courses by keyword', async () => {
    render(<StudentExamSchedulePage />);

    await waitFor(() => {
      expect(screen.getByText('Lập trình Web')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm môn, SBD, phòng thi/i);
    fireEvent.change(searchInput, { target: { value: 'IT301' } });

    expect(screen.getByText('Lập trình Web')).toBeDefined();
    expect(screen.queryByText('Cơ sở dữ liệu nâng cao')).toBeNull();
  });
});
