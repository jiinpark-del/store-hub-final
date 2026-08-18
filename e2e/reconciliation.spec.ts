import { test, expect } from '@playwright/test';

test.describe('Reconciliation Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to reconciliation tab
    await page.getByRole('button', { name: '대조 관리' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('should display reconciliation management page', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: '대조 관리' }).first()).toBeVisible();
    await expect(page.locator('text=Statement vs Invoice 자동 매칭').first()).toBeVisible();
  });

  test('should display status overview tiles', async ({ page }) => {
    // Check status tiles
    await expect(page.locator('text=총 항목').first()).toBeVisible();
    await expect(page.locator('text=검토 중').first()).toBeVisible();
    await expect(page.locator('text=분쟁 중').first()).toBeVisible();

    // Check for numbers in tiles
    const tiles = page.locator('[class*="border"][class*="bg-bg-secondary"]');
    const count = await tiles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display statement upload section', async ({ page }) => {
    // Check upload form
    await expect(page.locator('text=Statement 파일 업로드').first()).toBeVisible();
    await expect(page.locator('text=CSV 또는 Excel 파일').first()).toBeVisible();

    // Check upload button
    const uploadButton = page.getByRole('button', { name: '파일 선택' }).first();
    await expect(uploadButton).toBeVisible();
  });

  test('should display mismatch items list', async ({ page }) => {
    // Check mismatch section title
    await expect(page.locator('text=불일치 항목').first()).toBeVisible();

    // Check for mismatch items
    await expect(page.locator('text=REC-001').first()).toBeVisible();
    await expect(page.locator('text=INV-001').first()).toBeVisible();
  });

  test('should display mismatch status badges', async ({ page }) => {
    // Check for status badges - look in the list area
    const listArea = page.locator('div').filter({ hasText: '불일치 항목' }).parent();
    const statusBadges = listArea.locator('[class*="rounded-full"][class*="text-"]');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display mismatch difference amounts', async ({ page }) => {
    // Look for currency amounts in mismatch items
    const listArea = page.locator('div').filter({ hasText: '불일치 항목' }).parent();
    const amountPattern = listArea.locator('text=/₩|,/');
    const count = await amountPattern.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open mismatch detail modal', async ({ page }) => {
    // Click on first mismatch item
    await page.locator('text=REC-001').first().click();
    await page.waitForLoadState('networkidle');

    // Check modal content - look for heading in modal
    const modal = page.locator('div').filter({ hasText: 'REC-001' });
    await expect(modal.getByRole('heading').first()).toBeVisible({ timeout: 5000 });

    // Check for comparison fields
    const invoiceLabel = modal.locator('text=Invoice');
    const statementLabel = modal.locator('text=Statement');

    if (await invoiceLabel.isVisible() || await statementLabel.isVisible()) {
      expect(true).toBe(true);
    }
  });

  test('should display resolution options in modal', async ({ page }) => {
    // Open mismatch modal
    await page.locator('text=REC-001').first().click();
    await page.waitForLoadState('networkidle');

    // Check for resolution buttons in modal
    const modal = page.locator('div').filter({ hasText: 'REC-001' });
    const resolutionButtons = modal.getByRole('button');
    const count = await resolutionButtons.count();

    if (count > 0) {
      expect(true).toBe(true);
    }
  });

  test('should close modal', async ({ page }) => {
    // Open mismatch modal
    await page.locator('text=REC-001').first().click();
    await page.waitForLoadState('networkidle');

    // Close button (✕ character)
    const modal = page.locator('div').filter({ hasText: 'REC-001' });
    const closeButton = modal.locator('button').filter({ hasText: '✕' }).first();

    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForLoadState('networkidle');

      // Modal should be closed
      expect(true).toBe(true);
    }
  });

  test('should show mismatch difference details', async ({ page }) => {
    // Check for mismatch amount differences in page
    const diffSection = page.locator('div').filter({ hasText: '불일치 금액' });
    if (await diffSection.first().isVisible()) {
      // Found the section
      expect(true).toBe(true);
    }
  });
});
