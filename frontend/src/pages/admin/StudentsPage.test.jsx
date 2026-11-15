// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import StudentsPage from './StudentsPage';
import { studentService, classService, departmentService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  studentService: {
    getPaged: vi.fn(),
    getAll: vi.fn(),
    updateStatus: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  classService: {
    getAll: vi.fn(),
  },
  departmentService: {
    getAll: vi.fn(),
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

vi.mock('../../store/authStore', () => ({
  default: () => ({
    user: { id: 1, role: 'ADMIN', fullName: 'Administrator' },
  }),
}));

describe('StudentsPage - Server-Side Pagination & Filtering', { timeout: 60000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    classService.getAll.mockResolvedValue({ data: { data: [{ id: 1, name: 'CNPM01', academicYear: 'K16' }] } });
    departmentService.getAll.mockResolvedValue({ data: { data: [{ id: 10, name: 'Công nghệ thông tin' }] } });
  });

  afterEach(() => {
    cleanup();
  });

  const generateMockStudents = (count, startIndex = 1) => {
    return Array.from({ length: count }, (_, i) => ({
      id: startIndex + i,
      studentCode: `SV2026-${String(startIndex + i).padStart(3, '0')}`,
      fullName: `Sinh Viên ${startIndex + i}`,
      email: `sv${startIndex + i}@phenikaa-uni.edu.vn`,
      phone: '0987654321',
      status: 'ACTIVE',
      classEntity: {
        id: 1,
        name: 'CNPM01',
        academicYear: 'K16',
        department: { id: 10, name: 'Công nghệ thông tin' },
      },
    }));
  };

  it('loads initial page with server-side pagination parameters and renders true total footer count', async () => {
    const mockPageData = {
      content: generateMockStudents(50, 1),
      totalElements: 250,
      totalPages: 5,
      number: 0,
      size: 50,
    };
    studentService.getPaged.mockResolvedValue({ data: { data: mockPageData } });

    render(<StudentsPage />);

    await waitFor(() => {
      expect(studentService.getPaged).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 0,
          size: 50,
        })
      );
    });

    // Check footer display with server-provided totalElements
    await waitFor(() => {
      expect(screen.getByText(/Hiển thị/i)).toBeDefined();
      expect(screen.getByText(/trên/i)).toBeDefined();
      expect(screen.getAllByText('250').length).toBeGreaterThanOrEqual(1);
    });

    // Check first and last student of page 1 are rendered
    expect(screen.getByText('SV2026-001')).toBeDefined();
    expect(screen.getByText('Sinh Viên 1')).toBeDefined();
    expect(screen.getByText('SV2026-050')).toBeDefined();
  }, 60000);

  it('fetches next page from server when clicking Trang sau button', async () => {
    const page1Data = {
      content: generateMockStudents(50, 1),
      totalElements: 250,
      totalPages: 5,
      number: 0,
      size: 50,
    };
    const page2Data = {
      content: generateMockStudents(50, 51),
      totalElements: 250,
      totalPages: 5,
      number: 1,
      size: 50,
    };

    studentService.getPaged.mockImplementation((params) => {
      if (params && params.page === 1) {
        return Promise.resolve({ data: { data: page2Data } });
      }
      return Promise.resolve({ data: { data: page1Data } });
    });

    render(<StudentsPage />);

    await waitFor(() => {
      expect(screen.getByText('SV2026-001')).toBeDefined();
    });

    const nextBtn = screen.getByRole('button', { name: /Trang sau/i });
    expect(nextBtn.disabled).toBe(false);
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(studentService.getPaged).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          size: 50,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('SV2026-051')).toBeDefined();
    });
  }, 60000);

  it('triggers debounced search with keyword param and resets currentPage to 1', async () => {
    const initialData = {
      content: generateMockStudents(50, 1),
      totalElements: 250,
      totalPages: 5,
      number: 0,
      size: 50,
    };
    const searchData = {
      content: [
        {
          id: 99,
          studentCode: 'SV2026-099',
          fullName: 'Nguyễn Văn Đặc Biệt',
          email: 'dacbiet@phenikaa-uni.edu.vn',
          status: 'ACTIVE',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
    };

    studentService.getPaged.mockImplementation((params) => {
      if (params && params.keyword === 'Đặc Biệt') {
        return Promise.resolve({ data: { data: searchData } });
      }
      return Promise.resolve({ data: { data: initialData } });
    });

    render(<StudentsPage />);

    await waitFor(() => {
      expect(screen.getByText('SV2026-001')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã SV/i);
    fireEvent.change(searchInput, { target: { value: 'Đặc Biệt' } });

    await waitFor(
      () => {
        expect(studentService.getPaged).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 0,
            size: 50,
            keyword: 'Đặc Biệt',
          })
        );
      },
      { timeout: 5000 }
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Đặc Biệt')).toBeDefined();
      expect(screen.getByText('SV2026-099')).toBeDefined();
    });
  }, 60000);
});
