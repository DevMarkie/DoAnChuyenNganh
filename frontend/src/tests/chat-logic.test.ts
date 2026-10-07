/**
 * ============================================================
 *  Unit Tests — Chat Logic (Phần 2 + Phần 3)
 *  Framework: Vitest — chạy từ thư mục frontend/
 *  File: src/tests/chat-logic.test.ts
 * ============================================================
 *
 *  Cách chạy:
 *    cd frontend
 *    npm run test
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
//  SUT: parseSlashCommand
// ─────────────────────────────────────────────────────────────────────────────

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

export function parseSlashCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  if (!trimmed) {
    return { command: null, args: '', rawInput: input, isValid: false };
  }

  if (!trimmed.startsWith('/')) {
    return { command: null, args: trimmed, rawInput: input, isValid: false };
  }

  if (trimmed.startsWith('//')) {
    return { command: null, args: '', rawInput: input, isValid: false, error: 'INVALID_FORMAT' };
  }

  if (trimmed === '/') {
    return { command: null, args: '', rawInput: input, isValid: false, error: 'INCOMPLETE_COMMAND' };
  }

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

  if (!VALID_COMMANDS.has(commandName)) {
    return { command: null, args: argsStr, rawInput: input, isValid: false, error: 'UNKNOWN_COMMAND' };
  }

  return { command: commandName, args: argsStr, rawInput: input, isValid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Zod Schemas
// ─────────────────────────────────────────────────────────────────────────────

const SlashCommandConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/),
  title: z.string().min(1),
  description: z.string().min(1).max(500),
  icon: z.string().min(1),
});

const SlashCommandListSchema = z.array(SlashCommandConfigSchema).length(7);

const ChatPayloadSchema = z.object({
  message: z.string().min(1).max(10000),
  command: z.string().regex(/^[a-z][a-z0-9-]*$/).nullable().optional(),
  args: z.string().max(5000).optional(),
  model: z.enum(['gemini-3.1-pro-high', 'gemini-flash', 'claude-sonnet-4-6', 'claude-opus-4-6']),
  sessionId: z.string().uuid(),
  timestamp: z.number().int().positive(),
});

const ChatHistoryItemSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number().int().positive(),
  command: z.string().nullable().optional(),
  model: z.string().optional(),
});

const ChatHistorySchema = z.array(ChatHistoryItemSchema);

// ─────────────────────────────────────────────────────────────────────────────
//  TEST DATA
// ─────────────────────────────────────────────────────────────────────────────

const validCommands = [
  { id: 'goal',               name: 'goal',               title: 'Goal',              description: 'Run until the specified goal is completely finished.',                                                                               icon: '🎯' },
  { id: 'schedule',           name: 'schedule',           title: 'Schedule',          description: 'Run an instruction on a recurring schedule or as a one-time timer.',                                                                  icon: '⏰' },
  { id: 'plan',               name: 'plan',               title: 'Plan',              description: 'Plan carefully before executing a task.',                                                                                              icon: '📋' },
  { id: 'grill-me',           name: 'grill-me',           title: 'Grill Me',          description: 'Interview me to align on a plan.',                                                                                                    icon: '🔥' },
  { id: 'learn',              name: 'learn',              title: 'Learn',             description: 'Reflect on recent successes or corrections to capture reusable skills or rules.',                                                     icon: '📚' },
  { id: 'agy-customizations', name: 'agy-customizations', title: 'AGY Customizations', description: 'Comprehensive guide and reference for the Antigravity Customization System. Use to explain how it works.',                          icon: '⚙️' },
  { id: 'antigravity-guide',  name: 'antigravity-guide',  title: 'Antigravity Guide', description: 'Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY).',                                         icon: '🚀' },
];

const basePayload = {
  message: '/schedule 10m nhắc tôi nộp bài',
  command: 'schedule',
  args: '10m nhắc tôi nộp bài',
  model: 'gemini-3.1-pro-high' as const,
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: 1728299066000,
};

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 2A — parseSlashCommand Happy Paths
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSlashCommand — Happy Paths', () => {
  it('LOG-01: Parse /goal', () => {
    const r = parseSlashCommand('/goal');
    expect(r).toEqual({ command: 'goal', args: '', rawInput: '/goal', isValid: true });
  });

  it('LOG-02: Parse /schedule với argument', () => {
    const r = parseSlashCommand('/schedule 10m nhắc tôi nộp bài');
    expect(r.command).toBe('schedule');
    expect(r.args).toBe('10m nhắc tôi nộp bài');
    expect(r.isValid).toBe(true);
  });

  it('LOG-03: Parse /grill-me (có gạch ngang)', () => {
    const r = parseSlashCommand('/grill-me');
    expect(r.command).toBe('grill-me');
    expect(r.isValid).toBe(true);
  });

  it('Parse /agy-customizations với argument', () => {
    const r = parseSlashCommand('/agy-customizations explain rules');
    expect(r.command).toBe('agy-customizations');
    expect(r.args).toBe('explain rules');
    expect(r.isValid).toBe(true);
  });

  it('Parse /antigravity-guide', () => {
    const r = parseSlashCommand('/antigravity-guide');
    expect(r.command).toBe('antigravity-guide');
    expect(r.isValid).toBe(true);
  });

  it('Tất cả 7 lệnh đều parse được', () => {
    const cmds = ['goal','schedule','plan','grill-me','learn','agy-customizations','antigravity-guide'];
    cmds.forEach(cmd => {
      const r = parseSlashCommand(`/${cmd}`);
      expect(r.command).toBe(cmd);
      expect(r.isValid).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 2A — parseSlashCommand Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSlashCommand — Edge Cases', () => {
  it('LOG-04: Double slash //goal → INVALID_FORMAT', () => {
    const r = parseSlashCommand('//goal');
    expect(r.command).toBeNull();
    expect(r.error).toBe('INVALID_FORMAT');
  });

  it('LOG-05: Slash ở giữa câu → không parse', () => {
    const r = parseSlashCommand('Hôm nay tôi /schedule');
    expect(r.command).toBeNull();
    expect(r.error).toBeUndefined();
  });

  it('LOG-06: Lệnh không hợp lệ /xyz → UNKNOWN_COMMAND', () => {
    const r = parseSlashCommand('/xyz-invalid');
    expect(r.command).toBeNull();
    expect(r.error).toBe('UNKNOWN_COMMAND');
  });

  it('LOG-07: Chỉ "/" → INCOMPLETE_COMMAND', () => {
    const r = parseSlashCommand('/');
    expect(r.command).toBeNull();
    expect(r.error).toBe('INCOMPLETE_COMMAND');
  });

  it('LOG-08: Thừa khoảng trắng → trim & parse đúng', () => {
    const r = parseSlashCommand('/  plan  ');
    expect(r.command).toBe('plan');
    expect(r.isValid).toBe(true);
  });

  it('Case insensitive: /GOAL → goal', () => {
    const r = parseSlashCommand('/GOAL');
    expect(r.command).toBe('goal');
    expect(r.isValid).toBe(true);
  });

  it('Input trống → command null', () => {
    expect(parseSlashCommand('').command).toBeNull();
  });

  it('Input chỉ khoảng trắng → command null', () => {
    expect(parseSlashCommand('   ').command).toBeNull();
  });

  it('Argument có ký tự đặc biệt & Unicode', () => {
    const r = parseSlashCommand('/plan Báo cáo & submit trước 23:59 😊');
    expect(r.command).toBe('plan');
    expect(r.args).toBe('Báo cáo & submit trước 23:59 😊');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 2B — Send Button Lock Logic
// ─────────────────────────────────────────────────────────────────────────────

describe('isSendDisabled — Send Button Lock', () => {
  function isSendDisabled(input: string, isStreaming: boolean): boolean {
    if (isStreaming) return true;
    const t = input.trim();
    if (!t || t === '/') return true;
    return false;
  }

  it('LOG-09: Input rỗng → disabled', () => expect(isSendDisabled('', false)).toBe(true));
  it('LOG-10: Input khoảng trắng → disabled', () => expect(isSendDisabled('   ', false)).toBe(true));
  it('LOG-11: Input "/" đơn → disabled', () => expect(isSendDisabled('/', false)).toBe(true));
  it('LOG-12: Đang streaming → disabled', () => expect(isSendDisabled('/goal', true)).toBe(true));
  it('Input hợp lệ + không stream → enabled', () => expect(isSendDisabled('/goal', false)).toBe(false));
  it('Plain message → enabled', () => expect(isSendDisabled('Hello', false)).toBe(false));
});

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 2C — Model Switch Logic
// ─────────────────────────────────────────────────────────────────────────────

describe('Model Switch — Payload model ID', () => {
  const MODEL_MAP: Record<string, string> = {
    'Gemini 3.1 Pro High': 'gemini-3.1-pro-high',
    'Gemini Flash': 'gemini-flash',
    'Claude Sonnet 4.6': 'claude-sonnet-4-6',
    'Claude Opus 4.6': 'claude-opus-4-6',
  };

  function getModelId(displayName: string): string {
    const id = MODEL_MAP[displayName];
    if (!id) throw new Error(`Unknown model: ${displayName}`);
    return id;
  }

  it('LOG-13a: "Gemini 3.1 Pro High" → "gemini-3.1-pro-high"', () => {
    expect(getModelId('Gemini 3.1 Pro High')).toBe('gemini-3.1-pro-high');
  });
  it('LOG-13b: Switch sang "Gemini Flash" → "gemini-flash"', () => {
    expect(getModelId('Gemini Flash')).toBe('gemini-flash');
  });
  it('LOG-13c: Model không tồn tại → throw', () => {
    expect(() => getModelId('Unknown Model')).toThrow('Unknown model');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 3A — Zod Schema: SlashCommandList
// ─────────────────────────────────────────────────────────────────────────────

describe('Zod — SlashCommandListSchema', () => {
  it('7 lệnh hợp lệ pass', () => {
    expect(() => SlashCommandListSchema.parse(validCommands)).not.toThrow();
  });
  it('Thiếu "icon" → reject', () => {
    const noIcon = validCommands.map(({ icon: _i, ...rest }) => rest);
    expect(() => SlashCommandListSchema.parse(noIcon)).toThrow();
  });
  it('Tên lệnh chữ HOA → reject', () => {
    expect(() => SlashCommandConfigSchema.parse({ ...validCommands[0], name: 'Goal' })).toThrow();
  });
  it('Description > 500 ký tự → reject', () => {
    expect(() => SlashCommandConfigSchema.parse({ ...validCommands[0], description: 'a'.repeat(501) })).toThrow();
  });
  it('Chỉ 6 lệnh (thiếu 1) → reject', () => {
    expect(() => SlashCommandListSchema.parse(validCommands.slice(0, 6))).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 3A — Zod Schema: ChatPayload
// ─────────────────────────────────────────────────────────────────────────────

describe('Zod — ChatPayloadSchema', () => {
  it('Payload hợp lệ pass', () => {
    expect(() => ChatPayloadSchema.parse(basePayload)).not.toThrow();
  });
  it('message rỗng → reject', () => {
    expect(() => ChatPayloadSchema.parse({ ...basePayload, message: '' })).toThrow();
  });
  it('message > 10000 ký tự → reject', () => {
    expect(() => ChatPayloadSchema.parse({ ...basePayload, message: 'a'.repeat(10001) })).toThrow();
  });
  it('model không trong enum → reject', () => {
    expect(() => ChatPayloadSchema.parse({ ...basePayload, model: 'gpt-4' as any })).toThrow();
  });
  it('sessionId không phải UUID → reject', () => {
    expect(() => ChatPayloadSchema.parse({ ...basePayload, sessionId: 'not-uuid' })).toThrow();
  });
  it('timestamp âm → reject', () => {
    expect(() => ChatPayloadSchema.parse({ ...basePayload, timestamp: -1 })).toThrow();
  });
  it('command = null (plain message) → accept', () => {
    expect(() => ChatPayloadSchema.parse({ ...basePayload, command: null })).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 3B — XSS Sanitization
// ─────────────────────────────────────────────────────────────────────────────

describe('XSS Sanitization', () => {
  function sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/on\w+\s*=/gi, 'data-blocked=');
  }

  it("DAT-01: <script>alert('xss')</script> → escaped", () => {
    const out = sanitizeHtml("<script>alert('xss')</script>");
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('DAT-02: <img onerror="..."> → escaped', () => {
    const out = sanitizeHtml('<img src=x onerror="alert(1)">');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('onerror');
  });

  it('DAT-05: Message 10001 ký tự → schema reject', () => {
    expect(() =>
      ChatPayloadSchema.parse({ ...basePayload, message: 'a'.repeat(10001) })
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PHẦN 3B — Chat History Storage Integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('Chat History LocalStorage Integrity (DAT-06, DAT-07)', () => {
  const validHistory = [
    { id: '550e8400-e29b-41d4-a716-446655440001', role: 'user',      content: '/goal Hoàn thành đồ án', timestamp: 1728299000000, command: 'goal' },
    { id: '550e8400-e29b-41d4-a716-446655440002', role: 'assistant', content: 'Tôi sẽ giúp bạn.', timestamp: 1728299010000, model: 'gemini-3.1-pro-high' },
  ];

  it('DAT-06: History hợp lệ pass schema sau parse JSON', () => {
    const parsed = JSON.parse(JSON.stringify(validHistory));
    expect(() => ChatHistorySchema.parse(parsed)).not.toThrow();
  });

  it('DAT-07: Data corrupt (role hacker) → schema reject', () => {
    const corrupt = [{ role: 'hacker', content: 'injected' }];
    expect(() => ChatHistorySchema.parse(corrupt)).toThrow();
  });

  it('DAT-07b: Missing timestamp → reject', () => {
    const noTs = [{ id: '550e8400-e29b-41d4-a716-446655440001', role: 'user', content: 'Hello' }];
    expect(() => ChatHistorySchema.parse(noTs)).toThrow();
  });

  it('DAT-07c: Invalid UUID → reject', () => {
    expect(() => ChatHistorySchema.parse([{ ...validHistory[0], id: 'bad-id' }])).toThrow();
  });
});
