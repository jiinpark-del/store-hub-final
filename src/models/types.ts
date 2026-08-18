// TypeScript type definitions for Sales API

export interface Sales {
  id: string;
  store_id: number;
  date: string; // YYYY-MM-DD
  total_revenue: number;
  cash_payment: number;
  card_payment: number;
  notes?: string;
  version: number;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSalesRequest {
  store_id: number;
  date: string;
  total_revenue: number;
  cash_payment: number;
  card_payment: number;
  notes?: string;
}

export interface UpdateSalesRequest {
  total_revenue: number;
  cash_payment: number;
  card_payment: number;
  version: number;
  notes?: string;
}

export interface AuditLogEntry {
  sales_id: string;
  action: 'CREATE' | 'UPDATE';
  old_values?: Record<string, unknown>;
  new_values: Record<string, unknown>;
  changed_by: number;
  change_reason?: string;
  client_ip?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export class ConflictError extends Error {
  constructor(message: string, public statusCode: number = 409) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public statusCode: number = 404) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
