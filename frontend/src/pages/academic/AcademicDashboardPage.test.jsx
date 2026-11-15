// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AcademicDashboardPage from './AcademicDashboardPage';
import { dashboardService } from '../../services/dataService';

vi.mock('../../services/dataService', () => ({
  dashboardService: {
    getSummary: vi.fn(),
  },
  studentService: {
    getAll: vi.fn(),
  },
  courseSectionService: {
    getAll: vi.fn(),
  },
  gradeAppealService: {
    getAll: vi.fn(),
  },
}));

describe('AcademicDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads summary statistics from dashboardService.getSummary and renders badge counts', async () => {
    dashboardService.getSummary.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          totalStudents: 1250,
          totalSections: 85,
          pendingAppeals: 12,
        },
      },
    });

    render(
      <MemoryRouter>
        <AcademicDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(dashboardService.getSummary).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('1250 sinh viên')).toBeDefined();
    expect(await screen.findByText('85 lớp HP')).toBeDefined();
    expect(await screen.findByText('12 chờ duyệt')).toBeDefined();
  });
});
