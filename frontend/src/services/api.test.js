import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from './api';

describe('api.js fetch wrapper', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('performs GET request and parses JSON response', async () => {
    const mockData = { success: true, data: [1, 2, 3] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(mockData)),
    });

    const res = await api.get('/test-endpoint');
    expect(res.data).toEqual(mockData);
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/test-endpoint');
    expect(options.method).toBe('GET');
  });

  it('attaches Authorization header if token exists in localStorage', async () => {
    localStorage.setItem('token', 'fake-jwt-token-xyz');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify({ ok: true })),
    });

    await api.get('/protected-resource');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer fake-jwt-token-xyz');
  });

  it('serializes query parameters properly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve('{}'),
    });

    await api.get('/search', { params: { keyword: 'java', page: 0, empty: null } });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('keyword=java');
    expect(url).toContain('page=0');
    expect(url).not.toContain('empty=');
  });

  it('handles 401 unauthorized: removes token and dispatches event', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Test' }));

    const eventSpy = vi.fn();
    window.addEventListener('auth:session-expired', eventSpy);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ message: 'Token expired' })),
    });

    await expect(api.get('/me')).rejects.toThrow('Token expired');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(eventSpy).toHaveBeenCalledTimes(1);

    window.removeEventListener('auth:session-expired', eventSpy);
  });

  it('correctly passes JSON payload on POST request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify({ created: true })),
    });

    const payload = { username: 'testuser', password: '123' };
    await api.post('/login', payload);

    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(payload));
    expect(options.headers['Content-Type']).toBe('application/json');
  });
});
