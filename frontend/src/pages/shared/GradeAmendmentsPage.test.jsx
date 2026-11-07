import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import GradeAmendmentsPage from './GradeAmendmentsPage';
import { gradeAmendmentService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

vi.mock('../../services/dataService', () => ({
  gradeAmendmentService: {
    getAll: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('GradeAmendmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call gradeAmendmentService.getAll when token is absent', async () => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });

    render(<GradeAmendmentsPage />);

    // Wait a brief tick to ensure useEffect ran
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(gradeAmendmentService.getAll).not.toHaveBeenCalled();
  });

  it('calls gradeAmendmentService.getAll when token is present', async () => {
    useAuthStore.setState({
      user: { role: 'ACADEMIC_AFFAIRS', username: 'academic01' },
      token: 'mock-valid-token',
      isAuthenticated: true,
    });

    render(<GradeAmendmentsPage />);

    await waitFor(() => {
      expect(gradeAmendmentService.getAll).toHaveBeenCalled();
    });
  });
});
