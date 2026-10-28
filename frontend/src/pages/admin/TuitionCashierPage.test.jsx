// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TuitionCashierPage from './TuitionCashierPage';
import { tuitionService, semesterService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  tuitionService: {
    getOverview: vi.fn(),
    getStudentTuition: vi.fn(),
    collectCash: vi.fn(),
    collectBatchCash: vi.fn(),
    scanOverdue: vi.fn(),
    cancelOverdue: vi.fn(),
    extendDeadline: vi.fn(),
  },
  semesterService: {
    getAll: vi.fn(),
    openRegistration: vi.fn(),
    closeRegistration: vi.fn(),
  },
  studentService: {
    search: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('TuitionCashierPage - Danh Sách Học Phí & Công Nợ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSemesters = [
    {
      id: 1,
      semesterCode: 'HK1_2026',
      semesterName: 'Học kỳ 1 2026-2027',
      academicYear: '2026-2027',
      isCurrent: true,
      registrationOpen: false,
      tuitionDeadline: '2026-11-30',
    },
  ];

  const mockOverview = {
    semesterId: 1,
    semesterName: 'Học kỳ 1 2026-2027',
    academicYear: '2026-2027',
    totalStudents: 2,
    totalTuition: 5400000,
    totalCollected: 2700000,
    totalDebt: 2700000,
    students: [
      {
        studentId: 10,
        studentCode: '2300001',
        fullName: 'Nguyễn Văn A',
        className: 'K17-CNTT1',
        departmentName: 'Khoa Công nghệ thông tin',
        totalCourses: 2,
        totalCredits: 6,
        totalAmount: 2700000,
        paidAmount: 2700000,
        unpaidAmount: 0,
        status: 'PAID',
      },
      {
        studentId: 11,
        studentCode: '2300002',
        fullName: 'Trần Thị B',
        className: 'K17-CNTT2',
        departmentName: 'Khoa Công nghệ thông tin',
        totalCourses: 2,
        totalCredits: 6,
        totalAmount: 2700000,
        paidAmount: 0,
        unpaidAmount: 2700000,
        status: 'UNPAID',
      },
    ],
  };

  it('renders student tuition roster by default with KPI summary cards', async () => {
    semesterService.getAll.mockResolvedValueOnce({ data: { data: mockSemesters } });
    tuitionService.getOverview.mockResolvedValueOnce({ data: { data: mockOverview } });
    tuitionService.scanOverdue.mockResolvedValueOnce({ data: { data: [] } });

    render(<TuitionCashierPage />);

    // Check default active tab
    expect(screen.getByText('Danh Sách Học Phí & Công Nợ')).toBeDefined();

    // Check KPI Cards and Students
    await waitFor(() => {
      expect(screen.getByText('Tổng sinh viên phát sinh học phí')).toBeDefined();
      expect(screen.getByText('Tổng công nợ còn lại')).toBeDefined();
      expect(screen.getByText('2300001')).toBeDefined();
      expect(screen.getByText('Nguyễn Văn A')).toBeDefined();
      expect(screen.getByText('2300002')).toBeDefined();
      expect(screen.getByText('Trần Thị B')).toBeDefined();
    });
  });

  it('filters students by search input in the roster', async () => {
    semesterService.getAll.mockResolvedValueOnce({ data: { data: mockSemesters } });
    tuitionService.getOverview.mockResolvedValueOnce({ data: { data: mockOverview } });
    tuitionService.scanOverdue.mockResolvedValueOnce({ data: { data: [] } });

    render(<TuitionCashierPage />);

    await waitFor(() => {
      expect(screen.getByText('2300001')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Tìm theo MSSV, Họ tên, Lớp...');
    fireEvent.change(searchInput, { target: { value: '2300002' } });

    expect(screen.queryByText('2300001')).toBeNull();
    expect(screen.getByText('2300002')).toBeDefined();
  });

  it('switches to Cashier Desk when clicking Thu tiền on a student', async () => {
    semesterService.getAll.mockResolvedValueOnce({ data: { data: mockSemesters } });
    tuitionService.getOverview.mockResolvedValueOnce({ data: { data: mockOverview } });
    tuitionService.scanOverdue.mockResolvedValueOnce({ data: { data: [] } });
    tuitionService.getStudentTuition.mockResolvedValueOnce({
      data: {
        data: {
          studentId: 11,
          studentCode: '2300002',
          fullName: 'Trần Thị B',
          className: 'K17-CNTT2',
          totalCredits: 6,
          totalAmount: 2700000,
          paidAmount: 0,
          unpaidAmount: 2700000,
          overallStatus: 'UNPAID',
          items: [],
        },
      },
    });

    render(<TuitionCashierPage />);

    await waitFor(() => {
      expect(screen.getByText('2300002')).toBeDefined();
    });

    const collectButtons = screen.getAllByRole('button', { name: /Thu tiền/i });
    fireEvent.click(collectButtons[1]); // Click second student (2300002)

    await waitFor(() => {
      expect(tuitionService.getStudentTuition).toHaveBeenCalledWith(11, 1);
    });
  });

  it('opens extension modal and submits 7-day tuition extension', async () => {
    semesterService.getAll.mockResolvedValueOnce({ data: { data: mockSemesters } });
    tuitionService.getOverview.mockResolvedValueOnce({ data: { data: mockOverview } });
    tuitionService.scanOverdue.mockResolvedValueOnce({ data: { data: [] } });
    tuitionService.extendDeadline.mockResolvedValueOnce({
      data: { success: true, message: 'Đã gia hạn thành công' },
    });

    render(<TuitionCashierPage />);

    await waitFor(() => {
      expect(screen.getByText('2300002')).toBeDefined();
    });

    const extendButtons = screen.getAllByRole('button', { name: /Gia hạn/i });
    expect(extendButtons.length).toBeGreaterThan(0);
    fireEvent.click(extendButtons[0]);

    // Modal should be visible
    expect(screen.getByText('Gia Hạn Nộp Học Phí Cho Sinh Viên')).toBeDefined();
    expect(screen.getByText('Số ngày gia hạn thêm:')).toBeDefined();

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Cấp Gia Hạn/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(tuitionService.extendDeadline).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 11,
          semesterId: 1,
          days: 7,
        })
      );
    });
  });

  it('shows 100% payment requirement badge and extension button in Cashier Desk', async () => {
    semesterService.getAll.mockResolvedValueOnce({ data: { data: mockSemesters } });
    tuitionService.getOverview.mockResolvedValueOnce({ data: { data: mockOverview } });
    tuitionService.scanOverdue.mockResolvedValueOnce({ data: { data: [] } });
    tuitionService.getStudentTuition.mockResolvedValueOnce({
      data: {
        data: {
          studentId: 11,
          studentCode: '2300002',
          fullName: 'Trần Thị B',
          className: 'K17-CNTT2',
          semesterName: 'Học kỳ 1 2026-2027',
          totalCredits: 3,
          totalAmount: 1350000,
          paidAmount: 0,
          unpaidAmount: 1350000,
          overallStatus: 'UNPAID',
          isExtended: true,
          extendedDeadline: '2026-12-07',
          extensionReason: 'Đơn xin hoãn nộp học phí',
          items: [
            {
              invoiceId: 101,
              sectionCode: 'CS101.01',
              subjectName: 'Lập trình căn bản',
              credits: 3,
              baseRate: 450000,
              amount: 1350000,
              status: 'UNPAID',
            },
          ],
        },
      },
    });

    render(<TuitionCashierPage />);

    await waitFor(() => {
      expect(screen.getByText('2300002')).toBeDefined();
    });

    const collectButtons = screen.getAllByRole('button', { name: /Thu tiền/i });
    fireEvent.click(collectButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Quy chế: Bắt buộc hoàn tất 100% học phí')).toBeDefined();
      expect(screen.getByText('Sinh viên đang trong diện gia hạn nộp học phí')).toBeDefined();
      expect(screen.getByRole('button', { name: /Gia Hạn 1 Tuần/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Xác Nhận Đã Thu Tiền Mặt \(100%\)/i })).toBeDefined();
    });
  });

  it('selects unpaid student and submits batch cash payment', async () => {
    semesterService.getAll.mockResolvedValueOnce({ data: { data: mockSemesters } });
    tuitionService.getOverview.mockResolvedValue({ data: { data: mockOverview } });
    tuitionService.scanOverdue.mockResolvedValueOnce({ data: { data: [] } });
    tuitionService.collectBatchCash.mockResolvedValueOnce({
      data: {
        data: {
          totalSuccessStudents: 1,
          totalAmount: 2700000,
          receipts: [
            {
              receiptNumber: 'PT-2300002-261024-1',
              studentCode: '2300002',
              studentName: 'Trần Thị B',
              totalAmount: 2700000,
              paymentMethod: 'TIỀN MẶT (CASH)',
            },
          ],
        },
      },
    });

    render(<TuitionCashierPage />);

    await waitFor(() => {
      expect(screen.getByText('2300002')).toBeDefined();
    });

    // Checkbox for unpaid student (studentId: 11)
    const checkboxes = screen.getAllByRole('checkbox');
    // checkbox[0] is header select all, checkbox[1] is student 10 (PAID, disabled), checkbox[2] is student 11 (UNPAID)
    expect(checkboxes[1].disabled).toBe(true); // student 10 already paid
    expect(checkboxes[2].disabled).toBe(false);

    // Select unpaid student
    fireEvent.click(checkboxes[2]);

    // Action bar appears with "Thu tiền mặt hàng loạt (1)" button
    await waitFor(() => {
      expect(screen.getByText(/Đã chọn/i)).toBeDefined();
    });

    const openBatchModalBtn = screen.getByRole('button', { name: /Xác nhận thu tiền \(1\)/i });
    fireEvent.click(openBatchModalBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Xác Nhận Thu Tiền Mặt Hàng Loạt')).toBeDefined();
      expect(screen.getByText('TIỀN MẶT (CASH)')).toBeDefined();
    });

    // Confirm batch cash payment
    const confirmBtn = screen.getByRole('button', { name: /Xác Nhận Thu 2\.700\.000 VNĐ/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(tuitionService.collectBatchCash).toHaveBeenCalledWith({
        semesterId: 1,
        studentIds: [11],
        note: 'Thu tiền mặt hàng loạt tại Phòng Đào tạo',
      });
    });
  });
});
