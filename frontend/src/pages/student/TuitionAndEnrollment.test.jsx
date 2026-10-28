import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyEnrollmentsPage from './MyEnrollmentsPage';
import EnrollPage from './EnrollPage';
import { enrollmentService, semesterService, courseSectionService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  enrollmentService: {
    getMyEnrollments: vi.fn(),
    cancel: vi.fn(),
    enroll: vi.fn(),
  },
  semesterService: {
    getAll: vi.fn(),
    getCurrent: vi.fn(),
  },
  courseSectionService: {
    getOpenBySemester: vi.fn(),
  },
  tuitionService: {
    getMyTuition: vi.fn().mockResolvedValue({ data: { data: null } }),
    simulatePay: vi.fn().mockResolvedValue({ data: { message: 'Thanh toán giả lập thành công' } }),
  },
  registrationWaveService: {
    getCurrentActive: vi.fn().mockResolvedValue({ data: { data: null } }),
    getMyStatus: vi.fn().mockResolvedValue({ data: { data: null } }),
  },
  transcriptService: {
    getMyTranscript: vi.fn().mockResolvedValue({ data: { data: null } }),
  },
}));

vi.mock('../../store/authStore', () => ({
  default: () => ({
    user: { username: '2300001', role: 'STUDENT', fullName: 'Đoàn Đình Bách' },
  }),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('MyEnrollmentsPage - Tra Cứu Công Nợ & Học Phí', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSemesters = [
    {
      id: 4,
      semesterCode: 'HK1-2026',
      semesterName: 'Học kỳ 1 (2026-2027)',
      academicYear: '2026-2027',
      isCurrent: true,
      registrationOpen: true,
      registrationEnd: '2026-10-30',
      endDate: '2027-01-15',
    },
  ];

  const mockEnrollments = [
    {
      id: 101,
      status: 'ENROLLED',
      enrolledAt: '2026-10-16T08:00:00',
      courseSection: {
        id: 37,
        sectionCode: 'IT301-01',
        semester: mockSemesters[0],
        subject: { id: 1, subjectName: 'Phát triển ứng dụng Web', credits: 3 },
      },
    },
    {
      id: 102,
      status: 'COMPLETED',
      enrolledAt: '2026-10-16T08:15:00',
      courseSection: {
        id: 38,
        sectionCode: 'IT304-01',
        semester: mockSemesters[0],
        subject: { id: 2, subjectName: 'Công nghệ phần mềm', credits: 3 },
      },
    },
    {
      id: 103,
      status: 'CANCELLED',
      enrolledAt: '2026-10-16T09:00:00',
      courseSection: {
        id: 39,
        sectionCode: 'IT305-01',
        semester: mockSemesters[0],
        subject: { id: 3, subjectName: 'Kiểm thử phần mềm', credits: 3 },
      },
    },
  ];

  it('renders tuition headers, 4 Bento cards, and 3 payment statuses (Chưa nộp / Đã nộp / Đã bị hủy)', async () => {
    enrollmentService.getMyEnrollments.mockResolvedValue({ data: { data: mockEnrollments } });
    semesterService.getAll.mockResolvedValue({ data: { data: mockSemesters } });

    render(<MyEnrollmentsPage />);

    // Check main title
    await waitFor(() => {
      expect(screen.getByText('Tra Cứu Công Nợ & Học Phí')).toBeDefined();
    });

    // Check 4 Bento cards
    expect(screen.getByText(/Tổng phát sinh/i)).toBeDefined();
    expect(screen.getByText('Học phí đã thanh toán')).toBeDefined();
    expect(screen.getByText(/Công nợ còn phải nộp|Đã hoàn tất học phí/i)).toBeDefined();
    expect(screen.getAllByText(/Hạn chót đóng tiền mặt/i).length).toBeGreaterThan(0);

    // Check course list and 3 statuses
    expect(screen.getByText('Phát triển ứng dụng Web')).toBeDefined();
    expect(screen.getByText('Công nghệ phần mềm')).toBeDefined();
    expect(screen.getByText('Kiểm thử phần mềm')).toBeDefined();

    expect(screen.getByText('Chưa nộp')).toBeDefined();
    expect(screen.getByText('Đã nộp')).toBeDefined();
    expect(screen.getByText('Đã bị hủy')).toBeDefined();
  });

  it('opens Cash payment instructions modal when clicking Đóng tiền mặt', async () => {
    enrollmentService.getMyEnrollments.mockResolvedValue({ data: { data: mockEnrollments } });
    semesterService.getAll.mockResolvedValue({ data: { data: mockSemesters } });

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Đóng tiền mặt')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Đóng tiền mặt'));

    expect(screen.getByText('Hướng Dẫn Nộp Tiền Mặt Tại Trường')).toBeDefined();
    expect(screen.getByText(/Phòng Tài chính - Kế toán/i)).toBeDefined();
  });

  it('opens VietQR modal when clicking Mã VietQR', async () => {
    enrollmentService.getMyEnrollments.mockResolvedValue({ data: { data: mockEnrollments } });
    semesterService.getAll.mockResolvedValue({ data: { data: mockSemesters } });

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Mã VietQR')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Mã VietQR'));

    expect(screen.getByText('Mã VietQR Thanh Toán Học Phí')).toBeDefined();
    expect(screen.getByAltText('VietQR Học phí')).toBeDefined();
  });
});

describe('EnrollPage - Đăng ký & Hủy môn khi cổng mở', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOpenSemester = {
    id: 4,
    semesterCode: 'HK1-2026',
    semesterName: 'Học kỳ 1 (2026-2027)',
    registrationOpen: true,
  };

  const mockSections = [
    {
      id: 37,
      sectionCode: 'IT301-01',
      maxStudents: 40,
      currentStudents: 25,
      subject: { id: 1, subjectName: 'Phát triển ứng dụng Web', credits: 3 },
      lecturer: { fullName: 'TS. Nguyễn Văn A' },
      schedule: 'Thứ 2 (07:00-09:35)',
      room: 'A1-203',
    },
    {
      id: 40,
      sectionCode: 'IT401-01',
      maxStudents: 40,
      currentStudents: 20,
      subject: { id: 4, subjectName: 'An toàn thông tin', credits: 3 },
      lecturer: { fullName: 'TS. Trần Thị B' },
      schedule: 'Thứ 4 (09:45-12:20)',
      room: 'Online (Zoom)',
    },
  ];

  const mockEnrollments = [
    {
      id: 101,
      status: 'ENROLLED',
      courseSection: {
        id: 37,
        semester: mockOpenSemester,
        subject: { id: 1, credits: 3 },
      },
    },
  ];

  it('shows Đã ĐK and Hủy môn button for enrolled section when registration is open', async () => {
    semesterService.getCurrent.mockResolvedValue({ data: { data: mockOpenSemester } });
    enrollmentService.getMyEnrollments.mockResolvedValue({ data: { data: mockEnrollments } });
    courseSectionService.getOpenBySemester.mockResolvedValue({ data: { data: mockSections } });

    render(<EnrollPage />);

    await waitFor(() => {
      expect(screen.getByText('Đăng Ký Học Phần Trực Tuyến')).toBeDefined();
    });

    // IT301-01 is enrolled: should show "Đã ĐK" and "Hủy môn"
    expect(screen.getByText('Đã ĐK')).toBeDefined();
    expect(screen.getByText('Hủy môn')).toBeDefined();

    // IT401-01 is not enrolled: should show "Đăng ký môn"
    expect(screen.getByText('Đăng ký môn')).toBeDefined();
  });
});
