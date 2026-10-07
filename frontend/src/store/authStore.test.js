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
    localStorage.setItem('token', makeToken({ exp: futureExp(), role: 'STUDENT', userId: 7 }));
    localStorage.setItem('user', JSON.stringify({ id: 7, name: 'Nam' }));

    const store = await loadStore();
    const state = store.getState();

    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBeTruthy();
    expect(state.user).toEqual({ id: 7, name: 'Nam' });
  });

  it('discards an expired token and clears stale storage on load', async () => {
    localStorage.setItem('token', makeToken({ exp: pastExp(), role: 'STUDENT', userId: 7 }));
    localStorage.setItem('user', JSON.stringify({ id: 7, name: 'Nam' }));

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

});
