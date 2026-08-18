import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertCircle } from 'lucide-react';

interface KPIData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  trend: 'up' | 'down';
  trendPercent: number;
}

interface StorePerformance {
  storeId: number;
  storeName: string;
  revenue: number;
  transactions: number;
  lastUpdate: string;
  status: 'active' | 'inactive' | 'alert';
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData>({
    totalRevenue: 45230,
    totalTransactions: 1283,
    averageTransaction: 35.25,
    trend: 'up',
    trendPercent: 12.5,
  });

  const [storePerformance, setStorePerformance] = useState<StorePerformance[]>([
    {
      storeId: 1,
      storeName: '신론점',
      revenue: 15240,
      transactions: 432,
      lastUpdate: '2026-08-18 14:32',
      status: 'active',
    },
    {
      storeId: 2,
      storeName: '강남점',
      revenue: 12890,
      transactions: 387,
      lastUpdate: '2026-08-18 14:28',
      status: 'active',
    },
    {
      storeId: 3,
      storeName: '명동점',
      revenue: 11450,
      transactions: 298,
      lastUpdate: '2026-08-18 13:15',
      status: 'alert',
    },
    {
      storeId: 4,
      storeName: '부산점',
      revenue: 3650,
      transactions: 128,
      lastUpdate: '2026-08-18 12:45',
      status: 'inactive',
    },
    {
      storeId: 5,
      storeName: '대구점',
      revenue: 2000,
      transactions: 38,
      lastUpdate: '2026-08-17 18:20',
      status: 'inactive',
    },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'alert':
        return 'bg-warning/10 text-warning';
      case 'inactive':
        return 'bg-neutral/10 text-neutral';
      default:
        return 'bg-bg-surface text-text-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '정상';
      case 'alert':
        return '주의';
      case 'inactive':
        return '비활성';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-1">
          판매 대시보드
        </h1>
        <p className="text-sm text-text-muted">
          실시간 판매 현황 및 지점별 성과
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="rounded-lg border border-border-color bg-bg-secondary p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              총 판매액
            </div>
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
          <div className="mb-2">
            <div className="text-[27px] font-extrabold tracking-tight text-accent font-tabular-nums">
              {formatCurrency(kpis.totalRevenue).replace('₩', '')}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {kpis.trend === 'up' ? (
              <>
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-success font-semibold">+{kpis.trendPercent}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-danger" />
                <span className="text-danger font-semibold">-{kpis.trendPercent}%</span>
              </>
            )}
            <span className="text-text-muted">지난주 대비</span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="rounded-lg border border-border-color bg-bg-secondary p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              총 거래
            </div>
            <ShoppingCart className="w-5 h-5 text-accent" />
          </div>
          <div className="mb-2">
            <div className="text-[27px] font-extrabold tracking-tight text-accent font-tabular-nums">
              {kpis.totalTransactions.toLocaleString('ko-KR')}
            </div>
          </div>
          <div className="text-xs text-text-muted">
            거래 건수
          </div>
        </div>

        {/* Average Transaction */}
        <div className="rounded-lg border border-border-color bg-bg-secondary p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              평균 거래액
            </div>
            <DollarSign className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="mb-2">
            <div className="text-[27px] font-extrabold tracking-tight text-text-primary font-tabular-nums">
              ₩{kpis.averageTransaction.toLocaleString('ko-KR')}
            </div>
          </div>
          <div className="text-xs text-text-muted">
            1건당 평균
          </div>
        </div>
      </div>

      {/* Store Performance Table */}
      <div className="rounded-lg border border-border-color bg-bg-primary shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color bg-bg-secondary">
          <h2 className="text-sm font-semibold text-text-primary">지점별 판매 현황</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color bg-bg-secondary">
                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  지점명
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  판매액
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  거래수
                </th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  마지막 업데이트
                </th>
              </tr>
            </thead>
            <tbody>
              {storePerformance.map((store, idx) => (
                <tr
                  key={store.storeId}
                  className={`border-b border-border-color hover:bg-bg-hover transition-colors ${
                    idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-surface/50'
                  }`}
                >
                  <td className="px-6 py-3 font-medium text-text-primary">
                    {store.storeName}
                  </td>
                  <td className="px-6 py-3 text-right text-text-primary font-tabular-nums">
                    {formatCurrency(store.revenue).replace('₩', '')}
                  </td>
                  <td className="px-6 py-3 text-right text-text-primary font-tabular-nums">
                    {store.transactions}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusColor(store.status)}`}>
                      {getStatusLabel(store.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-text-muted text-xs">
                    {store.lastUpdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="rounded-lg border border-border-color bg-bg-primary p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">지점별 매출 비율</h3>
          <p className="text-xs text-text-muted">상위 5개 지점의 판매액 분포</p>
        </div>
        <div className="space-y-3">
          {storePerformance.map((store) => {
            const percentage = (store.revenue / kpis.totalRevenue) * 100;
            return (
              <div key={store.storeId}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-text-primary">{store.storeName}</span>
                  <span className="text-xs font-semibold text-text-muted font-tabular-nums">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Section */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-text-primary mb-1">주의 필요</p>
          <p className="text-xs text-text-secondary">
            명동점에서 거래량이 감소했습니다. 재고 현황을 확인해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
