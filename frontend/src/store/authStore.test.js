import { describe, it, expect, beforeEach, vi } from 'vitest';

// authStore reads localStorage at module-load time, so every test loads a fresh
// copy after seeding localStorage. dataService is mocked so logout() never hits
// the network.
vi.mock('../services/dataService', () => ({
  authService: { logout: vi.fn(() => Promise.resolve()) },
}));

import { authService } from '../services/dataService';

const b64url = (obj) =>
  btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Minimal unsigned JWT — jwt-decode only reads the payload, never verifies.
const makeToken = (payload) =>
  `${b64url({ alg: 'HS512', typ: 'JWT' })}.${b64url(payload)}.sig`;

const futureExp = () => Math.floor(Date.now() / 1000) + 3600;
const pastExp = () => Math.floor(Date.now() / 1000) - 3600;

const loadStore = async () => (await import('./authStore')).default;

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  vi.clearAllMocks();
});

describe('authStore initialization', () => {
  it('hydrates authenticated state from a valid stored token', async () => {
    localStorage.setItem('token', makeToken({ exp: futureExp(), role: 'STUDENT', userId: 7, sub: 'nam7' }));
    localStorage.setItem('user', JSON.stringify({ userId: 7, username: 'nam7', name: 'Nam' }));

    const store = await loadStore();
    const state = store.getState();

    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBeTruthy();
    expect(state.user).toEqual({ userId: 7, username: 'nam7', name: 'Nam' });
  });

  it('clears a stored user when it does not match the JWT identity', async () => {
    localStorage.setItem('token', makeToken({ exp: futureExp(), role: 'STUDENT', userId: 1432, sub: '2500001' }));
    localStorage.setItem('user', JSON.stringify({ userId: 82, username: '2300001' }));

    const store = await loadStore();

    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('discards an expired token and clears stale storage on load', async () => {
    localStorage.setItem('token', makeToken({ exp: pastExp(), role: 'STUDENT', userId: 7, sub: 'nam7' }));
    localStorage.setItem('user', JSON.stringify({ userId: 7, username: 'nam7', name: 'Nam' }));

    const store = await loadStore();
    const state = store.getState();

    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('authStore actions', () => {
  it('login persists token + user and flips isAuthenticated', async () => {
    const store = await loadStore();
    const token = makeToken({ exp: futureExp(), role: 'ADMIN', userId: 1 });

    store.getState().login(token, { id: 1, name: 'Admin' });

    expect(store.getState().isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe(token);
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 1, name: 'Admin' });
  });

  it('logout clears state, wipes storage, and notifies the server best-effort', async () => {
    const store = await loadStore();
    store.getState().login(makeToken({ exp: futureExp(), userId: 1 }), { id: 1 });

    store.getState().logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('checkAuth returns false and auto-logs-out when the token is expired', async () => {
    const store = await loadStore();
    // Seed an expired token directly (login would still store it; init already ran).
    store.setState({ token: makeToken({ exp: pastExp(), userId: 1 }), isAuthenticated: true });

    expect(store.getState().checkAuth()).toBe(false);
    expect(store.getState().isAuthenticated).toBe(false);
  });

  it('supports isolated multi-portal sessions concurrently without overwriting each other', async () => {
    const store = await loadStore();

    // 1. Đăng nhập Giảng viên
    const lecturerToken = makeToken({ exp: futureExp(), role: 'LECTURER', userId: 101, sub: 'gv01' });
    store.getState().login(lecturerToken, { userId: 101, username: 'gv01', role: 'LECTURER' });

    expect(localStorage.getItem('token_lecturer')).toBe(lecturerToken);
    expect(store.getState().hasPortalSession('lecturer')).toBe(true);

    // 2. Đăng nhập Sinh viên ở cổng khác
    const studentToken = makeToken({ exp: futureExp(), role: 'STUDENT', userId: 202, sub: 'sv01' });
    store.getState().login(studentToken, { userId: 202, username: 'sv01', role: 'STUDENT' });

    expect(localStorage.getItem('token_student')).toBe(studentToken);
    expect(store.getState().hasPortalSession('student')).toBe(true);

    // Xác nhận token Giảng viên KHÔNG hề bị ghi đè!
    expect(localStorage.getItem('token_lecturer')).toBe(lecturerToken);
    expect(store.getState().hasPortalSession('lecturer')).toBe(true);

    // 3. syncWithRoute chuyển đổi qua lại giữa các cổng
    store.getState().syncWithRoute('/lecturer/dashboard');
    expect(store.getState().user?.role).toBe('LECTURER');
    expect(store.getState().token).toBe(lecturerToken);

    store.getState().syncWithRoute('/student/dashboard');
    expect(store.getState().user?.role).toBe('STUDENT');
    expect(store.getState().token).toBe(studentToken);

    // 4. Đăng xuất ở cổng Giảng viên chỉ xóa phiên Giảng viên, phiên Sinh viên vẫn còn
    store.getState().syncWithRoute('/lecturer/dashboard');
    store.getState().logout();

    expect(localStorage.getItem('token_lecturer')).toBeNull();
    expect(localStorage.getItem('token_student')).toBe(studentToken);
    expect(store.getState().hasPortalSession('student')).toBe(true);
  });
});
