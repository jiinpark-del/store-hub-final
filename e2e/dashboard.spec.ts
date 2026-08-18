import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard with KPI tiles', async ({ page }) => {
    // Check for dashboard title
    await expect(page.locator('text=판매 대시보드')).toBeVisible();

    // Check for KPI sections
    await expect(page.locator('text=총 판매액')).toBeVisible();
    await expect(page.locator('text=총 거래')).toBeVisible();
    await expect(page.locator('text=평균 거래액')).toBeVisible();

    // Check for revenue amount (should contain numbers)
    const revenueText = page.locator('text=/45,230|45230/');
    await expect(revenueText).toBeVisible();
  });

  test('should display store performance table', async ({ page }) => {
    // Check table headers
    await expect(page.locator('text=지점명')).toBeVisible();
    await expect(page.locator('text=판매액')).toBeVisible();
    await expect(page.locator('text=거래수')).toBeVisible();

    // Check for store data
    await expect(page.locator('text=신론점')).toBeVisible();
    await expect(page.locator('text=강남점')).toBeVisible();
    await expect(page.locator('text=명동점')).toBeVisible();
  });

  test('should display sales ratio chart', async ({ page }) => {
    // Check for chart section
    await expect(page.locator('text=지점별 매출 비율')).toBeVisible();

    // Check for store percentages
    await expect(page.locator('text=/33\.7%|33.7/').first()).toBeVisible();
    await expect(page.locator('text=/28\.5%|28.5/').first()).toBeVisible();
  });

  test('should show alert for low-performing store', async ({ page }) => {
    // Check for warning section
    await expect(page.locator('text=주의 필요')).toBeVisible();
    await expect(page.locator('text=명동점에서 거래량이 감소')).toBeVisible();
  });

  test('should navigate through tabs', async ({ page }) => {
    // Check dashboard tab is active
    await expect(page.locator('text=대시보드')).toBeVisible();

    // Click on invoice management tab
    await page.locator('text=송장 관리').click();
    await expect(page.locator('text=송장 관리')).toBeVisible();

    // Click on reconciliation tab
    await page.locator('text=대조 관리').click();
    await expect(page.locator('text=대조 관리')).toBeVisible();

    // Go back to dashboard
    await page.locator('text=대시보드').click();
    await expect(page.locator('text=판매 대시보드')).toBeVisible();
  });
});
