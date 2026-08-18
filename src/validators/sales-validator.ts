import { z, ZodError } from 'zod';
import { CreateSalesRequest, UpdateSalesRequest, ValidationError } from '../models/types';

// Zod schemas for validation
const CreateSalesSchema = z.object({
  store_id: z.number().int().positive('store_id must be a positive integer'),
  date: z.string().refine(
    (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: 'date must be in YYYY-MM-DD format' }
  ),
  total_revenue: z.number().min(0, 'total_revenue must be >= 0'),
  cash_payment: z.number().min(0, 'cash_payment must be >= 0'),
  card_payment: z.number().min(0, 'card_payment must be >= 0'),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Validate that cash + card = total (with floating point tolerance)
    const sum = Math.round((data.cash_payment + data.card_payment) * 100) / 100;
    const total = Math.round(data.total_revenue * 100) / 100;
    return sum === total;
  },
  {
    message: 'cash_payment + card_payment must equal total_revenue',
    path: ['total_revenue'],
  }
);

const UpdateSalesSchema = z.object({
  total_revenue: z.number().min(0, 'total_revenue must be >= 0'),
  cash_payment: z.number().min(0, 'cash_payment must be >= 0'),
  card_payment: z.number().min(0, 'card_payment must be >= 0'),
  version: z.number().int().positive('version must be a positive integer'),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const sum = Math.round((data.cash_payment + data.card_payment) * 100) / 100;
    const total = Math.round(data.total_revenue * 100) / 100;
    return sum === total;
  },
  {
    message: 'cash_payment + card_payment must equal total_revenue',
    path: ['total_revenue'],
  }
);

// Validation functions
export function validateCreateSales(data: unknown): CreateSalesRequest {
  try {
    return CreateSalesSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.reduce(
        (acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );
      throw new ValidationError('Validation failed', details);
    }
    throw error;
  }
}

export function validateUpdateSales(data: unknown): UpdateSalesRequest {
  try {
    return UpdateSalesSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.reduce(
        (acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );
      throw new ValidationError('Validation failed', details);
    }
    throw error;
  }
}
