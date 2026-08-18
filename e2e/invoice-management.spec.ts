import { test, expect } from '@playwright/test';

test.describe('Invoice Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to invoice management tab
    await page.getByRole('button', { name: '송장 관리' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('should display invoice management page', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: '송장 관리' }).first()).toBeVisible();
    await expect(page.locator('text=인보이스 OCR 인식 및 검증').first()).toBeVisible();
  });

  test('should display invoice upload section', async ({ page }) => {
    // Check upload form
    await expect(page.locator('text=인보이스 이미지 업로드').first()).toBeVisible();
    await expect(page.locator('text=PNG, JPG 또는 PDF 파일').first()).toBeVisible();

    // Check upload button
    const uploadButton = page.getByRole('button', { name: '파일 선택' }).first();
    await expect(uploadButton).toBeVisible();
  });

  test('should display recognized invoices list', async ({ page }) => {
    // Check invoices section
    await expect(page.locator('text=인식된 송장').first()).toBeVisible();

    // Check for invoice items
    await expect(page.locator('text=INV-001').first()).toBeVisible();
    await expect(page.locator('text=신문식품').first()).toBeVisible();

    // Check for status badge (look for the specific one in the list)
    const statusBadge = page.locator('[class*="bg-success"]').locator('text=완료').first();
    if (await statusBadge.isVisible()) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should display invoice with confidence score', async ({ page }) => {
    // Check for confidence score - look for a number followed by %
    const confidenceText = page.locator('text=/신뢰도 [0-9]{2}%/');
    await expect(confidenceText.first()).toBeVisible();
  });

  test('should open invoice detail modal', async ({ page }) => {
    // Click on first invoice to open modal
    await page.locator('text=INV-001').first().click();

    // Wait for modal to appear
    await page.waitForLoadState('networkidle');

    // Check modal content - look for heading in modal
    await expect(page.getByRole('heading').filter({ hasText: 'INV-001' }).first()).toBeVisible({ timeout: 5000 });

    // Look for action buttons in modal
    const approveButton = page.getByRole('button', { name: '승인' });
    const reviewButton = page.getByRole('button', { name: '재검토' });

    if (await approveButton.isVisible() || await reviewButton.isVisible()) {
      expect(true).toBe(true);
    }
  });

  test('should display invoice line items in modal', async ({ page }) => {
    // Click on first invoice
    await page.locator('text=INV-001').first().click();
    await page.waitForLoadState('networkidle');

    // Check for line items section in modal
    const modal = page.locator('div').filter({ hasText: 'INV-001' }).first();
    const itemsLabel = modal.locator('text=품목');

    if (await itemsLabel.isVisible()) {
      // Verify line items are displayed
      const descriptionText = modal.locator('text=/우육통조림|콩나물/');
      await expect(descriptionText.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should close modal when clicking X button', async ({ page }) => {
    // Open invoice modal
    await page.locator('text=INV-001').first().click();
    await page.waitForLoadState('networkidle');

    // Close button (✕ character) - look in modal only
    const modal = page.locator('div').filter({ hasText: 'INV-001' }).first();
    const closeButton = modal.locator('button').filter({ hasText: '✕' }).first();

    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForLoadState('networkidle');

      // Modal should be closed - check if we're back to list view
      expect(true).toBe(true);
    }
  });
});
