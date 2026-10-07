/**
 * ============================================================================
 *  Bộ Kiểm Thử Tự Động Hóa UI/UX — Menu Gợi Ý Lệnh (Slash Command `/`)
 * ============================================================================
 *
 *  Dự án   : DevMarkie/DoAnChuyenNganh
 *  Framework: Playwright (TypeScript)
 *  Ngày tạo : 2026-10-07
 *
 *  Cách chạy:
 *    1. npm init playwright@latest   (nếu chưa cài)
 *    2. npx playwright test tests/slash-command-menu.spec.ts --headed
 *
 *  Lưu ý:
 *    - Các selector (data-testid, role, CSS class) trong file này dựa trên
 *      cấu trúc DOM thực tế phổ biến. Cần điều chỉnh nếu DOM frontend khác.
 *    - BASE_URL mặc định: http://localhost:5173 (Vite dev server)
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

// ─── CONFIG ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

/**
 * Danh sách 7 Slash Commands hiển thị trên giao diện,
 * đúng thứ tự và dữ liệu thực tế.
 */
const SLASH_COMMANDS = [
  {
    name: 'goal',
    description: 'Run until the specified goal is completely finished.',
    isTruncated: false,
  },
  {
    name: 'schedule',
    description:
      'Run an instruction on a recurring schedule or as a one-time timer.',
    isTruncated: false,
  },
  {
    name: 'plan',
    description: 'Plan carefully before executing a task.',
    isTruncated: false,
  },
  {
    name: 'grill-me',
    description: 'Interview me to align on a plan.',
    isTruncated: false,
  },
  {
    name: 'learn',
    description:
      'Reflect on recent successes or corrections to capture reusable skills or rules.',
    isTruncated: false,
  },
  {
    name: 'agy-customizations',
    description:
      'Comprehensive guide and reference for the Antigravity Customization System. Use to explain how customi...',
    isTruncated: true,
  },
  {
    name: 'antigravity-guide',
    description:
      'Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY), including the A...',
    isTruncated: true,
  },
] as const;

// ─── SELECTORS (adapt to your actual DOM) ──────────────────────────────────────
// Điều chỉnh các selector bên dưới cho phù hợp với cấu trúc DOM thực tế của
// frontend. Dùng data-testid khi có, hoặc CSS class / role attribute.

const SEL = {
  /** Ô nhập liệu chat chính */
  chatInput: '[data-testid="chat-input"], textarea[placeholder*="message"], input[placeholder*="/"]',
  /** Container popup menu (toàn bộ popup) */
  popup: '[data-testid="slash-command-menu"], [role="listbox"], .slash-command-popup, .command-menu',
  /** Một mục lệnh trong popup */
  menuItem: '[data-testid="slash-command-item"], [role="option"], .slash-command-item, .command-item',
  /** Tên lệnh bên trong mục */
  itemName: '.command-name, .item-name, [data-testid="command-name"], strong',
  /** Mô tả lệnh bên trong mục */
  itemDescription: '.command-description, .item-description, [data-testid="command-description"], .description',
  /** Icon bên trong mục */
  itemIcon: '.command-icon, .item-icon, [data-testid="command-icon"], svg, .icon',
  /** Mục đang active/selected */
  activeItem: '[aria-selected="true"], .active, .selected, .highlighted, [data-active="true"]',
} as const;

// ─── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Mở popup Slash Command bằng cách gõ `/` vào ô chat.
 * Chờ popup hiển thị trước khi trả về.
 */
async function openSlashMenu(page: Page): Promise<void> {
  const input = page.locator(SEL.chatInput).first();
  await input.click();
  await input.fill('/');
  // Chờ popup hiển thị
  await expect(page.locator(SEL.popup).first()).toBeVisible({ timeout: 3000 });
}

/**
 * Lấy tất cả các mục (items) đang hiển thị trong popup.
 */
function getMenuItems(page: Page): Locator {
  return page.locator(SEL.popup).first().locator(SEL.menuItem);
}

/**
 * Lấy item đang active/selected trong popup.
 */
function getActiveItem(page: Page): Locator {
  return page.locator(SEL.popup).first().locator(SEL.activeItem).first();
}

/**
 * Gõ filter text vào ô chat (thay thế nội dung hiện tại).
 */
async function typeFilter(page: Page, text: string): Promise<void> {
  const input = page.locator(SEL.chatInput).first();
  await input.click();
  await input.fill(text);
}

// ─── NAVIGATION & AUTH ─────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  // Điều hướng đến trang có ô chat input.
  // Nếu cần login trước, thêm logic auth ở đây.
  await page.goto(BASE_URL);
  // Chờ ô input sẵn sàng
  await page.locator(SEL.chatInput).first().waitFor({ state: 'visible', timeout: 10000 });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PHẦN 1: KIỂM THỬ UI (GIAO DIỆN)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('UI — Slash Command Menu', () => {
  // ── UI-01: Popup hiển thị đầy đủ 7 mục ──────────────────────────────────────
  test('UI-01: Popup hiển thị đầy đủ 7 mục khi gõ /', async ({ page }) => {
    await openSlashMenu(page);

    const items = getMenuItems(page);
    await expect(items).toHaveCount(SLASH_COMMANDS.length);

    // Kiểm tra thứ tự tên lệnh
    for (let i = 0; i < SLASH_COMMANDS.length; i++) {
      const itemName = items.nth(i).locator(SEL.itemName).first();
      await expect(itemName).toContainText(SLASH_COMMANDS[i].name);
    }
  });

  // ── UI-02: Dark Mode — Nền popup ─────────────────────────────────────────────
  test('UI-02: Dark Mode — Nền popup tối', async ({ page }) => {
    await openSlashMenu(page);

    const popup = page.locator(SEL.popup).first();
    const bgColor = await popup.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Parse RGB và kiểm tra luminance thấp (nền tối)
    const rgbMatch = bgColor.match(/\d+/g);
    expect(rgbMatch).not.toBeNull();
    if (rgbMatch) {
      const [r, g, b] = rgbMatch.map(Number);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      // Luminance < 80 → nền tối
      expect(luminance).toBeLessThan(80);
    }
  });

  // ── UI-03: Dark Mode — Màu chữ tên lệnh (contrast) ──────────────────────────
  test('UI-03: Dark Mode — Màu chữ tên lệnh đủ contrast', async ({ page }) => {
    await openSlashMenu(page);

    const firstItemName = getMenuItems(page).first().locator(SEL.itemName).first();
    const color = await firstItemName.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    const rgbMatch = color.match(/\d+/g);
    expect(rgbMatch).not.toBeNull();
    if (rgbMatch) {
      const [r, g, b] = rgbMatch.map(Number);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      // Text sáng trên nền tối → luminance > 150
      expect(luminance).toBeGreaterThan(150);
    }
  });

  // ── UI-05 & UI-06: Icon hiển thị và canh đều hàng ────────────────────────────
  test('UI-05 & UI-06: Icon hiển thị đầy đủ và canh đều hàng với text', async ({ page }) => {
    await openSlashMenu(page);

    const items = getMenuItems(page);
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const icon = item.locator(SEL.itemIcon).first();
      const name = item.locator(SEL.itemName).first();

      // Icon phải hiển thị
      await expect(icon).toBeVisible();

      // Kiểm tra alignment — icon và name cùng bounding box chiều Y
      const iconBox = await icon.boundingBox();
      const nameBox = await name.boundingBox();

      expect(iconBox).not.toBeNull();
      expect(nameBox).not.toBeNull();

      if (iconBox && nameBox) {
        // Icon center Y gần bằng name center Y (±10px tolerance)
        const iconCenterY = iconBox.y + iconBox.height / 2;
        const nameCenterY = nameBox.y + nameBox.height / 2;
        expect(Math.abs(iconCenterY - nameCenterY)).toBeLessThan(10);
      }
    }
  });

  // ── UI-07: Text Overflow — agy-customizations ─────────────────────────────────
  test('UI-07: Text Overflow ellipsis — agy-customizations', async ({ page }) => {
    await openSlashMenu(page);

    // Tìm mục agy-customizations
    const items = getMenuItems(page);
    const agyItem = items.filter({ hasText: 'agy-customizations' }).first();
    await expect(agyItem).toBeVisible();

    const descEl = agyItem.locator(SEL.itemDescription).first();

    // Kiểm tra CSS text-overflow: ellipsis hoặc -webkit-line-clamp
    const overflowProps = await descEl.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        textOverflow: style.textOverflow,
        overflow: style.overflow,
        whiteSpace: style.whiteSpace,
        webkitLineClamp: style.getPropertyValue('-webkit-line-clamp'),
      };
    });

    const hasEllipsis =
      overflowProps.textOverflow === 'ellipsis' ||
      overflowProps.webkitLineClamp !== '';

    expect(hasEllipsis).toBeTruthy();

    // Đảm bảo element không tràn container
    const descBox = await descEl.boundingBox();
    const popupBox = await page.locator(SEL.popup).first().boundingBox();
    if (descBox && popupBox) {
      expect(descBox.x + descBox.width).toBeLessThanOrEqual(
        popupBox.x + popupBox.width + 2 // 2px tolerance
      );
    }
  });

  // ── UI-08: Text Overflow — antigravity-guide ──────────────────────────────────
  test('UI-08: Text Overflow ellipsis — antigravity-guide', async ({ page }) => {
    await openSlashMenu(page);

    const items = getMenuItems(page);
    const guideItem = items.filter({ hasText: 'antigravity-guide' }).first();
    await expect(guideItem).toBeVisible();

    const descEl = guideItem.locator(SEL.itemDescription).first();

    const overflowProps = await descEl.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        textOverflow: style.textOverflow,
        overflow: style.overflow,
        webkitLineClamp: style.getPropertyValue('-webkit-line-clamp'),
      };
    });

    const hasEllipsis =
      overflowProps.textOverflow === 'ellipsis' ||
      overflowProps.webkitLineClamp !== '';

    expect(hasEllipsis).toBeTruthy();
  });

  // ── UI-09: Các lệnh mô tả ngắn KHÔNG bị cắt ─────────────────────────────────
  test('UI-09: Lệnh mô tả ngắn hiển thị đầy đủ, không bị cắt', async ({ page }) => {
    await openSlashMenu(page);

    const shortCommands = SLASH_COMMANDS.filter((c) => !c.isTruncated);
    const items = getMenuItems(page);

    for (const cmd of shortCommands) {
      const item = items.filter({ hasText: cmd.name }).first();
      const descEl = item.locator(SEL.itemDescription).first();

      // scrollWidth ≤ clientWidth → không bị cắt
      const isOverflowing = await descEl.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });

      expect(isOverflowing).toBeFalsy();
    }
  });

  // ── UI-10: Hover state — đổi màu nền mục ─────────────────────────────────────
  test('UI-10: Hover vào mục grill-me đổi màu nền', async ({ page }) => {
    await openSlashMenu(page);

    const items = getMenuItems(page);
    const grillMe = items.filter({ hasText: 'grill-me' }).first();

    // Lấy bg color trước hover
    const bgBefore = await grillMe.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Hover
    await grillMe.hover();
    await page.waitForTimeout(200); // chờ transition

    // Lấy bg color sau hover
    const bgAfter = await grillMe.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Phải khác nhau (hover highlight)
    expect(bgAfter).not.toEqual(bgBefore);
  });

  // ── UI-11: Active/Selected state — vệt chọn ──────────────────────────────────
  test('UI-11: Active state với ArrowDown tạo vệt chọn rõ ràng', async ({ page }) => {
    await openSlashMenu(page);

    // Nhấn ArrowDown 3 lần → mục thứ 4: grill-me
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.waitForTimeout(100);

    const activeItem = getActiveItem(page);
    await expect(activeItem).toBeVisible();
    await expect(activeItem).toContainText('grill-me');

    // Kiểm tra background khác nền mặc định
    const activeBg = await activeItem.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Active bg phải khác 'transparent' hoặc 'rgba(0, 0, 0, 0)'
    expect(activeBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(activeBg).not.toBe('transparent');
  });

  // ── UI-12: Popup kích thước & vị trí ──────────────────────────────────────────
  test('UI-12: Popup kích thước phù hợp và nằm trong viewport', async ({ page }) => {
    await openSlashMenu(page);

    const popupBox = await page.locator(SEL.popup).first().boundingBox();
    const viewport = page.viewportSize();

    expect(popupBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (popupBox && viewport) {
      // Chiều rộng ≥ 300px
      expect(popupBox.width).toBeGreaterThanOrEqual(300);

      // Nằm trong viewport
      expect(popupBox.x).toBeGreaterThanOrEqual(0);
      expect(popupBox.y).toBeGreaterThanOrEqual(0);
      expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(viewport.width + 5);
      expect(popupBox.y + popupBox.height).toBeLessThanOrEqual(viewport.height + 5);
    }
  });

  // ── UI-13: Popup có box-shadow ────────────────────────────────────────────────
  test('UI-13: Popup có box-shadow / elevation', async ({ page }) => {
    await openSlashMenu(page);

    const boxShadow = await page.locator(SEL.popup).first().evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    // box-shadow phải khác 'none'
    expect(boxShadow).not.toBe('none');
  });

  // ── UI-15: Font nhất quán ─────────────────────────────────────────────────────
  test('UI-15: Font-family nhất quán giữa tất cả các mục', async ({ page }) => {
    await openSlashMenu(page);

    const items = getMenuItems(page);
    const count = await items.count();
    const fonts: string[] = [];

    for (let i = 0; i < count; i++) {
      const font = await items.nth(i).locator(SEL.itemName).first().evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      fonts.push(font);
    }

    // Tất cả cùng font-family
    const uniqueFonts = [...new Set(fonts)];
    expect(uniqueFonts).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PHẦN 2: KIỂM THỬ UX (TRẢI NGHIỆM NGƯỜI DÙNG)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('UX — Slash Command Menu', () => {
  // ── UX-01: Gõ / mở popup đầy đủ 7 lệnh ──────────────────────────────────────
  test('UX-01: Gõ / mở popup chứa đầy đủ 7 lệnh', async ({ page }) => {
    const input = page.locator(SEL.chatInput).first();
    await input.click();

    const start = Date.now();
    await input.fill('/');
    await expect(page.locator(SEL.popup).first()).toBeVisible({ timeout: 3000 });
    const elapsed = Date.now() - start;

    // Popup mở nhanh < 500ms (bao gồm fill + render)
    expect(elapsed).toBeLessThan(500);

    // Đúng 7 mục
    const items = getMenuItems(page);
    await expect(items).toHaveCount(7);
  });

  // ── UX-02: Lọc /sch → schedule ───────────────────────────────────────────────
  test('UX-02: Lọc /sch chỉ hiển thị schedule', async ({ page }) => {
    await typeFilter(page, '/sch');

    const popup = page.locator(SEL.popup).first();
    await expect(popup).toBeVisible({ timeout: 3000 });

    const items = getMenuItems(page);
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('schedule');
  });

  // ── UX-03: Lọc /agy → agy-customizations ─────────────────────────────────────
  test('UX-03: Lọc /agy hiển thị agy-customizations', async ({ page }) => {
    await typeFilter(page, '/agy');

    const popup = page.locator(SEL.popup).first();
    await expect(popup).toBeVisible({ timeout: 3000 });

    const items = getMenuItems(page);
    // Ít nhất 1 mục chứa "agy-customizations"
    const agyItem = items.filter({ hasText: 'agy-customizations' });
    await expect(agyItem).toHaveCount(1);
  });

  // ── UX-04: Lọc /pl → plan ────────────────────────────────────────────────────
  test('UX-04: Lọc /pl chỉ hiển thị plan', async ({ page }) => {
    await typeFilter(page, '/pl');

    const popup = page.locator(SEL.popup).first();
    await expect(popup).toBeVisible({ timeout: 3000 });

    const items = getMenuItems(page);
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('plan');
  });

  // ── UX-05: Lọc /g → goal, grill-me ───────────────────────────────────────────
  test('UX-05: Lọc /g hiển thị goal và grill-me', async ({ page }) => {
    await typeFilter(page, '/g');

    const popup = page.locator(SEL.popup).first();
    await expect(popup).toBeVisible({ timeout: 3000 });

    const items = getMenuItems(page);
    await expect(items).toHaveCount(2);

    const names = await items.allTextContents();
    const combined = names.join(' ');
    expect(combined).toContain('goal');
    expect(combined).toContain('grill-me');
  });

  // ── UX-06: Lọc /xyz → không khớp ─────────────────────────────────────────────
  test('UX-06: Lọc /xyz không có kết quả', async ({ page }) => {
    await typeFilter(page, '/xyz');
    await page.waitForTimeout(300);

    const popup = page.locator(SEL.popup).first();
    // Popup có thể ẩn đi hoặc hiển thị "No results"
    const isVisible = await popup.isVisible().catch(() => false);

    if (isVisible) {
      const items = getMenuItems(page);
      const count = await items.count();
      expect(count).toBe(0);
    }
    // Nếu popup đã ẩn → đạt yêu cầu
  });

  // ── UX-07: ArrowDown di chuyển vệt chọn ──────────────────────────────────────
  test('UX-07: ArrowDown di chuyển vệt chọn xuống tuần tự', async ({ page }) => {
    await openSlashMenu(page);

    const expectedOrder = ['goal', 'schedule', 'plan', 'grill-me'];

    for (let i = 0; i < expectedOrder.length; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);

      const active = getActiveItem(page);
      await expect(active).toContainText(expectedOrder[i]);
    }
  });

  // ── UX-08: ArrowUp di chuyển vệt chọn lên ────────────────────────────────────
  test('UX-08: ArrowDown rồi ArrowUp di chuyển đúng', async ({ page }) => {
    await openSlashMenu(page);

    // Đi xuống 4 lần → đến `learn` (mục 5)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown');
    }

    // Đi lên 2 lần → đến `plan` (mục 3)
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('ArrowUp');
    }
    await page.waitForTimeout(50);

    const active = getActiveItem(page);
    await expect(active).toContainText('plan');
  });

  // ── UX-09: ArrowDown wrap/clamp ở cuối danh sách ─────────────────────────────
  test('UX-09: ArrowDown wrap hoặc clamp khi tới cuối danh sách', async ({ page }) => {
    await openSlashMenu(page);

    // Nhấn ArrowDown 8 lần (vượt 7 mục)
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.waitForTimeout(50);

    const active = getActiveItem(page);
    const text = await active.textContent();

    // Wrap → mục đầu (goal) HOẶC Clamp → mục cuối (antigravity-guide)
    const isGoal = text?.includes('goal') || false;
    const isLastItem = text?.includes('antigravity-guide') || false;
    expect(isGoal || isLastItem).toBeTruthy();
  });

  // ── UX-10: Enter chọn lệnh và điền vào ô chat ────────────────────────────────
  test('UX-10: Enter chọn lệnh schedule và điền vào ô chat', async ({ page }) => {
    await openSlashMenu(page);

    // ArrowDown 1 lần → schedule
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Popup đóng
    const popup = page.locator(SEL.popup).first();
    await expect(popup).not.toBeVisible({ timeout: 2000 });

    // Ô input chứa /schedule
    const input = page.locator(SEL.chatInput).first();
    const value = await input.inputValue();
    expect(value).toContain('/schedule');
  });

  // ── UX-11: Filter + Enter ─────────────────────────────────────────────────────
  test('UX-11: Gõ /sch rồi Enter chọn schedule', async ({ page }) => {
    await typeFilter(page, '/sch');
    await page.waitForTimeout(200);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const popup = page.locator(SEL.popup).first();
    await expect(popup).not.toBeVisible({ timeout: 2000 });

    const input = page.locator(SEL.chatInput).first();
    const value = await input.inputValue();
    expect(value).toContain('/schedule');
  });

  // ── UX-12: Click chuột chọn mục ──────────────────────────────────────────────
  test('UX-12: Click chuột vào mục learn', async ({ page }) => {
    await openSlashMenu(page);

    const learnItem = getMenuItems(page).filter({ hasText: 'learn' }).first();
    await learnItem.click();
    await page.waitForTimeout(100);

    // Popup đóng
    const popup = page.locator(SEL.popup).first();
    await expect(popup).not.toBeVisible({ timeout: 2000 });

    // Ô input chứa /learn
    const input = page.locator(SEL.chatInput).first();
    const value = await input.inputValue();
    expect(value).toContain('/learn');
  });

  // ── UX-13: Escape đóng popup ─────────────────────────────────────────────────
  test('UX-13: Escape đóng popup, giữ nguyên nội dung', async ({ page }) => {
    await openSlashMenu(page);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    const popup = page.locator(SEL.popup).first();
    await expect(popup).not.toBeVisible({ timeout: 2000 });

    // Input vẫn giữ nguyên "/"
    const input = page.locator(SEL.chatInput).first();
    const value = await input.inputValue();
    expect(value).toBe('/');
  });

  // ── UX-14: Xóa / bằng Backspace đóng popup ──────────────────────────────────
  test('UX-14: Backspace xóa / đóng popup', async ({ page }) => {
    await openSlashMenu(page);

    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);

    const popup = page.locator(SEL.popup).first();
    await expect(popup).not.toBeVisible({ timeout: 2000 });

    // Input trống
    const input = page.locator(SEL.chatInput).first();
    const value = await input.inputValue();
    expect(value).toBe('');
  });

  // ── UX-15: Slash ở giữa câu ──────────────────────────────────────────────────
  test('UX-15: Gõ / ở giữa câu — popup KHÔNG mở', async ({ page }) => {
    const input = page.locator(SEL.chatInput).first();
    await input.click();
    await input.fill('Hello /');
    await page.waitForTimeout(300);

    const popup = page.locator(SEL.popup).first();
    const isVisible = await popup.isVisible().catch(() => false);

    // Popup không nên mở khi / không ở đầu input
    expect(isVisible).toBeFalsy();
  });

  // ── UX-16: Case Insensitive ───────────────────────────────────────────────────
  test('UX-16: Lọc /GOAL (chữ hoa) vẫn hiển thị goal', async ({ page }) => {
    await typeFilter(page, '/GOAL');
    await page.waitForTimeout(200);

    const popup = page.locator(SEL.popup).first();
    const isVisible = await popup.isVisible().catch(() => false);

    if (isVisible) {
      const items = getMenuItems(page);
      await expect(items).toHaveCount(1);
      await expect(items.first()).toContainText('goal');
    }
    // Nếu popup ẩn → cần xem spec có yêu cầu case-insensitive không
  });

  // ── UX-17: Lọc realtime — /g → /go → /goa ────────────────────────────────────
  test('UX-17: Lọc realtime khi gõ từng ký tự', async ({ page }) => {
    const input = page.locator(SEL.chatInput).first();
    await input.click();

    // Step 1: Gõ /g → expect 2 mục (goal, grill-me)
    await input.fill('/g');
    await page.waitForTimeout(150);
    let items = getMenuItems(page);
    await expect(items).toHaveCount(2);

    // Step 2: Gõ /go → expect 1 mục (goal)
    await input.fill('/go');
    await page.waitForTimeout(150);
    items = getMenuItems(page);
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('goal');

    // Step 3: Gõ /goa → expect 1 mục (goal)
    await input.fill('/goa');
    await page.waitForTimeout(150);
    items = getMenuItems(page);
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('goal');
  });

  // ── UX-18: Tab không thoát popup ──────────────────────────────────────────────
  test('UX-18: Tab không di chuyển focus ra ngoài popup', async ({ page }) => {
    await openSlashMenu(page);

    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Popup vẫn mở HOẶC đã đóng nhưng focus vẫn ở input
    const popup = page.locator(SEL.popup).first();
    const input = page.locator(SEL.chatInput).first();

    const popupVisible = await popup.isVisible().catch(() => false);
    const inputFocused = await input.evaluate((el) => document.activeElement === el);

    // Popup vẫn mở HOẶC focus vẫn ở input → OK
    expect(popupVisible || inputFocused).toBeTruthy();
  });
});
