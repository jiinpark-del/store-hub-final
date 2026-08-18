import { Pool, PoolClient } from 'pg';
import mockDatabase from './mock-database';

// PostgreSQL connection pool
let pool: Pool | null = null;
let useMockDb = false;

try {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'store_hub',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    if (process.env.NODE_ENV === 'production') {
      process.exit(-1);
    }
  });

  // Test connection
  pool.query('SELECT NOW()').catch((err) => {
    console.warn('PostgreSQL not available, using Mock Database:', err.message);
    useMockDb = true;
  });
} catch (error) {
  console.warn('Failed to initialize PostgreSQL, using Mock Database');
  useMockDb = true;
}

// Use mock if real DB unavailable
if (useMockDb) {
  console.log('🔄 Using Mock In-Memory Database for development');
}

export default pool;

// Helper function to execute queries
export async function query(
  text: string,
  params?: unknown[]
): Promise<{ rows: unknown[]; rowCount: number }> {
  const start = Date.now();
  try {
    // Use mock if real DB unavailable
    if (useMockDb) {
      return await mockDatabase.query(text, params);
    }

    if (!pool) throw new Error('Database pool not initialized');
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return { rows: result.rows, rowCount: result.rowCount || 0 };
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to mock on error in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Query failed, trying mock database...');
      useMockDb = true;
      return await mockDatabase.query(text, params);
    }
    throw error;
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: PoolClient | any) => Promise<T>
): Promise<T> {
  if (useMockDb) {
    return await mockDatabase.transaction(callback);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
