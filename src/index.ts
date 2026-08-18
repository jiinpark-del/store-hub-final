/**
 * Store Hub SalesForm - Main Exports
 */

// Components
export { SalesForm, default as SalesFormComponent } from './components/SalesForm';

// Hooks
export { useOfflineSync } from './hooks/useOfflineSync';
export type { OfflineSyncState, SyncStatus } from './hooks/useOfflineSync';

// Storage
export {
  addPendingSale,
  getPendingSales,
  deletePendingSale,
  markSaleSynced,
  clearAllPendingSales,
  getPendingSalesCount,
  closeDB,
} from './lib/sales-storage';
export type { Sale } from './lib/sales-storage';
