import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';

interface MismatchItem {
  id: string;
  invoiceId: string;
  statementId: string;
  invoiceAmount: number;
  statementAmount: number;
  difference: number;
  date: string;
  status: 'pending' | 'resolved' | 'disputed';
  reason?: string;
}

export default function ReconciliationUI() {
  const [mismatches, setMismatches] = useState<MismatchItem[]>([
    {
      id: 'REC-001',
      invoiceId: 'INV-001',
      statementId: 'STMT-001',
      invoiceAmount: 5230,
      statementAmount: 5200,
      difference: 30,
      date: '2026-08-18',
      status: 'pending',
    },
    {
      id: 'REC-002',
      invoiceId: 'INV-002',
      statementId: 'STMT-002',
      invoiceAmount: 3450,
      statementAmount: 3450,
      difference: 0,
      date: '2026-08-17',
      status: 'resolved',
      reason: '수량 오류로 확인됨',
    },
    {
      id: 'REC-003',
      invoiceId: 'INV-004',
      statementId: 'STMT-003',
      invoiceAmount: 12000,
      statementAmount: 10000,
      difference: 2000,
      date: '2026-08-16',
      status: 'disputed',
    },
  ]);

  const [selectedMismatch, setSelectedMismatch] = useState<MismatchItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'disputed':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-bg-surface text-text-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return '해결됨';
      case 'pending':
        return '검토 중';
      case 'disputed':
        return '분쟁 중';
      default:
        return '알 수 없음';
    }
  };

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return 'text-success';
    if (Math.abs(difference) < 100) return 'text-warning';
    return 'text-danger';
  };

  const handleResolveMismatch = (resolution: string) => {
    if (!selectedMismatch) return;

    setIsProcessing(true);
    setTimeout(() => {
      setMismatches(
        mismatches.map((m) =>
          m.id === selectedMismatch.id
            ? { ...m, status: 'resolved' as const, reason: resolution }
            : m
        )
      );
      setSelectedMismatch(null);
      setIsProcessing(false);
    }, 800);
  };

  const pendingCount = mismatches.filter((m) => m.status === 'pending').length;
  const resolvedCount = mismatches.filter((m) => m.status === 'resolved').length;
  const disputedCount = mismatches.filter((m) => m.status === 'disputed').length;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-1">
          대조 관리
        </h1>
        <p className="text-sm text-text-muted">
          Statement vs Invoice 자동 매칭 및 불일치 해결
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border-color bg-bg-secondary p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              총 항목
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {mismatches.length}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-accent">
            {mismatches.length}
          </div>
        </div>

        <div className="rounded-lg border border-border-color bg-bg-secondary p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              검토 중
            </span>
            <span className="text-sm font-semibold text-warning">
              {pendingCount}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-warning">
            {pendingCount}
          </div>
        </div>

        <div className="rounded-lg border border-border-color bg-bg-secondary p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              분쟁 중
            </span>
            <span className="text-sm font-semibold text-danger">
              {disputedCount}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-danger">
            {disputedCount}
          </div>
        </div>
      </div>

      {/* Upload Statement Section */}
      <div className="rounded-lg border-2 border-dashed border-border-color bg-bg-secondary p-8">
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 text-text-muted mb-2" />
          <p className="text-sm font-semibold text-text-primary mb-1">
            Statement 파일 업로드
          </p>
          <p className="text-xs text-text-muted mb-4">
            CSV 또는 Excel 파일 (최대 10MB)
          </p>
          <label className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover cursor-pointer transition-colors">
            <input type="file" className="hidden" accept=".csv,.xlsx" />
            파일 선택
          </label>
        </div>
      </div>

      {/* Mismatch List */}
      <div className="rounded-lg border border-border-color bg-bg-primary shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color bg-bg-secondary">
          <h2 className="text-sm font-semibold text-text-primary">
            불일치 항목 ({mismatches.length})
          </h2>
        </div>

        <div className="divide-y divide-border-color">
          {mismatches.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm text-text-muted">모든 항목이 일치합니다!</p>
            </div>
          ) : (
            mismatches.map((mismatch, idx) => (
              <div
                key={mismatch.id}
                className={`px-6 py-4 hover:bg-bg-hover transition-colors cursor-pointer ${
                  idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-surface/50'
                }`}
                onClick={() => setSelectedMismatch(mismatch)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-text-primary text-sm">
                        {mismatch.id}
                      </span>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusColor(mismatch.status)}`}>
                        {getStatusLabel(mismatch.status)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {mismatch.invoiceId} vs {mismatch.statementId}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right min-w-max">
                      <div className="text-xs text-text-muted mb-1">불일치 금액</div>
                      <div className={`text-sm font-semibold font-tabular-nums ${getDifferenceColor(mismatch.difference)}`}>
                        {mismatch.difference === 0 ? '일치' : formatCurrency(Math.abs(mismatch.difference))}
                      </div>
                    </div>

                    <AlertCircle
                      className={`w-5 h-5 flex-shrink-0 ${
                        mismatch.difference === 0
                          ? 'text-success'
                          : 'text-warning'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>{formatCurrency(mismatch.invoiceAmount)}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{formatCurrency(mismatch.statementAmount)}</span>
                </div>

                {mismatch.reason && (
                  <div className="mt-2 text-xs text-text-secondary bg-bg-secondary/50 rounded px-2 py-1">
                    {mismatch.reason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mismatch Detail Modal */}
      {selectedMismatch && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-primary rounded-lg border border-border-color shadow-lg max-w-2xl w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-color bg-bg-secondary sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {selectedMismatch.id}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {selectedMismatch.invoiceId} vs {selectedMismatch.statementId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMismatch(null)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                  상태
                </div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusColor(selectedMismatch.status)}`}>
                  {getStatusLabel(selectedMismatch.status)}
                </span>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-bg-surface/50 border border-border-color p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                    Invoice
                  </div>
                  <div className="text-2xl font-extrabold text-text-primary font-tabular-nums mb-1">
                    {formatCurrency(selectedMismatch.invoiceAmount)}
                  </div>
                  <p className="text-xs text-text-secondary">ID: {selectedMismatch.invoiceId}</p>
                </div>

                <div className="rounded-md bg-bg-surface/50 border border-border-color p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                    Statement
                  </div>
                  <div className="text-2xl font-extrabold text-text-primary font-tabular-nums mb-1">
                    {formatCurrency(selectedMismatch.statementAmount)}
                  </div>
                  <p className="text-xs text-text-secondary">ID: {selectedMismatch.statementId}</p>
                </div>
              </div>

              {/* Difference */}
              <div className="rounded-md bg-warning/5 border border-warning/30 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                  불일치 금액
                </div>
                <div className={`text-2xl font-extrabold font-tabular-nums ${getDifferenceColor(selectedMismatch.difference)}`}>
                  {formatCurrency(Math.abs(selectedMismatch.difference))}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {selectedMismatch.difference > 0 ? '초과 청구' : '부족 청구'}
                </p>
              </div>

              {/* Date */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                  날짜
                </div>
                <p className="text-sm text-text-primary">{selectedMismatch.date}</p>
              </div>

              {/* Resolution Actions */}
              {selectedMismatch.status === 'pending' && (
                <div className="pt-4 border-t border-border-color space-y-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
                    해결 방안
                  </div>

                  <button
                    onClick={() => handleResolveMismatch('수량 오류 확인됨')}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    수량 오류로 확인됨
                  </button>

                  <button
                    onClick={() => handleResolveMismatch('배송료 미포함')}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-border-color bg-bg-primary px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-bg-hover disabled:opacity-60 transition-colors"
                  >
                    {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    배송료 미포함
                  </button>

                  <button
                    onClick={() => handleResolveMismatch('공급사 오류 - 추후 조정')}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-danger bg-danger/5 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60 transition-colors"
                  >
                    {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    분쟁 등록
                  </button>
                </div>
              )}

              {selectedMismatch.status === 'resolved' && selectedMismatch.reason && (
                <div className="rounded-md bg-success/5 border border-success/30 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                    해결 방안
                  </div>
                  <p className="text-sm text-text-primary">{selectedMismatch.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
