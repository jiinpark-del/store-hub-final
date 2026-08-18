/**
 * Custom Hook: 오프라인 감지 + 자동 동기화
 * 네트워크 복구 시 IndexedDB의 대기 중인 sales를 서버에 전송
 */

import { useState, useEffect, useCallback } from 'react';
import { getPendingSales, getPendingSalesCount, markSaleSynced, deletePendingSale } from '../lib/sales-storage';
import type { Sale } from '../lib/sales-storage';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface OfflineSyncState {
  isOffline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  sync: () => Promise<void>;
  error?: string;
}

const DEFAULT_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

/**
 * 단일 sale을 서버에 제출
 */
async function submitSaleToAPI(sale: Sale, retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${DEFAULT_API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': sale.id,
        },
        body: JSON.stringify({
          date: sale.date,
          total_revenue: sale.total_revenue,
          cash_payment: sale.cash_payment,
          card_payment: sale.card_payment,
        }),
      });

      if (response.ok) {
        return true;
      }

      // 4xx 에러는 재시도하지 않음
      if (response.status >= 400 && response.status < 500) {
        console.error(`API Error (${response.status}):`, await response.text());
        return false;
      }

      // 5xx는 재시도
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      console.error('API submission error:', error);
      return false;
    }
  }

  return false;
}

/**
 * useOfflineSync Hook
 */
export function useOfflineSync(): OfflineSyncState {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string>();

  // 네트워크 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus('idle');
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 대기 중인 sales 개수 업데이트
  useEffect(() => {
    let isMounted = true;

    const updateCount = async () => {
      const count = await getPendingSalesCount();
      if (isMounted) {
        setPendingCount(count);
      }
    };

    updateCount();

    return () => {
      isMounted = false;
    };
  }, []);

  // 동기화 함수
  const sync = useCallback(async () => {
    if (isSyncing || isOffline) return;

    setIsSyncing(true);
    setSyncStatus('syncing');
    setError(undefined);

    try {
      const pendingSales = await getPendingSales();

      if (pendingSales.length === 0) {
        setSyncStatus('success');
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      // 각 대기 중인 sale 제출
      for (const sale of pendingSales) {
        const success = await submitSaleToAPI(sale);

        if (success) {
          await markSaleSynced(sale.id);
          successCount++;
        } else {
          failureCount++;
        }

        // UI 반응성을 위해 약간의 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 결과 처리
      if (failureCount > 0) {
        setSyncStatus('error');
        setError(`${successCount}개 동기화됨, ${failureCount}개 실패`);
      } else {
        setSyncStatus('success');
        setPendingCount(0);
      }
    } catch (err) {
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : '동기화 실패');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOffline]);

  // 온라인 복구 시 자동 동기화
  useEffect(() => {
    if (!isOffline && pendingCount > 0 && !isSyncing) {
      // 짧은 딜레이 후 자동 동기화
      const timer = setTimeout(() => {
        sync();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, pendingCount, isSyncing, sync]);

  return {
    isOffline,
    pendingCount,
    isSyncing,
    syncStatus,
    sync,
    error,
  };
}
