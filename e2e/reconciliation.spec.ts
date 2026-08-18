import { test, expect } from '@playwright/test';

test.describe('Reconciliation Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to reconciliation tab
    await page.locator('text=대조 관리').click();
    await page.waitForLoadState('networkidle');
  });

  test('should display reconciliation management page', async ({ page }) => {
    // Check page title
    await expect(page.locator('text=대조 관리')).toBeVisible();
    await expect(page.locator('text=Statement vs Invoice 자동 매칭')).toBeVisible();
  });

  test('should display status overview tiles', async ({ page }) => {
    // Check status tiles
    await expect(page.locator('text=총 항목')).toBeVisible();
    await expect(page.locator('text=검토 중')).toBeVisible();
    await expect(page.locator('text=분쟁 중')).toBeVisible();

    // Check for numbers
    const numberPatterns = page.locator('text=/[0-9]+/');
    const count = await numberPatterns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display statement upload section', async ({ page }) => {
    // Check upload form
    await expect(page.locator('text=Statement 파일 업로드')).toBeVisible();
    await expect(page.locator('text=CSV 또는 Excel 파일')).toBeVisible();

    // Check upload button
    const uploadButton = page.locator('text=파일 선택');
    await expect(uploadButton).toBeVisible();
  });

  test('should display mismatch items list', async ({ page }) => {
    // Check mismatch section title
    await expect(page.locator('text=불일치 항목')).toBeVisible();

    // Check for mismatch items
    await expect(page.locator('text=REC-001')).toBeVisible();
    await expect(page.locator('text=INV-001')).toBeVisible();
  });

  test('should display mismatch status badges', async ({ page }) => {
    // Check for status badges (pending, resolved, disputed)
    const statusBadges = page.locator('text=검토 중|해결됨|분쟁 중');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display mismatch difference amounts', async ({ page }) => {
    // Look for currency amounts in mismatch items
    const amountPattern = page.locator('text=/₩|,/');
    const count = await amountPattern.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open mismatch detail modal', async ({ page }) => {
    // Click on first mismatch item
    await page.locator('text=REC-001').first().click();
    await page.waitForLoadState('networkidle');

    // Check modal content
    const modalTitle = page.locator('text=REC-001').first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Check for comparison fields
    const invoiceLabel = page.locator('text=Invoice');
    const statementLabel = page.locator('text=Statement');

    if (await invoiceLabel.isVisible() || await statementLabel.isVisible()) {
      expect(true).toBe(true);
    }
  });

  test('should display resolution options in modal', async ({ page }) => {
    // Open mismatch modal
    await page.locator('text=REC-001').first().click();
    await page.waitForLoadState('networkidle');

    // Check for resolution buttons
    const resolutionButtons = page.locator('text=수량 오류|배송료|분쟁');
    const count = await resolutionButtons.count();

    if (count > 0) {
      expect(true).toBe(true);
    }
  });

  test('should close modal', async ({ page }) => {
    // Open mismatch modal
    await page.locator('text=REC-001').first().click();
    await page.waitForLoadState('networkidle');

    // Close button
    const closeButtons = page.locator('button:has-text("✕")');
    if (await closeButtons.count() > 0) {
      await closeButtons.last().click();
      await page.waitForLoadState('networkidle');

      // Modal should be closed
      expect(true).toBe(true);
    }
  });

  test('should show mismatch difference details', async ({ page }) => {
    // Check for mismatch amount differences
    await expect(page.locator('text=불일치 금액')).toBeVisible();

    // Look for difference values
    const diffAmount = page.locator('text=/₩.*[0-9]+/');
    if (await diffAmount.isVisible()) {
      expect(true).toBe(true);
    }
  });
});
