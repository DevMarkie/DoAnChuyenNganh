import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PortalLoginPage from './PortalLoginPage';
import { authService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

vi.mock('../../services/dataService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    requestPasswordReset: vi.fn(),
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

describe('PortalLoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  const renderComponent = (portalType = 'student') => {
    return render(
      <MemoryRouter>
        <PortalLoginPage portalType={portalType} />
      </MemoryRouter>
    );
  };

  it('renders student login portal correctly with headings and inputs', () => {
    renderComponent('student');
    expect(screen.getByText('Đăng nhập Cổng Sinh viên')).toBeDefined();
    expect(screen.getByText(/Mã số sinh viên/i)).toBeDefined();
    expect(screen.getByPlaceholderText('VD: 2500001')).toBeDefined();
    expect(screen.getByPlaceholderText('Nhập mật khẩu của bạn')).toBeDefined();
    expect(screen.getByRole('button', { name: /Đăng nhập — Sinh viên/i })).toBeDefined();
  });

  it('renders lecturer login portal with corresponding title', () => {
    renderComponent('lecturer');
    expect(screen.getByText('Đăng nhập Cổng Giảng viên')).toBeDefined();
    expect(screen.getByText(/Mã cán bộ \/ Giảng viên/i)).toBeDefined();
    expect(screen.getByPlaceholderText('VD: 1000001')).toBeDefined();
  });

  it('renders admin login portal with corresponding title', () => {
    renderComponent('admin');
    expect(screen.getByText('Đăng nhập Quản trị Trung tâm')).toBeDefined();
    expect(screen.getByText(/Tài khoản Quản trị viên/i)).toBeDefined();
  });

  it('validates empty inputs on submit without calling api', async () => {
    renderComponent('student');
    const userInput = screen.getByPlaceholderText('VD: 2500001');
    const passInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập — Sinh viên/i });

    fireEvent.change(userInput, { target: { value: '' } });
    fireEvent.change(passInput, { target: { value: '' } });
    fireEvent.click(submitBtn);

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('calls authService.login on valid form submission', async () => {
    authService.login.mockResolvedValueOnce({
      token: 'mock-jwt-token',
      role: 'STUDENT',
      mustChangePassword: false,
      user: { id: 1, username: '2500001', role: 'STUDENT' },
    });

    renderComponent('student');
    const userInput = screen.getByPlaceholderText('VD: 2500001');
    const passInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập — Sinh viên/i });

    fireEvent.change(userInput, { target: { value: '2500001' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: '2500001',
        password: 'password123',
      });
    });
  });
});
