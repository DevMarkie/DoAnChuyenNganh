import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CurriculumRoadmapPage from './CurriculumRoadmapPage';
import { curriculumService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  curriculumService: {
    getMine: vi.fn(),
    getMyPrerequisiteGraph: vi.fn(),
    getMyDegreeAudit: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('CurriculumRoadmapPage Component', () => {
  const mockCurriculum = {
    program: {
      name: 'Chương trình Đào tạo CNTT K18',
      cohort: { code: 'K18' },
      major: { name: 'Công nghệ thông tin' },
    },
    progress: {
      requiredCredits: 130,
      completedCredits: 90,
      inProgressCredits: 15,
      remainingCredits: 25,
      completionPercent: 69.2,
    },
    blocks: [
      {
        id: 1,
        code: 'GDDC',
        name: 'Giáo dục đại cương',
        type: 'COMPULSORY',
        completedCredits: 30,
        requiredCredits: 30,
        completed: true,
        subjects: [
          {
            id: 101,
            code: 'MATH101',
            name: 'Giải tích 1',
            credits: 3,
            status: 'PASSED',
            grade: { letterGrade: 'A', gpaPoint: 4.0 },
            prerequisites: [],
          },
        ],
      },
    ],
  };

  const mockGraph = {
    majorCode: 'IT',
    majorName: 'Công nghệ thông tin',
    nodes: [
      {
        id: 101,
        code: 'CS101',
        name: 'Nhập môn lập trình',
        credits: 3,
        level: 1,
        status: 'PASSED',
        directPrerequisites: [],
        missingPrerequisites: [],
      },
      {
        id: 102,
        code: 'CS102',
        name: 'Kỹ thuật lập trình',
        credits: 3,
        level: 2,
        status: 'ELIGIBLE',
        directPrerequisites: ['CS101'],
        missingPrerequisites: [],
      },
    ],
    edges: [{ source: 101, target: 102 }],
  };

  const mockAudit = {
    isGraduationEligible: false,
    auditCpa: 3.45,
    officialCpa: 3.20,
    totalRequiredCredits: 130,
    totalCompletedCredits: 90,
    totalCompulsoryCredits: 100,
    completedCompulsoryCredits: 70,
    totalElectiveCreditsRequired: 30,
    completedElectiveCreditsAccepted: 20,
    excessElectiveCredits: 6,
    unsatisfiedReasons: ['Chưa hoàn thành khối chuyên ngành bắt buộc', 'Còn thiếu 10 tín chỉ tự chọn'],
    blocks: [],
    excessElectives: [
      {
        subjectId: 999,
        subjectCode: 'ELEC-EX',
        subjectName: 'Môn tự chọn thừa',
        credits: 3,
        letterGrade: 'C',
        gpaPoint: 2.0,
        auditNote: 'Tự chọn thừa / Cải thiện điểm',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    curriculumService.getMine.mockResolvedValue({ data: { data: mockCurriculum } });
    curriculumService.getMyPrerequisiteGraph.mockResolvedValue({ data: { data: mockGraph } });
    curriculumService.getMyDegreeAudit.mockResolvedValue({ data: { data: mockAudit } });
  });

  it('renders standard block list view by default', async () => {
    render(<CurriculumRoadmapPage />);

    await waitFor(() => {
      expect(screen.getByText('Chương trình Đào tạo CNTT K18')).toBeDefined();
      expect(screen.getByText('Giáo dục đại cương')).toBeDefined();
      expect(screen.getByText('Giải tích 1')).toBeDefined();
    });
  });

  it('switches to Interactive DAG Graph tab and renders nodes', async () => {
    render(<CurriculumRoadmapPage />);

    await waitFor(() => {
      expect(screen.getByText('Chương trình Đào tạo CNTT K18')).toBeDefined();
    });

    const graphTabBtn = screen.getByRole('button', { name: /Sơ đồ cây tiên quyết/i });
    fireEvent.click(graphTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Tầng 1: Nhập môn & Đại cương')).toBeDefined();
      expect(screen.getByText('Nhập môn lập trình')).toBeDefined();
      expect(screen.getByText('Kỹ thuật lập trình')).toBeDefined();
    });
  });

  it('switches to Degree Audit tab and displays Best-Grade optimization metrics', async () => {
    render(<CurriculumRoadmapPage />);

    await waitFor(() => {
      expect(screen.getByText('Chương trình Đào tạo CNTT K18')).toBeDefined();
    });

    const auditTabBtn = screen.getByRole('button', { name: /Kiểm toán tốt nghiệp/i });
    fireEvent.click(auditTabBtn);

    await waitFor(() => {
      expect(screen.getByText('CHƯA ĐỦ ĐIỀU KIỆN TỐT NGHIỆP')).toBeDefined();
      expect(screen.getByText('3.45')).toBeDefined(); // Best-Grade Audit CPA
      expect(screen.getByText(/Chưa hoàn thành khối chuyên ngành bắt buộc/i)).toBeDefined();
      expect(screen.getByText('Môn tự chọn thừa')).toBeDefined();
    });
  });
});
