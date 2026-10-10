import { test, expect } from '@playwright/test';

// Smoke test: từ hub chọn cổng Quản trị -> form đăng nhập admin render (không cần backend).
test('vào cổng đăng nhập quản trị từ hub', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Chọn cổng đăng nhập' })).toBeVisible();

  await page.locator('[data-portal="admin"]').getByRole('link', { name: /Đăng nhập/ }).click();

  await expect(page.getByPlaceholder('VD: admin')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Đăng nhập/ })).toBeVisible();
});
