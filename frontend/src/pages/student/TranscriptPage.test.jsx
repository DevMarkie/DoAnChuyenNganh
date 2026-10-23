import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TranscriptPage from './TranscriptPage';
import { transcriptService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  transcriptService: {
    getMyTranscript: vi.fn(),
  },
  gradeAppealService: {
    getMine: vi.fn().mockResolvedValue({ data: { data: [] } }),
    create: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('TranscriptPage - Academic Warning & Advisor Contact Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTranscriptWarning1 = {
    studentId: 1,
    studentCode: '2300001',
    studentName: 'Đoàn Đình Bách',
    className: 'K16-SE1',
    cumulativeGpa: 1.85,
    academicStanding: 'Yếu',
    warningLevel: 1,
    warningNotice: 'GPA học kỳ < 1.0',
    totalCredits: 35,
    completedCourses: 12,
    semesters: [],
    advisorContact: {
      advisorName: 'TS. Nguyễn Hoàng Long',
      advisorCode: '1000001',
      advisorEmail: '1000001@sms.edu.vn',
      advisorPhone: '0912345001',
      advisorDegree: 'TS',
      specialization: 'Kỹ thuật phần mềm & Kiến trúc hệ thống phân tán',
      consultationHours: 'Thứ 2 & Thứ 4 (14h00 - 16h30)',
      advisorOffice: 'Phòng 402 - Tòa nhà A1',
      departmentName: 'Khoa Công nghệ Thông tin & Máy tính',
      departmentCode: 'CNTT',
      assistantName: 'ThS. Hoàng Văn Nam (Trợ lý Giáo vụ)',
      assistantEmail: 'vpk.cntt@sms.edu.vn',
      assistantPhone: '(024) 3754 7501',
      departmentOffice: 'Văn phòng Khoa CNTT - P.302 Tòa nhà A1',
      studentSupportNotes: 'Sinh viên đang thuộc diện Cảnh báo học vụ Mức 1.',
    },
  };

  const mockTranscriptNormal = {
    studentId: 2,
    studentCode: '2300002',
    studentName: 'Vũ Đình Bách',
    className: 'K16-SE1',
    cumulativeGpa: 3.45,
    academicStanding: 'Giỏi',
    warningLevel: 0,
    warningNotice: null,
    totalCredits: 60,
    completedCourses: 20,
    semesters: [],
    advisorContact: null,
  };

  it('renders warning alert and advisor contact button when student is under warning level 1', async () => {
    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockTranscriptWarning1 },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByText(/CẢNH BÁO KẾT QUẢ HỌC TẬP \(MỨC 1\)/i)).toBeDefined();
    });

    const contactBtn = screen.getByRole('button', { name: /Liên hệ Cố vấn học tập/i });
    expect(contactBtn).toBeDefined();
  });

  it('does NOT render warning banner or contact button when warningLevel is 0', async () => {
    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockTranscriptNormal },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByText('Vũ Đình Bách')).toBeDefined();
    });

    expect(screen.queryByText(/CẢNH BÁO KẾT QUẢ HỌC TẬP/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Liên hệ Cố vấn học tập/i })).toBeNull();
  });

  it('opens advisor modal when clicking contact button and shows advisor & faculty info', async () => {
    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockTranscriptWarning1 },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Liên hệ Cố vấn học tập/i })).toBeDefined();
    });

    const contactBtn = screen.getByRole('button', { name: /Liên hệ Cố vấn học tập/i });
    fireEvent.click(contactBtn);

    // Modal is opened
    expect(screen.getByText('Hỗ Trợ Học Vụ & Cố Vấn Học Tập')).toBeDefined();
    expect(screen.getByText(/Cố Vấn Học Tập Phụ Trách Lớp K16-SE1/i)).toBeDefined();
    expect(screen.getByText('TS. Nguyễn Hoàng Long')).toBeDefined();
    expect(screen.getByText('1000001@sms.edu.vn')).toBeDefined();
    expect(screen.getByText('0912345001')).toBeDefined();
    expect(screen.getByText('Phòng 402 - Tòa nhà A1')).toBeDefined();
    expect(screen.getByText('Thứ 2 & Thứ 4 (14h00 - 16h30)')).toBeDefined();

    // Faculty assistant info
    expect(screen.getByText('Khoa Công nghệ Thông tin & Máy tính')).toBeDefined();
    expect(screen.getByText('ThS. Hoàng Văn Nam (Trợ lý Giáo vụ)')).toBeDefined();
    expect(screen.getByText('vpk.cntt@sms.edu.vn')).toBeDefined();

    // 4 action steps
    expect(screen.getByText(/4 Bước sinh viên cần thực hiện ngay để gỡ cảnh báo/i)).toBeDefined();
    expect(screen.getByText(/Gặp Cố vấn học tập:/i)).toBeDefined();
    expect(screen.getByText(/Đăng ký học lại \/ cải thiện:/i)).toBeDefined();

    // Close modal via footer button
    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    fireEvent.click(closeBtn);

    // Modal is closed
    expect(screen.queryByText('Hỗ Trợ Học Vụ & Cố Vấn Học Tập')).toBeNull();
  });

  it('renders advisor modal when student has warning level 2', async () => {
    const mockTranscriptWarning2 = {
      ...mockTranscriptWarning1,
      warningLevel: 2,
      warningNotice: 'GPA học kỳ < 1.0 và CPA tích lũy < 2.0',
    };

    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockTranscriptWarning2 },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByText(/CẢNH BÁO KẾT QUẢ HỌC TẬP \(MỨC 2\)/i)).toBeDefined();
    });

    const contactBtn = screen.getByRole('button', { name: /Liên hệ Cố vấn học tập/i });
    fireEvent.click(contactBtn);

    expect(screen.getByText('Hỗ Trợ Học Vụ & Cố Vấn Học Tập')).toBeDefined();
    expect(screen.getByText(/Thông tin hỗ trợ dành cho sinh viên diện Cảnh báo Mức 2/i)).toBeDefined();
  });
});
