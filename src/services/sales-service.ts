import { v4 as uuidv4 } from 'uuid';
import pool, { transaction } from '../config/database';
import {
  Sales,
  CreateSalesRequest,
  UpdateSalesRequest,
  AuditLogEntry,
  ConflictError,
  NotFoundError,
} from '../models/types';

/**
 * Create a new sales record
 * POST /sales
 */
export async function createSales(
  data: CreateSalesRequest,
  userId: number
): Promise<Sales> {
  const id = uuidv4();
  const now = new Date().toISOString();

  return transaction(async (client) => {
    // Insert into sales table
    const insertQuery = `
      INSERT INTO sales (
        id, store_id, date, total_revenue, cash_payment, card_payment,
        notes, version, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      id,
      data.store_id,
      data.date,
      data.total_revenue,
      data.cash_payment,
      data.card_payment,
      data.notes || null,
      1, // version starts at 1
      userId,
      now,
      now,
    ]);

    const sales = result.rows[0] as Sales;

    // Log the creation
    const auditQuery = `
      INSERT INTO sales_audit_log (
        sales_id, action, new_values, changed_by, changed_at
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(auditQuery, [
      id,
      'CREATE',
      JSON.stringify({
        store_id: data.store_id,
        date: data.date,
        total_revenue: data.total_revenue,
        cash_payment: data.cash_payment,
        card_payment: data.card_payment,
        notes: data.notes,
      }),
      userId,
      now,
    ]);

    return sales;
  });
}

/**
 * Get a sales record by ID
 * GET /sales/{id}
 */
export async function getSales(id: string): Promise<Sales> {
  const query = `SELECT * FROM sales WHERE id = $1`;
  const result = await pool.query(query, [id]);

  if (result.rowCount === 0) {
    throw new NotFoundError(`Sales record with id ${id} not found`);
  }

  return result.rows[0] as Sales;
}

/**
 * Update a sales record with Optimistic Locking
 * PUT /sales/{id}
 *
 * Version check:
 * - If current version != provided version, return 409 Conflict
 * - If version matches, update and increment version
 */
export async function updateSales(
  id: string,
  data: UpdateSalesRequest,
  userId: number
): Promise<Sales> {
  const now = new Date().toISOString();

  return transaction(async (client) => {
    // First, fetch the current record to check version
    const fetchQuery = `SELECT * FROM sales WHERE id = $1 FOR UPDATE`;
    const currentResult = await client.query(fetchQuery, [id]);

    if (currentResult.rowCount === 0) {
      throw new NotFoundError(`Sales record with id ${id} not found`);
    }

    const current = currentResult.rows[0] as Sales;

    // Check version - Optimistic Locking
    if (current.version !== data.version) {
      throw new ConflictError(
        `Version conflict: expected ${current.version}, got ${data.version}`
      );
    }

    // Prepare old values for audit log
    const oldValues = {
      total_revenue: current.total_revenue,
      cash_payment: current.cash_payment,
      card_payment: current.card_payment,
    };

    // Update the record
    const updateQuery = `
      UPDATE sales
      SET
        total_revenue = $1,
        cash_payment = $2,
        card_payment = $3,
        version = version + 1,
        updated_by = $4,
        updated_at = $5
      WHERE id = $6
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      data.total_revenue,
      data.cash_payment,
      data.card_payment,
      userId,
      now,
      id,
    ]);

    const updated = result.rows[0] as Sales;

    // Log the update
    const auditQuery = `
      INSERT INTO sales_audit_log (
        sales_id, action, old_values, new_values, changed_by, changed_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await client.query(auditQuery, [
      id,
      'UPDATE',
      JSON.stringify(oldValues),
      JSON.stringify({
        total_revenue: data.total_revenue,
        cash_payment: data.cash_payment,
        card_payment: data.card_payment,
      }),
      userId,
      now,
    ]);

    return updated;
  });
}

/**
 * Get audit log for a sales record
 */
export async function getSalesAuditLog(id: string): Promise<AuditLogEntry[]> {
  const query = `
    SELECT sales_id, action, old_values, new_values, changed_by, changed_at
    FROM sales_audit_log
    WHERE sales_id = $1
    ORDER BY changed_at DESC
  `;

  const result = await pool.query(query, [id]);
  return result.rows as AuditLogEntry[];
}
