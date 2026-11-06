import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SectionStudentsModal from './SectionStudentsModal';
import { enrollmentService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  enrollmentService: {
    getBySection: vi.fn(),
  },
  courseSectionService: {
    exportStudents: vi.fn(),
  },
}));

describe('SectionStudentsModal Component', () => {
  const mockCourseSection = {
    id: 101,
    sectionCode: 'CS101.01',
    subject: { subjectName: 'Lập trình Java', credits: 3 },
    semester: { semesterName: 'Học kỳ 1 - 2026-2027' },
    schedule: 'Thứ 2 (Tiết 1-3)',
    room: 'A2-301',
    maxStudents: 50,
    minStudents: 15,
    sectionType: 'REGULAR',
    lecturer: { fullName: 'TS. Nguyễn Văn Giảng' },
  };

  const mockStudents = [
    {
      id: 1,
      student: {
        studentCode: 'SV2026001',
        fullName: 'Nguyễn Văn An',
        dateOfBirth: '2004-05-15',
        gender: 'MALE',
        classEntity: { name: 'K18-CNTT1' },
        email: 'an.nv@sms.phenikaa.edu.vn',
      },
    },
    {
      id: 2,
      student: {
        studentCode: 'SV2026002',
        fullName: 'Trần Thị Bình',
        dateOfBirth: '2004-08-20',
        gender: 'FEMALE',
        classEntity: { name: 'K18-CNTT2' },
        email: 'binh.tt@sms.phenikaa.edu.vn',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.getBySection.mockResolvedValue({
      data: { data: mockStudents },
    });
  });

  it('renders section information and student list correctly with min students warning', async () => {
    render(<SectionStudentsModal courseSection={mockCourseSection} onClose={vi.fn()} />);

    expect(screen.getByText('CS101.01')).toBeDefined();
    expect(screen.getByText('Lập trình Java')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
      expect(screen.getByText('SV2026001')).toBeDefined();
      expect(screen.getByText('Trần Thị Bình')).toBeDefined();
      expect(screen.getByText('SV2026002')).toBeDefined();
    });

    // Check min students display & warning badge (since 2 < 15)
    expect(screen.getByText('(Tối thiểu: 15 SV)')).toBeDefined();
    expect(screen.getAllByText('⚠️ Chưa đạt sĩ số tối thiểu').length).toBeGreaterThan(0);
  });

  it('displays special badge for SPECIAL section type without under-enrolled warning', async () => {
    const specialSection = { ...mockCourseSection, sectionType: 'SPECIAL' };
    render(<SectionStudentsModal courseSection={specialSection} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    });

    expect(screen.getAllByText('⭐ Lớp đặc thù / Ngoại lệ').length).toBeGreaterThan(0);
    expect(screen.queryByText('⚠️ Chưa đạt sĩ số tối thiểu')).toBeNull();
  });

  it('filters students based on search input', async () => {
    render(<SectionStudentsModal courseSection={mockCourseSection} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Tìm theo mã SV, họ tên, lớp SH...');
    fireEvent.change(searchInput, { target: { value: 'Bình' } });

    expect(screen.queryByText('Nguyễn Văn An')).toBeNull();
    expect(screen.getByText('Trần Thị Bình')).toBeDefined();
    expect(screen.getByText('• Tìm thấy 1 SV')).toBeDefined();
  });

  it('triggers window.print when clicking In / Lưu PDF', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<SectionStudentsModal courseSection={mockCourseSection} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    });

    const printBtn = screen.getByTitle('In / Lưu thành file PDF');
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('triggers onOpenAttendance when clicking Điểm danh / Tạo mã', async () => {
    const handleAttendance = vi.fn();
    render(
      <SectionStudentsModal
        courseSection={mockCourseSection}
        onClose={vi.fn()}
        onOpenAttendance={handleAttendance}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    });

    const attendanceBtns = screen.getAllByRole('button', { name: /Điểm danh \/ Tạo mã/i });
    expect(attendanceBtns.length).toBeGreaterThan(0);
    fireEvent.click(attendanceBtns[0]);

    expect(handleAttendance).toHaveBeenCalledWith(mockCourseSection);
  });
});
