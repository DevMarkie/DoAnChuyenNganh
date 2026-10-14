import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCsv } from './export';

describe('export.js - exportToCsv', () => {
  let createdUrl = null;
  let clicked = false;
  let downloadedFilename = '';
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    clicked = false;
    downloadedFilename = '';
    URL.createObjectURL = vi.fn(() => {
      createdUrl = 'blob:mock-url-' + Math.random();
      return createdUrl;
    });
    URL.revokeObjectURL = vi.fn();

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicked = true;
      downloadedFilename = this.download;
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('exports simple rows with headers and correct filename', () => {
    const headers = ['Mã SV', 'Họ Tên', 'Điểm'];
    const data = [
      { code: 'SV01', name: 'Nguyễn Văn A', grade: 8.5 },
      { code: 'SV02', name: 'Trần Thị B', grade: 9.0 },
    ];
    const rowMapper = (item) => [item.code, item.name, item.grade];

    exportToCsv('danh_sach.csv', headers, data, rowMapper);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clicked).toBe(true);
    expect(downloadedFilename).toBe('danh_sach.csv');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(createdUrl);
  });

  it('escapes double quotes and handles null/undefined values gracefully', () => {
    const headers = ['Ghi Chú', 'Giá Trị'];
    const data = [
      { note: 'Có ký tự "ngoặc kép"', val: null },
      { note: 'Dòng thứ hai', val: undefined },
    ];
    const rowMapper = (item) => [item.note, item.val];

    let capturedBlob = null;
    URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob;
      return 'blob:mock';
    });

    exportToCsv('test_escape.csv', headers, data, rowMapper);

    expect(capturedBlob).toBeInstanceOf(Blob);
    expect(capturedBlob.type).toBe('text/csv;charset=utf-8');
    expect(clicked).toBe(true);
  });

  it('works with empty data list', () => {
    const headers = ['Cột 1', 'Cột 2'];
    exportToCsv('empty.csv', headers, [], (x) => [x.a, x.b]);

    expect(clicked).toBe(true);
    expect(downloadedFilename).toBe('empty.csv');
  });
});
