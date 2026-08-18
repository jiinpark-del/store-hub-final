/**
 * SalesForm Component
 * 일일 판매 데이터 입력 폼 (오프라인 지원)
 *
 * 기능:
 * - 날짜 입력 (기본값: 오늘)
 * - 총 매출, 현금, 카드 입력
 * - 실시간 유효성 검증
 * - 온라인/오프라인 상태 표시
 * - IndexedDB 오프라인 저장
 * - API 제출 및 동기화
 */

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addPendingSale } from '../lib/sales-storage';
import { useOfflineSync } from '../hooks/useOfflineSync';

// 입력값 검증 스키마
const SalesFormSchema = z.object({
  date: z.string().refine(
    (date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate <= today;
    },
    { message: '과거 또는 오늘 날짜만 입력 가능합니다' }
  ),
  total_revenue: z
    .number()
    .min(0, '총 매출은 0 이상이어야 합니다')
    .positive('총 매출을 입력하세요'),
  cash_payment: z
    .number()
    .min(0, '현금 결제는 0 이상이어야 합니다')
    .nonnegative(),
  card_payment: z
    .number()
    .min(0, '카드 결제는 0 이상이어야 합니다')
    .nonnegative(),
}).refine(
  (data) => {
    // cash + card = total 검증
    const sum = data.cash_payment + data.card_payment;
    return Math.abs(sum - data.total_revenue) < 0.01; // 부동소수점 오차 허용
  },
  {
    message: '현금 + 카드 = 총 매출이어야 합니다',
    path: ['card_payment'], // 에러 표시 위치
  }
);

type SalesFormInputs = z.infer<typeof SalesFormSchema>;

// Toast 메시지 타입
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

/**
 * SalesForm 컴포넌트
 */
export const SalesForm: React.FC = () => {
  const { isOffline, pendingCount, isSyncing, syncStatus, sync } = useOfflineSync();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<SalesFormInputs>({
    resolver: zodResolver(SalesFormSchema),
    defaultValues: {
      date: getTodayString(),
      total_revenue: 0,
      cash_payment: 0,
      card_payment: 0,
    },
  });

  // 날짜 선택 시 초기화
  useEffect(() => {
    if (!watch('date')) {
      setValue('date', getTodayString());
    }
  }, [setValue, watch]);

  // 총 매출 변경 시 카드 결제 자동 계산
  const total = watch('total_revenue') || 0;
  const cash = watch('cash_payment') || 0;
  const card = watch('card_payment') || 0;

  useEffect(() => {
    const calculatedCard = total - cash;
    if (calculatedCard >= 0 && Math.abs(calculatedCard - card) > 0.01) {
      setValue('card_payment', Math.max(0, calculatedCard));
    }
  }, [total, cash, setValue, card]);

  // Toast 메시지 표시
  const showToast = (type: Toast['type'], message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // 폼 제출 핸들러
  const onSubmit: SubmitHandler<SalesFormInputs> = async (data) => {
    setIsSubmitting(true);

    try {
      if (isOffline) {
        // 오프라인: IndexedDB에 저장
        await addPendingSale({
          date: data.date,
          total_revenue: data.total_revenue,
          cash_payment: data.cash_payment,
          card_payment: data.card_payment,
        });

        showToast('info', '오프라인 상태: 로컬에 저장되었습니다. 온라인 복구 시 자동 동기화됩니다.');
        reset();
      } else {
        // 온라인: 즉시 API 제출
        const response = await fetch('http://localhost:3000/api/v1/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': `form_${Date.now()}`,
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          showToast('success', '판매 데이터가 저장되었습니다.');
          reset();
        } else {
          const errorText = await response.text();
          showToast('error', `저장 실패: ${response.statusText} - ${errorText}`);
        }
      }
    } catch (error) {
      showToast('error', `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Sales Entry</h1>

        {/* 상태 표시 */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isOffline ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            {isOffline ? 'Offline' : 'Online'}
          </span>
        </div>
      </div>

      {/* 대기 중인 항목 표시 */}
      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            {pendingCount}개의 항목이 동기화 대기 중입니다.
            {!isSyncing && (
              <button
                onClick={() => sync()}
                className="ml-2 text-yellow-700 font-semibold hover:underline"
              >
                지금 동기화
              </button>
            )}
          </p>
          {isSyncing && <p className="text-sm text-yellow-700 mt-1">동기화 중...</p>}
        </div>
      )}

      {/* 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 날짜 입력 */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="date"
            type="date"
            {...register('date')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>

        {/* 총 매출 입력 */}
        <div>
          <label htmlFor="total_revenue" className="block text-sm font-medium text-gray-700 mb-1">
            Total Revenue
          </label>
          <input
            id="total_revenue"
            type="number"
            step="0.01"
            {...register('total_revenue', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.total_revenue ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.total_revenue && (
            <p className="text-red-500 text-xs mt-1">{errors.total_revenue.message}</p>
          )}
        </div>

        {/* 현금 결제 입력 */}
        <div>
          <label htmlFor="cash_payment" className="block text-sm font-medium text-gray-700 mb-1">
            Cash Payment
          </label>
          <input
            id="cash_payment"
            type="number"
            step="0.01"
            {...register('cash_payment', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cash_payment ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cash_payment && (
            <p className="text-red-500 text-xs mt-1">{errors.cash_payment.message}</p>
          )}
        </div>

        {/* 카드 결제 입력 (자동 계산) */}
        <div>
          <label htmlFor="card_payment" className="block text-sm font-medium text-gray-700 mb-1">
            Card Payment
            {total > 0 && cash >= 0 && (
              <span className="ml-2 text-green-600 text-xs font-normal">
                ✓ Auto-calculated
              </span>
            )}
          </label>
          <input
            id="card_payment"
            type="number"
            step="0.01"
            {...register('card_payment', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.card_payment ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.card_payment && (
            <p className="text-red-500 text-xs mt-1">{errors.card_payment.message}</p>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-white transition-colors ${
              isSubmitting || !isDirty
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Submit'}
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-2 px-4 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Toast 메시지 */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-lg animate-fade-in ${
              toast.type === 'success'
                ? 'bg-green-500'
                : toast.type === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* 스타일 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export default SalesForm;
