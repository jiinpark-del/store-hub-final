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
    await expect(page.getByRole('heading', { name: '판매 대시보드', exact: true })).toBeVisible();

    // Check for KPI sections (look for specific ones by their label context)
    await expect(page.locator('text=총 판매액').first()).toBeVisible();
    await expect(page.locator('text=총 거래').first()).toBeVisible();
    await expect(page.locator('text=평균 거래액').first()).toBeVisible();

    // Check for revenue amount (should contain numbers)
    const revenueText = page.locator('text=/45,230|45230/');
    await expect(revenueText.first()).toBeVisible();
  });

  test('should display store performance table', async ({ page }) => {
    // Check table headers using role
    await expect(page.getByRole('columnheader', { name: '지점명' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '판매액' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '거래수' })).toBeVisible();

    // Check for store data
    await expect(page.locator('table').locator('text=신론점')).toBeVisible();
    await expect(page.locator('table').locator('text=강남점')).toBeVisible();
    await expect(page.locator('table').locator('text=명동점')).toBeVisible();
  });

  test('should display sales ratio chart', async ({ page }) => {
    // Check for chart section
    await expect(page.getByRole('heading', { name: '지점별 매출 비율' })).toBeVisible();

    // Check for store percentages
    const chartSection = page.locator('div').filter({ hasText: '지점별 매출 비율' }).parent();
    await expect(chartSection.locator('text=/33\.7%|33.7/').first()).toBeVisible();
    await expect(chartSection.locator('text=/28\.5%|28.5/').first()).toBeVisible();
  });

  test('should show alert for low-performing store', async ({ page }) => {
    // Check for warning section
    await expect(page.locator('div').filter({ hasText: '주의 필요' }).first()).toBeVisible();
    await expect(page.locator('text=명동점에서 거래량이 감소').first()).toBeVisible();
  });

  test('should navigate through tabs', async ({ page }) => {
    // Check dashboard tab is active (look for the nav button)
    await expect(page.getByRole('button', { name: '대시보드' }).first()).toBeVisible();

    // Click on invoice management tab
    await page.getByRole('button', { name: '송장 관리' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '송장 관리' }).first()).toBeVisible();

    // Click on reconciliation tab
    await page.getByRole('button', { name: '대조 관리' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '대조 관리' }).first()).toBeVisible();

    // Go back to dashboard
    await page.getByRole('button', { name: '대시보드' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '판매 대시보드' })).toBeVisible();
  });
});
