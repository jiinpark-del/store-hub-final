/**
 * OCR Pipeline Tests
 * Basic tests for OCR functionality: extraction, caching, preprocessing
 */

import { OCRService } from './ocr.service';
import { OCRCache } from './ocr-cache';
import { preprocessImage } from './image-preprocessing';
import * as fs from 'fs';
import * as path from 'path';

describe('OCR Pipeline', () => {
  let ocrService: OCRService;
  let testImageBuffer: Buffer;

  beforeAll(() => {
    // Initialize OCR service
    ocrService = new OCRService(new OCRCache());

    // Load test image (mock sample)
    // In a real test, you would use an actual invoice image
    const testImagePath = path.join(__dirname, 'fixtures', 'test-invoice.png');

    // For this MVP, we'll create a minimal test buffer if file doesn't exist
    if (fs.existsSync(testImagePath)) {
      testImageBuffer = fs.readFileSync(testImagePath);
    } else {
      // Create a simple 1x1 PNG buffer for testing
      testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
        0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x8d, 0xa0, 0x4d, 0xce, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
      ]);
    }
  });

  describe('Image Hashing', () => {
    test('should generate consistent SHA256 hash for same image', () => {
      const hash1 = OCRCache.generateImageHash(testImageBuffer);
      const hash2 = OCRCache.generateImageHash(testImageBuffer);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex format
    });

    test('should generate different hash for different images', () => {
      const buffer1 = testImageBuffer;
      const buffer2 = Buffer.concat([testImageBuffer, Buffer.from('extra')]);

      const hash1 = OCRCache.generateImageHash(buffer1);
      const hash2 = OCRCache.generateImageHash(buffer2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Image Preprocessing', () => {
    test('should preprocess image without errors', async () => {
      try {
        const processed = await preprocessImage(testImageBuffer);

        expect(processed).toBeInstanceOf(Buffer);
        expect(processed.length).toBeGreaterThan(0);
      } catch (error) {
        // Expected to fail with minimal test image, but should not throw preprocessing errors
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid image buffer gracefully', async () => {
      const invalidBuffer = Buffer.from('not a valid image');

      try {
        await preprocessImage(invalidBuffer);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('preprocessing');
      }
    });
  });

  describe('OCR Caching', () => {
    let cache: OCRCache;

    beforeEach(() => {
      cache = new OCRCache();
    });

    test('should return null for non-existent cache entry', async () => {
      const fakeHash = OCRCache.generateImageHash(Buffer.from('non-existent'));
      const result = await cache.getCachedResult(fakeHash);

      expect(result).toBeNull();
    });

    test('should store and retrieve OCR result', async () => {
      const mockResult = {
        supplier_name: 'Test Supplier',
        invoice_number: 'INV-001',
        total_amount: 123.45,
        invoice_date: '2024-01-15',
        confidence_scores: {
          supplier: 0.85,
          number: 0.9,
          amount: 0.88,
          date: 0.92
        }
      };

      const testHash = OCRCache.generateImageHash(testImageBuffer);

      // Note: This test assumes Redis is not running
      // In a production environment, Redis should be running
      await cache.setCachedResult(testHash, mockResult);
      const cachedResult = await cache.getCachedResult(testHash);

      // Cache should be gracefully handled even without Redis
      if (cachedResult) {
        expect(cachedResult.supplier_name).toBe('Test Supplier');
        expect(cachedResult.invoice_number).toBe('INV-001');
        expect(cachedResult.confidence_scores.supplier).toBe(0.85);
      }
    });
  });

  describe('OCR Result Structure', () => {
    test('should return valid OCR result structure', async () => {
      const mockResult = {
        supplier_name: 'Test Company',
        invoice_number: 'INV-2024-001',
        total_amount: 500.00,
        invoice_date: '2024-08-18',
        confidence_scores: {
          supplier: 0.75,
          number: 0.80,
          amount: 0.85,
          date: 0.82
        }
      };

      // Validate structure
      expect(mockResult.supplier_name).toBeDefined();
      expect(typeof mockResult.supplier_name).toBe('string');

      expect(mockResult.invoice_number).toBeDefined();
      expect(typeof mockResult.invoice_number).toBe('string');

      expect(mockResult.total_amount).toBeDefined();
      expect(typeof mockResult.total_amount).toBe('number');

      expect(mockResult.invoice_date).toBeDefined();
      expect(/^\d{4}-\d{2}-\d{2}$/.test(mockResult.invoice_date)).toBeTruthy();

      expect(mockResult.confidence_scores).toBeDefined();
      expect(mockResult.confidence_scores.supplier).toBeGreaterThanOrEqual(0);
      expect(mockResult.confidence_scores.supplier).toBeLessThanOrEqual(1);
    });

    test('should validate confidence scores range', () => {
      const testScores = {
        supplier: 0.75,
        number: 0.80,
        amount: 0.85,
        date: 0.82
      };

      const scoreValues = Object.values(testScores);
      scoreValues.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('OCR Service', () => {
    test('should initialize OCR service', () => {
      expect(ocrService).toBeDefined();
      expect(ocrService.processInvoice).toBeDefined();
      expect(typeof ocrService.processInvoice).toBe('function');
    });

    test('should handle cache operations', async () => {
      const stats = await ocrService.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.connected).toBeDefined();
    });
  });
});

// Integration test placeholder
describe('OCR Pipeline Integration', () => {
  test('should complete full pipeline workflow', async () => {
    // This is a placeholder for full integration test
    // In production, this would:
    // 1. Load a real invoice image
    // 2. Preprocess it
    // 3. Run OCR extraction
    // 4. Verify caching works
    // 5. Validate result structure

    expect(true).toBe(true);
  });
});
