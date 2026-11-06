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
    sendResetOtp: vi.fn(),
    verifyResetOtp: vi.fn(),
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

  const renderComponent = (portalType = 'student', initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
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
    expect(screen.getByText(/Mã cán bộ \/ Quản trị viên|Tài khoản Quản trị viên/i)).toBeDefined();
  });

  it('renders academic login portal with corresponding title for Academic & Examination Officers', () => {
    renderComponent('academic');
    expect(screen.getByText('Đăng nhập Cổng Đào tạo & Khảo thí')).toBeDefined();
    expect(screen.getByText(/Mã cán bộ \/ Nhân viên/i)).toBeDefined();
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

  it('calls authService.login on valid form submission and logs in when role matches portal', async () => {
    authService.login.mockResolvedValueOnce({
      data: {
        data: {
          token: 'mock-jwt-token',
          role: 'STUDENT',
          userId: 1,
          username: '2500001',
          mustChangePassword: false,
        },
      },
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
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.role).toBe('STUDENT');
    });
  });

  it('strictly rejects login when account role does not match portal and displays warning banner', async () => {
    // Giả sử tài khoản là STUDENT nhưng đăng nhập nhầm vào cổng Admin
    authService.login.mockResolvedValueOnce({
      data: {
        data: {
          token: 'mock-jwt-token',
          role: 'STUDENT',
          userId: 10,
          username: '2500001',
          mustChangePassword: false,
        },
      },
    });

    renderComponent('admin');
    const userInput = screen.getByPlaceholderText('VD: AD001 hoặc admin');
    const passInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập — Quản trị viên/i });

    fireEvent.change(userInput, { target: { value: '2500001' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: '2500001',
        password: 'password123',
      });
      // Không được cấp quyền đăng nhập
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      // Hiển thị banner từ chối truy cập
      expect(screen.getByText('Từ chối quyền truy cập cổng')).toBeDefined();
      expect(screen.getByText(/Chuyển sang Cổng Sinh viên/i)).toBeDefined();
    });
  });

  it('allows EXAMINATION_OFFICER to log in on academic portal successfully', async () => {
    authService.login.mockResolvedValueOnce({
      data: {
        data: {
          token: 'mock-jwt-token-exam',
          role: 'EXAMINATION_OFFICER',
          userId: 99,
          username: 'khaothi01',
          mustChangePassword: false,
        },
      },
    });

    renderComponent('academic');
    const userInput = screen.getByPlaceholderText('VD: NV001, KT001 hoặc daotao');
    const passInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập — Cán bộ Đào tạo & Khảo thí/i });

    fireEvent.change(userInput, { target: { value: 'khaothi01' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'khaothi01',
        password: 'password123',
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.role).toBe('EXAMINATION_OFFICER');
    });
  });
});
