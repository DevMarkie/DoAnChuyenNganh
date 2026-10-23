import { test, expect } from '@playwright/test';

test.describe('Responsive & Cross-Browser Compatibility (UI/UX)', () => {

  test('Hub & Cổng Đăng nhập không bị tràn ngang và input đạt chuẩn iOS 16px', async ({ page }) => {
    // 1. Kiểm tra Portal Hub trên mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/login');
    await expect(page.getByRole('heading', { name: /Chọn cổng/i })).toBeVisible();

    let isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(isOverflowing).toBe(false);

    // 2. Chuyển vào Cổng Sinh viên
    await page.locator('[data-portal="student"]').click();
    await expect(page.locator('input[type="text"]')).toBeVisible();

    isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(isOverflowing).toBe(false);

    // 3. Kiểm tra chuẩn iOS: font-size của input trên mobile phải >= 16px để chống auto-zoom
    const inputFontSize = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      return parseFloat(window.getComputedStyle(input).fontSize);
    });
    expect(inputFontSize).toBeGreaterThanOrEqual(16);
  });

  test('Mobile Drawer Sidebar mở/đóng mượt mà qua nút Hamburger và nút Đóng/Backdrop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/student/login');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');

    // Chờ vào Student Dashboard
    await page.waitForURL(/student\/dashboard/, { timeout: 10_000 });
    await expect(page.locator('.app-header')).toBeVisible();

    // 1. Sidebar ban đầu ẩn khỏi màn hình
    const initialSidebarState = await page.evaluate(() => {
      const sb = document.querySelector('.sidebar');
      return {
        hasMobileOpen: sb.classList.contains('mobile-open'),
        transform: window.getComputedStyle(sb).transform
      };
    });
    expect(initialSidebarState.hasMobileOpen).toBe(false);

    // 2. Nút menu Hamburger hiển thị trên mobile
    const menuBtn = page.locator('.mobile-menu-toggle');
    await expect(menuBtn).toBeVisible();

    // 3. Bấm mở Drawer
    await menuBtn.click();
    await page.waitForTimeout(300);

    const openedState = await page.evaluate(() => {
      const sb = document.querySelector('.sidebar');
      const bd = document.querySelector('.sidebar-backdrop');
      return {
        hasMobileOpen: sb.classList.contains('mobile-open'),
        backdropShown: bd.classList.contains('show')
      };
    });
    expect(openedState.hasMobileOpen).toBe(true);
    expect(openedState.backdropShown).toBe(true);

    // 4. Bấm nút Đóng (X) trên Sidebar để đóng Drawer
    const closeBtn = page.locator('.mobile-close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(300);

    let closedState = await page.evaluate(() => {
      const sb = document.querySelector('.sidebar');
      return sb.classList.contains('mobile-open');
    });
    expect(closedState).toBe(false);

    // 5. Thử lại: Mở lại và click vùng Backdrop bên ngoài (x = 340px)
    await menuBtn.click();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.querySelector('.sidebar').classList.contains('mobile-open'))).toBe(true);

    // Click backdrop ở vùng không bị sidebar che (x=340, y=200)
    await page.mouse.click(340, 200);
    await page.waitForTimeout(300);

    closedState = await page.evaluate(() => {
      const sb = document.querySelector('.sidebar');
      return sb.classList.contains('mobile-open');
    });
    expect(closedState).toBe(false);
  });

  test('Toàn bộ các trang sinh viên không bị vỡ layout trên Mobile 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/student/login');
    await page.click('button[type="submit"]');
    await page.waitForURL(/student\/dashboard/, { timeout: 10_000 });

    const studentRoutes = [
      '/#/student/dashboard',
      '/#/student/schedule',
      '/#/student/transcript',
      '/#/student/enroll',
      '/#/student/profile'
    ];

    for (const route of studentRoutes) {
      await page.goto(route);
      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        isOverflow: document.documentElement.scrollWidth > window.innerWidth
      }));

      expect(metrics.isOverflow).toBe(false);
    }
  });

  test('Kiểm tra chế độ Dark/Light Mode chuyển đổi đồng nhất không vỡ giao diện', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/student/login');
    await page.click('button[type="submit"]');
    await page.waitForURL(/student\/dashboard/, { timeout: 10_000 });

    // Target nút theme trên header-right
    const themeToggleBtn = page.locator('.header-right .btn-icon').first();
    await expect(themeToggleBtn).toBeVisible();

    // Lấy theme ban đầu
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');

    // Bấm đổi theme
    await themeToggleBtn.click();
    await page.waitForTimeout(300);

    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);

    // Bấm đổi lại
    await themeToggleBtn.click();
    await page.waitForTimeout(300);

    const restoredTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(restoredTheme).toBe(initialTheme);
  });

});
