import { Router, Request, Response, NextFunction } from 'express';
import * as salesService from '../services/sales-service';
import { validateCreateSales, validateUpdateSales } from '../validators/sales-validator';
import { ApiResponse, ConflictError, NotFoundError, ValidationError } from '../models/types';

const router = Router();

/**
 * POST /sales
 * Create a new sales record
 */
router.post('/sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = validateCreateSales(req.body);
    const userId = req.headers['x-user-id'] as string || '1'; // Mock user ID from header

    const sales = await salesService.createSales(validatedData, parseInt(userId, 10));

    const response: ApiResponse<typeof sales> = {
      success: true,
      data: sales,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /sales/:id
 * Get a sales record by ID
 */
router.get('/sales/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sales = await salesService.getSales(id);

    const response: ApiResponse<typeof sales> = {
      success: true,
      data: sales,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /sales/:id
 * Update a sales record (Optimistic Locking)
 */
router.put('/sales/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = validateUpdateSales(req.body);
    const userId = req.headers['x-user-id'] as string || '1';

    const updated = await salesService.updateSales(
      id,
      validatedData,
      parseInt(userId, 10)
    );

    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Error handling middleware
 */
router.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  if (error instanceof ValidationError) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details,
      },
      meta: { timestamp: new Date().toISOString(), version: '1.0.0' },
    };
    return res.status(error.statusCode).json(response);
  }

  if (error instanceof ConflictError) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'CONFLICT_ERROR',
        message: error.message,
      },
      meta: { timestamp: new Date().toISOString(), version: '1.0.0' },
    };
    return res.status(error.statusCode).json(response);
  }

  if (error instanceof NotFoundError) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
      meta: { timestamp: new Date().toISOString(), version: '1.0.0' },
    };
    return res.status(error.statusCode).json(response);
  }

  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    meta: { timestamp: new Date().toISOString(), version: '1.0.0' },
  };
  res.status(500).json(response);
});

export default router;
