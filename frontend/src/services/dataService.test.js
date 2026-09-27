import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the axios wrapper so we assert URL/method/payload mapping without HTTP.
vi.mock('./api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from './api';
import {
  authService,
  studentService,
  gradeService,
  enrollmentService,
  transcriptService,
  passwordResetService,
} from './dataService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dataService endpoint mapping', () => {
  it('authService maps login and logout', () => {
    authService.login({ username: 'u', password: 'p' });
    expect(api.post).toHaveBeenCalledWith('/auth/login', { username: 'u', password: 'p' });

    authService.logout();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('studentService.getPaged forwards params to /students/paged', () => {
    studentService.getPaged({ page: 2, size: 20 });
    expect(api.get).toHaveBeenCalledWith('/students/paged', { params: { page: 2, size: 20 } });
  });

  it('gradeService maps batch save and blob export', () => {
    gradeService.saveBatch([{ enrollmentId: 1 }]);
    expect(api.put).toHaveBeenCalledWith('/grades/batch', [{ enrollmentId: 1 }]);

    gradeService.exportExcel(5);
    expect(api.get).toHaveBeenCalledWith('/grades/section/5/export', { responseType: 'blob' });
  });

  it('enrollment cancel and transcript lookup interpolate the id', () => {
    enrollmentService.cancel(9);
    expect(api.delete).toHaveBeenCalledWith('/enrollments/9');

    transcriptService.getStudentTranscript(9);
    expect(api.get).toHaveBeenCalledWith('/transcript/student/9');
  });

  it('passwordResetService.batchReject posts the DTO body', () => {
    const body = { requestIds: [1, 2], reason: 'invalid' };
    passwordResetService.batchReject(body);
    expect(api.post).toHaveBeenCalledWith('/admin/password-resets/batch-reject', body);
  });
});
