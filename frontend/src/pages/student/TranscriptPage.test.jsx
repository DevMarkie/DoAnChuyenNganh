import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TranscriptPage from './TranscriptPage';
import { transcriptService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  transcriptService: {
    getMyTranscript: vi.fn(),
  },
  studentService: {
    getGraduationEligibility: vi.fn().mockResolvedValue({ data: { data: null } }),
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

describe('TranscriptPage - Clean Student Portal View', () => {
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
    semesters: [
      {
        semesterId: 1,
        semesterName: 'Học kỳ 1',
        academicYear: '2023-2024',
        semesterGpa: 1.85,
        semesterClassification: 'Yếu',
        isSemesterWarning: true,
        semesterCredits: 15,
        courses: [
          {
            enrollmentId: 101,
            subjectCode: 'INT1001',
            subjectName: 'Nhập môn lập trình',
            credits: 3,
            cc1Score: 8.0,
            cc2Score: 7.5,
            midtermScore: 6.0,
            finalScore: 5.0,
            totalScore: 5.9,
            gpaPoint: 2.0,
            letterGrade: 'C',
            finalizedAt: new Date().toISOString(),
          },
        ],
      },
    ],
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
  };

  it('renders warning alert banner when warningLevel > 0 without advisor contact button', async () => {
    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockTranscriptWarning1 },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByText(/CẢNH BÁO KẾT QUẢ HỌC TẬP \(MỨC 1\)/i)).toBeDefined();
    });

    // Advisor button and modal must NOT be rendered (Feature 6 removed)
    expect(screen.queryByRole('button', { name: /Liên hệ Cố vấn học tập/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Cố vấn học tập/i })).toBeNull();
    expect(screen.queryByText('Hỗ Trợ Học Vụ & Cố Vấn Học Tập')).toBeNull();
  });

  it('does NOT render warning banner when warningLevel is 0', async () => {
    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockTranscriptNormal },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByText('Vũ Đình Bách')).toBeDefined();
    });

    expect(screen.queryByText(/CẢNH BÁO KẾT QUẢ HỌC TẬP/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Cố vấn học tập/i })).toBeNull();
  });

  it('renders grouped grade columns and GPA tạm tính without grade appeal buttons', async () => {
    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockTranscriptWarning1 },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByText('Nhập môn lập trình')).toBeDefined();
    });

    // Verify 3 core grade column headers
    expect(screen.getByText(/Điểm Quá Trình \(40%\)/i)).toBeDefined();
    expect(screen.getByText(/Điểm Thi \(60%\)/i)).toBeDefined();
    expect(screen.getByText(/Tổng Kết Môn/i)).toBeDefined();

    // Verify GPA Tạm tính badge
    expect(screen.getByText(/GPA Tạm tính: 1.85/i)).toBeDefined();

    // Grade appeal button must NOT be rendered (Feature 3 removed)
    expect(screen.queryByRole('button', { name: /Phúc khảo/i })).toBeNull();
    expect(screen.queryByText(/Đang phúc khảo/i)).toBeNull();
  });

  it('renders semesters in descending order with current semester badge on top and courses sorted A-Z', async () => {
    const mockMultiSemTranscript = {
      ...mockTranscriptNormal,
      semesters: [
        {
          semesterId: 1,
          semesterName: 'Học kỳ 1',
          academicYear: '2023-2024',
          semesterGpa: 3.2,
          semesterCredits: 15,
          courses: [
            { subjectCode: 'BS102', subjectName: 'Đại số tuyến tính', credits: 3, cc1Score: 8, cc2Score: 8, midtermScore: 8, finalScore: 8, totalScore: 8, letterGrade: 'B+', gpaPoint: 3.5, isFinalized: true },
            { subjectCode: 'BS101', subjectName: 'Giải tích 1', credits: 3, cc1Score: 8, cc2Score: 8, midtermScore: 8, finalScore: 8, totalScore: 8, letterGrade: 'B+', gpaPoint: 3.5, isFinalized: true },
          ],
        },
        {
          semesterId: 7,
          semesterName: 'Học kỳ 1',
          academicYear: '2026-2027',
          semesterGpa: null,
          semesterCredits: 12,
          isOngoing: true,
          publishNotice: 'Học kỳ đang diễn ra (01/09/2026 – 15/01/2027) — Điểm các môn học sẽ được công bố sau ngày kết thúc học kỳ.',
          courses: [
            { subjectCode: 'IT306', subjectName: 'Điện toán đám mây & DevOps', credits: 3, cc1Score: 7, cc2Score: 7, midtermScore: 7, finalScore: null, totalScore: null, letterGrade: null, gpaPoint: null, isFinalized: false },
            { subjectCode: 'IT305', subjectName: 'An toàn thông tin', credits: 3, cc1Score: 8, cc2Score: 8, midtermScore: 8, finalScore: null, totalScore: null, letterGrade: null, gpaPoint: null, isFinalized: false },
          ],
        },
      ],
    };

    transcriptService.getMyTranscript.mockResolvedValueOnce({
      data: { data: mockMultiSemTranscript },
    });

    render(<TranscriptPage />);

    await waitFor(() => {
      expect(screen.getByText(/Học kỳ 1 \(2026-2027\)/)).toBeDefined();
    });

    // Verify current semester badge
    expect(screen.getByText('Học kỳ hiện tại')).toBeDefined();

    // Verify ongoing semester banner
    expect(screen.getByText(/Học kỳ đang diễn ra/i)).toBeDefined();

    // Verify semesters order: semester 7 appears before semester 1
    const headers = screen.getAllByRole('heading', { level: 3 });
    const semesterHeaderTexts = headers.map((h) => h.textContent);
    expect(semesterHeaderTexts[0]).toContain('2026-2027');
    expect(semesterHeaderTexts[1]).toContain('2023-2024');

    // Verify course order in semester 7: IT305 appears before IT306
    const it305 = screen.getByText('IT305');
    const it306 = screen.getByText('IT306');
    expect(it305.compareDocumentPosition(it306) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
