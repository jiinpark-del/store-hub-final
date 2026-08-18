/**
 * Mock In-Memory Database for Development
 * Stores data in memory - no persistence
 */

interface QueryResult {
  rows: unknown[];
  rowCount: number;
}

const tables: Record<string, Record<string, unknown>> = {
  sales: {},
  sales_audit_log: {},
  stores: {
    '1': {
      id: 1,
      name: 'Main Store',
      region: 'Seoul',
      phone: '02-1234-5678',
      address: '123 Main St',
      created_at: new Date(),
      updated_at: new Date(),
    },
  },
  users: {
    '1': {
      id: 1,
      email: 'manager@store.com',
      password_hash: 'hashed_password',
      full_name: 'Store Manager',
      role: 'manager',
      store_id: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  },
  suppliers: {},
  invoices: {},
  invoice_ocr_results: {},
  statements: {},
  reconciliation_results: {},
  idempotency_keys: {},
};

let rowIdCounter = {
  sales: 0,
  sales_audit_log: 0,
  invoices: 0,
};

export const mockDatabase = {
  async query(text: string, params?: unknown[]): Promise<QueryResult> {
    console.log(`[MOCK DB] ${text}`, params);

    // Simple mock: just return empty results for most queries
    // In real scenario, would parse SQL and execute against in-memory tables

    if (text.includes('INSERT INTO sales')) {
      const id = `sales_${++rowIdCounter.sales}`;
      const now = new Date();
      const row = {
        id,
        store_id: params?.[0],
        date: params?.[1],
        total_revenue: params?.[2],
        cash_payment: params?.[3],
        card_payment: params?.[4],
        version: 1,
        created_by: params?.[5] || 1,
        updated_by: null,
        created_at: now,
        updated_at: now,
      };
      tables.sales[id] = row;
      return { rows: [row], rowCount: 1 };
    }

    if (text.includes('SELECT') && text.includes('FROM sales')) {
      if (text.includes('WHERE id =')) {
        const id = params?.[0];
        const row = tables.sales[id as string];
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }
      return { rows: Object.values(tables.sales), rowCount: Object.keys(tables.sales).length };
    }

    if (text.includes('UPDATE sales')) {
      const id = params?.[params.length - 1];
      const row = tables.sales[id as string];
      if (row) {
        Object.assign(row, {
          total_revenue: params?.[0],
          cash_payment: params?.[1],
          card_payment: params?.[2],
          version: (row as any).version + 1,
          updated_at: new Date(),
        });
        return { rows: [row], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (text.includes('INSERT INTO sales_audit_log')) {
      const now = new Date();
      const row = {
        id: ++rowIdCounter.sales_audit_log,
        sales_id: params?.[0],
        action: params?.[1],
        changed_by: params?.[2],
        old_values: params?.[3],
        new_values: params?.[4],
        change_reason: params?.[5],
        client_ip: params?.[6],
        changed_at: now,
      };
      tables.sales_audit_log[row.id] = row;
      return { rows: [row], rowCount: 1 };
    }

    // Default response
    return { rows: [], rowCount: 0 };
  },

  async transaction<T>(callback: (client: MockClient) => Promise<T>): Promise<T> {
    const client = new MockClient();
    try {
      const result = await callback(client);
      return result;
    } catch (error) {
      throw error;
    }
  },
};

class MockClient {
  async query(text: string, params?: unknown[]): Promise<QueryResult> {
    return mockDatabase.query(text, params);
  }

  async release(): Promise<void> {
    // No-op for mock
  }
}

export default mockDatabase;
