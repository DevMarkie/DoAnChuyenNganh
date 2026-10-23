import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GradeAnalyticsCard from './GradeAnalyticsCard';

describe('GradeAnalyticsCard Component', () => {
  const mockGrades = [
    {
      id: 1,
      totalScore: 9.0,
      letterGrade: 'A',
      gpaPoint: 4.0,
      enrollment: { student: { fullName: 'Nguyen Van A', studentCode: 'SV01' } },
    },
    {
      id: 2,
      totalScore: 7.5,
      letterGrade: 'B',
      gpaPoint: 3.0,
      enrollment: { student: { fullName: 'Tran Thi B', studentCode: 'SV02' } },
    },
    {
      id: 3,
      totalScore: 6.0,
      letterGrade: 'C',
      gpaPoint: 2.0,
      enrollment: { student: { fullName: 'Le Van C', studentCode: 'SV03' } },
    },
    {
      id: 4,
      totalScore: 5.2,
      letterGrade: 'D+',
      gpaPoint: 1.5,
      enrollment: { student: { fullName: 'Pham Van D', studentCode: 'SV04' } },
    },
    {
      id: 5,
      totalScore: 3.5,
      letterGrade: 'F',
      gpaPoint: 0.0,
      enrollment: { student: { fullName: 'Hoang Van E', studentCode: 'SV05' } },
    },
  ];

  it('renders nothing if grades array is empty', () => {
    const { container } = render(<GradeAnalyticsCard grades={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('calculates and displays summary statistics correctly', () => {
    render(<GradeAnalyticsCard grades={mockGrades} sectionTitle="LHP Tin học đại cương" />);

    // Header info
    expect(screen.getByText(/Phân Tích Phổ Điểm & Kiểm Định Chất Lượng/i)).toBeTruthy();
    expect(screen.getByText(/LHP Tin học đại cương/i)).toBeTruthy();

    // Summary metric cards
    expect(screen.getByText('Điểm TB (Hệ 10)')).toBeTruthy();
    expect(screen.getByText('GPA TB (Hệ 4)')).toBeTruthy();
    expect(screen.getByText('Cao nhất (Max)')).toBeTruthy();
    expect(screen.getByText('Thấp nhất (Min)')).toBeTruthy();

    // 5 students, 1 fail (F=3.5) -> fail rate 20%, pass rate 80%
    expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('20%').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers onSelectGroupFilter when clicking on a distribution bar', () => {
    const handleSelectFilter = vi.fn();
    render(
      <GradeAnalyticsCard
        grades={mockGrades}
        selectedGroupFilter={null}
        onSelectGroupFilter={handleSelectFilter}
      />
    );

    // Click on A group bar
    const aBar = screen.getByTitle(/Nhấn để lọc nhóm A \/ A\+/i);
    fireEvent.click(aBar);

    expect(handleSelectFilter).toHaveBeenCalledWith('A');
  });

  it('shows quality warning when failRate > 25% and gradedCount >= 5', () => {
    const heavyFailGrades = [
      { totalScore: 9.0, letterGrade: 'A' },
      { totalScore: 3.0, letterGrade: 'F' },
      { totalScore: 4.0, letterGrade: 'D' },
      { totalScore: 2.0, letterGrade: 'F' },
      { totalScore: 7.0, letterGrade: 'B' },
    ]; // 3 fail out of 5 -> 60% failRate

    render(<GradeAnalyticsCard grades={heavyFailGrades} />);
    expect(screen.getByText(/Cảnh báo Kiểm định Chất lượng Học phần/i)).toBeTruthy();
    expect(screen.getByText(/vượt quá ngưỡng kiểm định an toàn \(25%\)/i)).toBeTruthy();
  });

  it('toggles collapsible body when clicking on header', () => {
    render(<GradeAnalyticsCard grades={mockGrades} initialExpanded={true} />);

    expect(screen.getByText('Biểu đồ Phân Bố Phổ Điểm (Click vào cột để lọc sinh viên)')).toBeTruthy();

    // Click header to collapse
    const header = screen.getByText(/Phân Tích Phổ Điểm & Kiểm Định Chất Lượng/i);
    fireEvent.click(header);

    // Body should be hidden
    expect(screen.queryByText('Biểu đồ Phân Bố Phổ Điểm (Click vào cột để lọc sinh viên)')).toBeNull();
  });
});
