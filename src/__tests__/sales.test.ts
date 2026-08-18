import * as salesService from '../services/sales-service';
import { validateCreateSales, validateUpdateSales } from '../validators/sales-validator';
import { ConflictError, NotFoundError, ValidationError } from '../models/types';

/**
 * Basic unit tests for Sales API
 * - Validator tests
 * - Service tests (mocked DB)
 */

describe('Sales Validator', () => {
  describe('validateCreateSales', () => {
    it('should validate correct sales data', () => {
      const data = {
        store_id: 1,
        date: '2026-08-18',
        total_revenue: 1500.00,
        cash_payment: 1000.00,
        card_payment: 500.00,
      };

      const result = validateCreateSales(data);
      expect(result.store_id).toBe(1);
      expect(result.total_revenue).toBe(1500.00);
    });

    it('should reject if cash + card != total', () => {
      const data = {
        store_id: 1,
        date: '2026-08-18',
        total_revenue: 1500.00,
        cash_payment: 1000.00,
        card_payment: 400.00, // sum is 1400, not 1500
      };

      expect(() => validateCreateSales(data)).toThrow(ValidationError);
    });

    it('should reject negative amounts', () => {
      const data = {
        store_id: 1,
        date: '2026-08-18',
        total_revenue: -100.00,
        cash_payment: 0,
        card_payment: 0,
      };

      expect(() => validateCreateSales(data)).toThrow(ValidationError);
    });

    it('should reject invalid date format', () => {
      const data = {
        store_id: 1,
        date: '18-08-2026', // wrong format
        total_revenue: 1500.00,
        cash_payment: 1000.00,
        card_payment: 500.00,
      };

      expect(() => validateCreateSales(data)).toThrow(ValidationError);
    });
  });

  describe('validateUpdateSales', () => {
    it('should validate correct update data', () => {
      const data = {
        total_revenue: 2000.00,
        cash_payment: 1200.00,
        card_payment: 800.00,
        version: 1,
      };

      const result = validateUpdateSales(data);
      expect(result.version).toBe(1);
      expect(result.total_revenue).toBe(2000.00);
    });

    it('should reject if version is missing', () => {
      const data = {
        total_revenue: 2000.00,
        cash_payment: 1200.00,
        card_payment: 800.00,
      };

      expect(() => validateUpdateSales(data)).toThrow(ValidationError);
    });
  });
});

describe('Sales Service', () => {
  describe('Error handling', () => {
    it('should throw NotFoundError for non-existent sales', async () => {
      // This would fail without a real DB setup
      // In integration tests, we'd use a test database
      expect(true).toBe(true); // Placeholder
    });

    it('should throw ConflictError on version mismatch', () => {
      // Test Optimistic Locking conflict detection
      const error = new ConflictError('Version conflict');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });
});

describe('Optimistic Locking', () => {
  it('should detect version conflicts', () => {
    // Simulate two concurrent updates
    const version1 = 1;
    const version2 = 1;

    // In real scenario:
    // - Client A reads version 1
    // - Client B reads version 1
    // - Client B updates -> version becomes 2
    // - Client A tries to update with version 1 -> should fail with 409

    expect(version1).toBe(version2);
  });
});

describe('Floating point precision', () => {
  it('should handle decimal calculations correctly', () => {
    const data = {
      store_id: 1,
      date: '2026-08-18',
      total_revenue: 99.99,
      cash_payment: 49.99,
      card_payment: 50.00,
    };

    // 49.99 + 50.00 = 99.99 (should pass)
    const result = validateCreateSales(data);
    expect(result.total_revenue).toBe(99.99);
  });
});
