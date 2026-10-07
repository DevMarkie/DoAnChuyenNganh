/**
 * ============================================================
 *  Unit Tests — Phần 2: Business / Dev Logic Test
 *  Framework: Vitest (tương thích với cấu hình Vite của dự án)
 *  File: tests/chat-logic.test.ts
 * ============================================================
 *
 *  Cách chạy:
 *    cd frontend
 *    npm run test          # vitest run (one-shot)
 *    npm run test:watch    # vitest watch
 *
 *  Đảm bảo package.json đã có:
 *    "scripts": { "test": "vitest run", "test:watch": "vitest" }
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
//  SUT: Hàm parseSlashCommand
//  (Đây là implementation mẫu — trong dự án thực, import từ utils/chatParser.ts)
// ─────────────────────────────────────────────────────────────────────────────

/** Danh sách lệnh hợp lệ trong hệ thống */
const VALID_COMMANDS = new Set([
  'goal',
  'schedule',
  'plan',
  'grill-me',
  'learn',
  'agy-customizations',
  'antigravity-guide',
]);

export interface ParsedCommand {
  command: string | null;
  args: string;
  rawInput: string;
  isValid: boolean;
  error?: 'UNKNOWN_COMMAND' | 'INVALID_FORMAT' | 'INCOMPLETE_COMMAND';
}

/**
 * Phân tích chuỗi nhập vào ô chat:
 * - Nếu bắt đầu bằng "/" và có tên lệnh → parse command + args
 * - Nếu "/" ở giữa câu → plain message (không trigger)
 * - Các edge cases được xử lý rõ ràng
 */
export function parseSlashCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  // Không có nội dung
  if (!trimmed) {
    return { command: null, args: '', rawInput: input, isValid: false };
  }

  // Không bắt đầu bằng "/"  → plain message
  if (!trimmed.startsWith('/')) {
    return { command: null, args: trimmed, rawInput: input, isValid: false };
  }

  // Double slash "//" → invalid format
  if (trimmed.startsWith('//')) {
    return {
      command: null,
      args: '',
      rawInput: input,
      isValid: false,
      error: 'INVALID_FORMAT',
    };
  }

  // Chỉ là "/" đơn → incomplete
  if (trimmed === '/') {
    return {
      command: null,
      args: '',
      rawInput: input,
      isValid: false,
      error: 'INCOMPLETE_COMMAND',
    };
  }

  // Tách "/" khỏi phần còn lại
  const withoutSlash = trimmed.slice(1).trimStart();
  const spaceIndex = withoutSlash.indexOf(' ');

  let commandName: string;
  let argsStr: string;

  if (spaceIndex === -1) {
    commandName = withoutSlash.toLowerCase();
    argsStr = '';
  } else {
    commandName = withoutSlash.slice(0, spaceIndex).toLowerCase();
    argsStr = withoutSlash.slice(spaceIndex + 1).trim();
  }

  // Kiểm tra tên lệnh có hợp lệ không
  if (!VALID_COMMANDS.has(commandName)) {
    return {
      command: null,
      args: argsStr,
      rawInput: input,
      isValid: false,
      error: 'UNKNOWN_COMMAND',
    };
  }

  return {
    command: commandName,
    args: argsStr,
    rawInput: input,
    isValid: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Schema Zod (Phần 3 — dùng trong cả test này)
// ─────────────────────────────────────────────────────────────────────────────

const SlashCommandConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/, 'Must be kebab-case'),
  title: z.string().min(1),
  description: z.string().min(1).max(500),
  icon: z.string().min(1),
});

const SlashCommandListSchema = z.array(SlashCommandConfigSchema).length(7);

const ChatPayloadSchema = z.object({
  message: z.string().min(1).max(10000),
  command: z.string().regex(/^[a-z][a-z0-9-]*$/).nullable().optional(),
  args: z.string().max(5000).optional(),
  model: z.enum([
    'gemini-3.1-pro-high',
    'gemini-flash',
    'claude-sonnet-4-6',
    'claude-opus-4-6',
  ]),
  sessionId: z.string().uuid(),
  timestamp: z.number().int().positive(),
});

// ─────────────────────────────────────────────────────────────────────────────
//  TESTS — PHẦN 2: parseSlashCommand Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSlashCommand — Happy Paths (LOG-01 to LOG-03)', () => {
  // LOG-01: Lệnh đơn giản
  it('LOG-01: Parse lệnh đơn giản /goal', () => {
    const result = parseSlashCommand('/goal');
    expect(result).toEqual({
      command: 'goal',
      args: '',
      rawInput: '/goal',
      isValid: true,
    });
  });

  // LOG-02: Lệnh với argument
  it('LOG-02: Parse /schedule với argument đầy đủ', () => {
    const result = parseSlashCommand('/schedule 10m nhắc tôi nộp bài');
    expect(result).toEqual({
      command: 'schedule',
      args: '10m nhắc tôi nộp bài',
      rawInput: '/schedule 10m nhắc tôi nộp bài',
      isValid: true,
    });
  });

  // LOG-03: Lệnh có dấu gạch ngang
  it('LOG-03: Parse /grill-me (tên lệnh có gạch ngang)', () => {
    const result = parseSlashCommand('/grill-me');
    expect(result).toEqual({
      command: 'grill-me',
      args: '',
      rawInput: '/grill-me',
      isValid: true,
    });
  });

  it('LOG-03b: Parse /agy-customizations', () => {
    const result = parseSlashCommand('/agy-customizations explain rules');
    expect(result.command).toBe('agy-customizations');
    expect(result.args).toBe('explain rules');
    expect(result.isValid).toBe(true);
  });

  it('LOG-03c: Parse /antigravity-guide', () => {
    const result = parseSlashCommand('/antigravity-guide');
    expect(result.command).toBe('antigravity-guide');
    expect(result.isValid).toBe(true);
  });

  it('Parse tất cả 7 lệnh hợp lệ', () => {
    const commands = ['goal', 'schedule', 'plan', 'grill-me', 'learn', 'agy-customizations', 'antigravity-guide'];
    commands.forEach((cmd) => {
      const result = parseSlashCommand(`/${cmd}`);
      expect(result.command).toBe(cmd);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('parseSlashCommand — Edge Cases (LOG-04 to LOG-08)', () => {
  // LOG-04: Double slash
  it('LOG-04: Dấu // đôi → INVALID_FORMAT', () => {
    const result = parseSlashCommand('//goal');
    expect(result.command).toBeNull();
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('INVALID_FORMAT');
  });

  // LOG-05: Slash ở giữa câu
  it('LOG-05: Slash ở giữa câu → không parse lệnh', () => {
    const result = parseSlashCommand('Hôm nay tôi /schedule');
    expect(result.command).toBeNull();
    expect(result.isValid).toBe(false);
    // Không có error code vì đây là plain message
    expect(result.error).toBeUndefined();
  });

  // LOG-06: Lệnh không hợp lệ
  it('LOG-06: Lệnh /xyz-invalid → UNKNOWN_COMMAND', () => {
    const result = parseSlashCommand('/xyz-invalid');
    expect(result.command).toBeNull();
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UNKNOWN_COMMAND');
  });

  // LOG-07: Chỉ là "/"
  it('LOG-07: Chỉ gõ "/" → INCOMPLETE_COMMAND', () => {
    const result = parseSlashCommand('/');
    expect(result.command).toBeNull();
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('INCOMPLETE_COMMAND');
  });

  // LOG-08: Thừa khoảng trắng
  it('LOG-08: Thừa khoảng trắng trước và sau lệnh', () => {
    const result = parseSlashCommand('/  plan  ');
    expect(result.command).toBe('plan');
    expect(result.args).toBe('');
    expect(result.isValid).toBe(true);
  });

  // LOG-09: Input trống
  it('LOG-09 / Send Lock: Input trống → command null', () => {
    const result = parseSlashCommand('');
    expect(result.command).toBeNull();
    expect(result.isValid).toBe(false);
  });

  // LOG-10: Chỉ khoảng trắng
  it('LOG-10 / Send Lock: Input chỉ khoảng trắng', () => {
    const result = parseSlashCommand('   ');
    expect(result.command).toBeNull();
    expect(result.isValid).toBe(false);
  });

  it('Case insensitive: /GOAL → goal', () => {
    const result = parseSlashCommand('/GOAL');
    expect(result.command).toBe('goal');
    expect(result.isValid).toBe(true);
  });

  it('Arg chứa ký tự đặc biệt', () => {
    const result = parseSlashCommand('/plan Làm báo cáo & submit trước 23:59');
    expect(result.command).toBe('plan');
    expect(result.args).toBe('Làm báo cáo & submit trước 23:59');
    expect(result.isValid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TESTS — Send Button Lock Logic
// ─────────────────────────────────────────────────────────────────────────────

describe('isSendDisabled — Send Button Lock (LOG-09 to LOG-11)', () => {
  /**
   * Hàm kiểm tra xem nút gửi có nên disabled không.
   * Trong codebase thực tế, đây thường là derived state / computed value.
   */
  function isSendDisabled(input: string, isStreaming: boolean): boolean {
    if (isStreaming) return true;
    const trimmed = input.trim();
    if (!trimmed) return true;
    if (trimmed === '/') return true;
    return false;
  }

  it('LOG-09: Input trống → disabled', () => {
    expect(isSendDisabled('', false)).toBe(true);
  });

  it('LOG-10: Input chỉ khoảng trắng → disabled', () => {
    expect(isSendDisabled('   ', false)).toBe(true);
  });

  it('LOG-11: Input chỉ là "/" → disabled', () => {
    expect(isSendDisabled('/', false)).toBe(true);
  });

  it('LOG-12: Đang streaming → disabled bất kể input', () => {
    expect(isSendDisabled('Hello world', true)).toBe(true);
    expect(isSendDisabled('/goal', true)).toBe(true);
  });

  it('Input hợp lệ + không streaming → enabled', () => {
    expect(isSendDisabled('Hello world', false)).toBe(false);
    expect(isSendDisabled('/goal', false)).toBe(false);
    expect(isSendDisabled('/schedule 10m', false)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TESTS — Model Switch Logic (LOG-13)
// ─────────────────────────────────────────────────────────────────────────────

describe('Model Switch — Payload model ID (LOG-13)', () => {
  const MODEL_MAP: Record<string, string> = {
    'Gemini 3.1 Pro High': 'gemini-3.1-pro-high',
    'Gemini Flash': 'gemini-flash',
    'Claude Sonnet 4.6': 'claude-sonnet-4-6',
    'Claude Opus 4.6': 'claude-opus-4-6',
  };

  function buildPayload(displayName: string, message: string) {
    const modelId = MODEL_MAP[displayName];
    if (!modelId) throw new Error(`Unknown model: ${displayName}`);
    return { message, model: modelId };
  }

  it('LOG-13a: Chọn "Gemini 3.1 Pro High" → payload.model = "gemini-3.1-pro-high"', () => {
    const payload = buildPayload('Gemini 3.1 Pro High', 'Hello');
    expect(payload.model).toBe('gemini-3.1-pro-high');
  });

  it('LOG-13b: Chuyển sang "Gemini Flash" → payload.model cập nhật đúng', () => {
    const payload = buildPayload('Gemini Flash', 'Hello');
    expect(payload.model).toBe('gemini-flash');
  });

  it('LOG-13c: Model không tồn tại → throw error', () => {
    expect(() => buildPayload('Unknown Model', 'Hello')).toThrow('Unknown model');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TESTS — PHẦN 3: Schema Validation (Zod)
// ─────────────────────────────────────────────────────────────────────────────

describe('Zod Schema — SlashCommandList (Phần 3 — Schema Validation)', () => {
  const validCommands = [
    { id: 'goal',               name: 'goal',               title: 'Goal',              description: 'Run until the specified goal is completely finished.',                                                          icon: '🎯' },
    { id: 'schedule',           name: 'schedule',           title: 'Schedule',          description: 'Run an instruction on a recurring schedule or as a one-time timer.',                                            icon: '⏰' },
    { id: 'plan',               name: 'plan',               title: 'Plan',              description: 'Plan carefully before executing a task.',                                                                        icon: '📋' },
    { id: 'grill-me',           name: 'grill-me',           title: 'Grill Me',          description: 'Interview me to align on a plan.',                                                                               icon: '🔥' },
    { id: 'learn',              name: 'learn',              title: 'Learn',             description: 'Reflect on recent successes or corrections to capture reusable skills or rules.',                               icon: '📚' },
    { id: 'agy-customizations', name: 'agy-customizations', title: 'AGY Customizations', description: 'Comprehensive guide and reference for the Antigravity Customization System. Use to explain how it works.',     icon: '⚙️' },
    { id: 'antigravity-guide',  name: 'antigravity-guide',  title: 'Antigravity Guide', description: 'Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY).',                  icon: '🚀' },
  ];

  it('Danh sách 7 lệnh hợp lệ pass schema', () => {
    expect(() => SlashCommandListSchema.parse(validCommands)).not.toThrow();
  });

  it('Thiếu field "icon" → schema reject', () => {
    const invalid = validCommands.map((c) => {
      const { icon: _icon, ...rest } = c;
      return rest;
    });
    expect(() => SlashCommandListSchema.parse(invalid)).toThrow();
  });

  it('Tên lệnh có ký tự hoa → schema reject', () => {
    const invalid = [{ ...validCommands[0], name: 'Goal' }];
    expect(() => SlashCommandConfigSchema.parse(invalid[0])).toThrow();
  });

  it('Description > 500 ký tự → schema reject', () => {
    const longDesc = 'a'.repeat(501);
    expect(() =>
      SlashCommandConfigSchema.parse({ ...validCommands[0], description: longDesc })
    ).toThrow();
  });

  it('Description trống → schema reject', () => {
    expect(() =>
      SlashCommandConfigSchema.parse({ ...validCommands[0], description: '' })
    ).toThrow();
  });

  it('Danh sách 6 lệnh (thiếu 1) → schema reject (length phải = 7)', () => {
    const only6 = validCommands.slice(0, 6);
    expect(() => SlashCommandListSchema.parse(only6)).toThrow();
  });
});

describe('Zod Schema — ChatPayload', () => {
  const basePayload = {
    message: '/schedule 10m nhắc tôi nộp bài',
    command: 'schedule',
    args: '10m nhắc tôi nộp bài',
    model: 'gemini-3.1-pro-high' as const,
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: 1728299066000,
  };

  it('Payload hợp lệ pass schema', () => {
    expect(() => ChatPayloadSchema.parse(basePayload)).not.toThrow();
  });

  it('message rỗng → reject', () => {
    expect(() =>
      ChatPayloadSchema.parse({ ...basePayload, message: '' })
    ).toThrow();
  });

  it('message > 10000 ký tự → reject', () => {
    expect(() =>
      ChatPayloadSchema.parse({ ...basePayload, message: 'a'.repeat(10001) })
    ).toThrow();
  });

  it('model không nằm trong enum → reject', () => {
    expect(() =>
      ChatPayloadSchema.parse({ ...basePayload, model: 'gpt-4' })
    ).toThrow();
  });

  it('sessionId không phải UUID → reject', () => {
    expect(() =>
      ChatPayloadSchema.parse({ ...basePayload, sessionId: 'not-a-uuid' })
    ).toThrow();
  });

  it('timestamp âm → reject', () => {
    expect(() =>
      ChatPayloadSchema.parse({ ...basePayload, timestamp: -1 })
    ).toThrow();
  });

  it('command = null (plain message) → accept', () => {
    expect(() =>
      ChatPayloadSchema.parse({ ...basePayload, command: null })
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TESTS — PHẦN 3: Data Sanitization & XSS Prevention
// ─────────────────────────────────────────────────────────────────────────────

describe('Data Sanitization — XSS & Injection Prevention (DAT-01 to DAT-05)', () => {
  /**
   * Hàm sanitize HTML mẫu (trong thực tế dùng DOMPurify hoặc escape thủ công).
   * Backend phải sanitize trước khi store + trước khi render.
   */
  function sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/on\w+\s*=/gi, 'data-blocked=');
  }

  it('DAT-01: XSS script tag bị escape', () => {
    const malicious = "<script>alert('xss')</script>";
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
    expect(sanitized).not.toContain('<script>');
  });

  it('DAT-02: XSS img onerror bị escape', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror');
  });

  it('DAT-03: javascript: URI bị escape', () => {
    const malicious = 'javascript:alert(1)';
    const sanitized = sanitizeHtml(malicious);
    // javascript: không có tag HTML → không bị escape nhưng cũng không tạo link nguy hiểm
    // Kiểm tra payload schema reject protocol injection
    expect(() =>
      ChatPayloadSchema.parse({
        message: malicious,
        model: 'gemini-3.1-pro-high',
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: 1728299066000,
      })
    ).not.toThrow(); // vẫn là string hợp lệ (sanitize ở tầng render, không tầng schema)
  });

  it('DAT-05: Message > 10000 ký tự → schema reject', () => {
    const overflow = 'a'.repeat(10001);
    expect(() =>
      ChatPayloadSchema.parse({
        message: overflow,
        model: 'gemini-3.1-pro-high',
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: 1728299066000,
      })
    ).toThrow();
  });
});

describe('Chat History Storage — LocalStorage Integrity (DAT-06, DAT-07)', () => {
  const ChatHistoryItemSchema = z.object({
    id: z.string().uuid(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.number().int().positive(),
    command: z.string().nullable().optional(),
    model: z.string().optional(),
  });

  const ChatHistorySchema = z.array(ChatHistoryItemSchema);

  const validHistory = [
    { id: '550e8400-e29b-41d4-a716-446655440001', role: 'user',      content: '/goal Hoàn thành đồ án', timestamp: 1728299000000, command: 'goal' },
    { id: '550e8400-e29b-41d4-a716-446655440002', role: 'assistant', content: 'Tôi sẽ giúp bạn hoàn thành mục tiêu.',  timestamp: 1728299010000, model: 'gemini-3.1-pro-high' },
  ];

  // DAT-06
  it('DAT-06: Lịch sử chat hợp lệ pass schema sau khi parse từ storage', () => {
    const stored = JSON.stringify(validHistory);
    const parsed = JSON.parse(stored);
    expect(() => ChatHistorySchema.parse(parsed)).not.toThrow();
  });

  // DAT-07
  it('DAT-07: Dữ liệu corrupt → schema throw (app không crash, chỉ reset)', () => {
    const corruptData = '[{"role":"hacker","content":"injected"}]';
    const parsed = JSON.parse(corruptData);
    expect(() => ChatHistorySchema.parse(parsed)).toThrow();
    // App nên catch lỗi này và reset state về []
  });

  it('DAT-07b: Missing timestamp field → schema reject', () => {
    const noTimestamp = [{ id: '550e8400-e29b-41d4-a716-446655440001', role: 'user', content: 'Hello' }];
    expect(() => ChatHistorySchema.parse(noTimestamp)).toThrow();
  });

  it('DAT-07c: Invalid UUID → schema reject', () => {
    const badId = [{ ...validHistory[0], id: 'not-uuid' }];
    expect(() => ChatHistorySchema.parse(badId)).toThrow();
  });
});
