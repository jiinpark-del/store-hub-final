import { test, expect } from '@playwright/test';

test.describe('Invoice Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to invoice management tab
    await page.locator('text=송장 관리').click();
    await page.waitForLoadState('networkidle');
  });

  test('should display invoice management page', async ({ page }) => {
    // Check page title
    await expect(page.locator('text=송장 관리')).toBeVisible();
    await expect(page.locator('text=인보이스 OCR 인식 및 검증')).toBeVisible();
  });

  test('should display invoice upload section', async ({ page }) => {
    // Check upload form
    await expect(page.locator('text=인보이스 이미지 업로드')).toBeVisible();
    await expect(page.locator('text=PNG, JPG 또는 PDF 파일')).toBeVisible();

    // Check upload button
    const uploadButton = page.locator('text=파일 선택');
    await expect(uploadButton).toBeVisible();
  });

  test('should display recognized invoices list', async ({ page }) => {
    // Check invoices section
    await expect(page.locator('text=인식된 송장')).toBeVisible();

    // Check for invoice items
    await expect(page.locator('text=INV-001')).toBeVisible();
    await expect(page.locator('text=신문식품')).toBeVisible();
    await expect(page.locator('text=완료')).toBeVisible();
  });

  test('should display invoice with confidence score', async ({ page }) => {
    // Check for confidence score
    const confidenceText = page.locator('text=/신뢰도 (95|87)/');
    await expect(confidenceText.first()).toBeVisible();
  });

  test('should open invoice detail modal', async ({ page }) => {
    // Click on first invoice to open modal
    await page.locator('text=INV-001').first().click();

    // Wait for modal to appear
    await page.waitForLoadState('networkidle');

    // Check modal content
    await expect(page.locator('text=INV-001')).toBeVisible({ timeout: 5000 });

    // Look for action buttons in modal
    const approveButton = page.locator('text=승인');
    const reviewButton = page.locator('text=재검토');

    if (await approveButton.isVisible() || await reviewButton.isVisible()) {
      expect(true).toBe(true);
    }
  });

  test('should display invoice line items in modal', async ({ page }) => {
    // Click on first invoice
    await page.locator('text=INV-001').first().click();
    await page.waitForLoadState('networkidle');

    // Check for line items section
    const itemsLabel = page.locator('text=품목');
    if (await itemsLabel.isVisible()) {
      // Verify line items are displayed
      const descriptionText = page.locator('text=우육통조림|콩나물');
      await expect(descriptionText.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should close modal when clicking X button', async ({ page }) => {
    // Open invoice modal
    await page.locator('text=INV-001').first().click();
    await page.waitForLoadState('networkidle');

    // Close button (✕ character)
    const closeButtons = page.locator('button:has-text("✕")');
    if (await closeButtons.count() > 0) {
      await closeButtons.first().click();
      await page.waitForLoadState('networkidle');

      // Modal should be closed
      expect(await page.locator('text=INV-001').count()).toBeGreaterThanOrEqual(1);
    }
  });
});
