import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Eye, Download, Loader } from 'lucide-react';

interface OCRResult {
  invoiceId: string;
  vendorName: string;
  amount: number;
  date: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  confidence: number;
  status: 'pending' | 'completed' | 'rejected';
}

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<OCRResult[]>([
    {
      invoiceId: 'INV-001',
      vendorName: '신문식품',
      amount: 5230,
      date: '2026-08-18',
      lineItems: [
        { description: '우육통조림', quantity: 10, unitPrice: 450 },
        { description: '콩나물', quantity: 5, unitPrice: 106 },
      ],
      confidence: 0.95,
      status: 'completed',
    },
    {
      invoiceId: 'INV-002',
      vendorName: '한솔식품',
      amount: 3450,
      date: '2026-08-17',
      lineItems: [
        { description: '김', quantity: 20, unitPrice: 150 },
      ],
      confidence: 0.87,
      status: 'completed',
    },
    {
      invoiceId: 'INV-003',
      vendorName: '대서양식품',
      amount: 0,
      date: '2026-08-17',
      lineItems: [],
      confidence: 0,
      status: 'pending',
    },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState<OCRResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Add mock invoice
          const newInvoice: OCRResult = {
            invoiceId: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
            vendorName: '새 공급사',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            lineItems: [],
            confidence: 0,
            status: 'pending',
          };
          setInvoices([newInvoice, ...invoices]);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 300);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'rejected':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-bg-surface text-text-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'pending':
        return '처리 중';
      case 'rejected':
        return '거부됨';
      default:
        return '알 수 없음';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-success';
    if (confidence >= 0.8) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-1">
          송장 관리
        </h1>
        <p className="text-sm text-text-muted">
          인보이스 OCR 인식 및 검증
        </p>
      </div>

      {/* Upload Section */}
      <div className="rounded-lg border-2 border-dashed border-border-color bg-bg-secondary p-8">
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 text-text-muted mb-2" />
          <p className="text-sm font-semibold text-text-primary mb-1">
            인보이스 이미지 업로드
          </p>
          <p className="text-xs text-text-muted mb-4">
            PNG, JPG 또는 PDF 파일 (최대 10MB)
          </p>
          <label className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover cursor-pointer transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              className="hidden"
            />
            파일 선택
          </label>

          {isUploading && (
            <div className="mt-4 w-full max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Loader className="w-4 h-4 text-accent animate-spin" />
                <span className="text-xs text-text-secondary">처리 중...</span>
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice List */}
      <div className="rounded-lg border border-border-color bg-bg-primary shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color bg-bg-secondary">
          <h2 className="text-sm font-semibold text-text-primary">
            인식된 송장 ({invoices.length})
          </h2>
        </div>

        <div className="divide-y divide-border-color">
          {invoices.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-text-muted">업로드된 송장이 없습니다</p>
            </div>
          ) : (
            invoices.map((invoice, idx) => (
              <div
                key={invoice.invoiceId}
                className={`px-6 py-4 hover:bg-bg-hover transition-colors cursor-pointer ${
                  idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-surface/50'
                }`}
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-text-primary text-sm truncate">
                          {invoice.invoiceId}
                        </span>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        {invoice.vendorName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    {invoice.status === 'completed' && (
                      <div className="text-right min-w-max">
                        <div className="text-sm font-semibold text-text-primary font-tabular-nums">
                          {formatCurrency(invoice.amount).replace('₩', '')}
                        </div>
                        <div className={`text-xs font-medium ${getConfidenceColor(invoice.confidence)}`}>
                          신뢰도 {Math.round(invoice.confidence * 100)}%
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                        }}
                        className="p-2 rounded-md hover:bg-bg-secondary transition-colors"
                        title="상세 보기"
                      >
                        <Eye className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        className="p-2 rounded-md hover:bg-bg-secondary transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4 text-text-secondary" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-text-muted">
                  {invoice.date}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-primary rounded-lg border border-border-color shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-color bg-bg-secondary sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {selectedInvoice.invoiceId}
                  </h2>
                  <p className="text-xs text-text-muted">{selectedInvoice.vendorName}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status & Confidence */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                    상태
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusLabel(selectedInvoice.status)}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                    신뢰도
                  </div>
                  <div className={`text-sm font-semibold ${getConfidenceColor(selectedInvoice.confidence)}`}>
                    {Math.round(selectedInvoice.confidence * 100)}%
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                  총 금액
                </div>
                <div className="text-2xl font-extrabold text-text-primary font-tabular-nums">
                  {formatCurrency(selectedInvoice.amount)}
                </div>
              </div>

              {/* Line Items */}
              {selectedInvoice.lineItems.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
                    품목
                  </div>
                  <div className="space-y-2">
                    {selectedInvoice.lineItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 rounded-md bg-bg-surface/50 border border-border-color"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {item.description}
                          </p>
                          <p className="text-xs text-text-muted">
                            {item.quantity}개 × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-text-primary font-tabular-nums">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                  날짜
                </div>
                <p className="text-sm text-text-primary">{selectedInvoice.date}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border-color">
                <button className="flex-1 flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  승인
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 rounded-md border border-border-color bg-bg-primary px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors">
                  <AlertCircle className="w-4 h-4" />
                  재검토
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
