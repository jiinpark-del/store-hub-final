/**
 * IndexedDB 저장소 - 오프라인 Sales 데이터 관리
 * DB: "store-hub" | Store: "pending_sales"
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  total_revenue: number;
  cash_payment: number;
  card_payment: number;
  status: 'pending' | 'synced';
  createdAt: number; // timestamp
  syncedAt?: number; // timestamp
}

interface StoreHubDB extends DBSchema {
  pending_sales: {
    key: string;
    value: Sale;
    indexes: {
      by_status: string;
      by_created: number;
    };
  };
}

let db: IDBPDatabase<StoreHubDB> | null = null;

/**
 * IndexedDB 초기화
 */
async function getDB(): Promise<IDBPDatabase<StoreHubDB>> {
  if (db) return db;

  db = await openDB<StoreHubDB>('store-hub', 1, {
    upgrade(db) {
      // pending_sales 스토어 생성
      if (!db.objectStoreNames.contains('pending_sales')) {
        const store = db.createObjectStore('pending_sales', { keyPath: 'id' });
        store.createIndex('by_status', 'status');
        store.createIndex('by_created', 'createdAt');
      }
    },
  });

  return db;
}

/**
 * 대기 중인 sales 항목 추가
 */
export async function addPendingSale(data: Omit<Sale, 'id' | 'status' | 'createdAt' | 'syncedAt'>): Promise<Sale> {
  const database = await getDB();

  const sale: Sale = {
    ...data,
    id: `sale_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    status: 'pending',
    createdAt: Date.now(),
  };

  await database.add('pending_sales', sale);
  return sale;
}

/**
 * 모든 대기 중인 sales 조회
 */
export async function getPendingSales(): Promise<Sale[]> {
  const database = await getDB();
  return database.getAllFromIndex('pending_sales', 'by_status', 'pending');
}

/**
 * 특정 sale 삭제 (동기화 후)
 */
export async function deletePendingSale(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('pending_sales', id);
}

/**
 * Sale 상태 업데이트 (pending → synced)
 */
export async function markSaleSynced(id: string): Promise<void> {
  const database = await getDB();
  const sale = await database.get('pending_sales', id);

  if (sale) {
    sale.status = 'synced';
    sale.syncedAt = Date.now();
    await database.put('pending_sales', sale);
  }
}

/**
 * 전체 대기 중인 sales 삭제 (위험: 신중하게 사용)
 */
export async function clearAllPendingSales(): Promise<void> {
  const database = await getDB();
  const sales = await getPendingSales();

  for (const sale of sales) {
    await database.delete('pending_sales', sale.id);
  }
}

/**
 * 대기 중인 sales 개수
 */
export async function getPendingSalesCount(): Promise<number> {
  const database = await getDB();
  const sales = await getPendingSales();
  return sales.length;
}

/**
 * DB 연결 종료 (테스트 용)
 */
export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}
