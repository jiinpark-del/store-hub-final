/**
 * SalesForm Component - 기본 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalesForm } from './SalesForm';
import * as SalesStorage from '../lib/sales-storage';
import { useOfflineSync } from '../hooks/useOfflineSync';

// Mock 설정
jest.mock('../lib/sales-storage');
jest.mock('../hooks/useOfflineSync');

const mockAddPendingSale = SalesStorage.addPendingSale as jest.MockedFunction<typeof SalesStorage.addPendingSale>;
const mockUseOfflineSync = useOfflineSync as jest.MockedFunction<typeof useOfflineSync>;

// 기본 Mock 반환값
const defaultOfflineSyncMock = {
  isOffline: false,
  pendingCount: 0,
  isSyncing: false,
  syncStatus: 'idle' as const,
  sync: jest.fn(),
  error: undefined,
};

// Mock fetch
global.fetch = jest.fn();

describe('SalesForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOfflineSync.mockReturnValue(defaultOfflineSyncMock);
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 테스트 1: 폼 렌더링
  test('폼이 올바르게 렌더링된다', () => {
    render(<SalesForm />);

    expect(screen.getByText('Daily Sales Entry')).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Revenue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cash Payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Card Payment/i)).toBeInTheDocument();
  });

  // 테스트 2: 온라인 상태 표시
  test('온라인 상태가 표시된다', () => {
    mockUseOfflineSync.mockReturnValue({
      ...defaultOfflineSyncMock,
      isOffline: false,
    });

    render(<SalesForm />);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  // 테스트 3: 오프라인 상태 표시
  test('오프라인 상태가 표시된다', () => {
    mockUseOfflineSync.mockReturnValue({
      ...defaultOfflineSyncMock,
      isOffline: true,
    });

    render(<SalesForm />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  // 테스트 4: 입력값 변경
  test('입력값이 변경될 수 있다', async () => {
    render(<SalesForm />);

    const totalInput = screen.getByLabelText(/Total Revenue/i) as HTMLInputElement;
    const cashInput = screen.getByLabelText(/Cash Payment/i) as HTMLInputElement;

    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '1500');

    await userEvent.clear(cashInput);
    await userEvent.type(cashInput, '1000');

    expect(totalInput.value).toBe('1500');
    expect(cashInput.value).toBe('1000');
  });

  // 테스트 5: 유효성 검증 - 음수 입력
  test('음수 입력은 검증 에러를 표시한다', async () => {
    render(<SalesForm />);

    const totalInput = screen.getByLabelText(/Total Revenue/i);
    const submitButton = screen.getByText('Submit');

    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '-100');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/총 매출은 0 이상이어야 합니다/i)).toBeInTheDocument();
    });
  });

  // 테스트 6: 합계 검증 (cash + card = total)
  test('현금과 카드 합계가 총 매출과 맞지 않으면 에러를 표시한다', async () => {
    render(<SalesForm />);

    const totalInput = screen.getByLabelText(/Total Revenue/i);
    const cashInput = screen.getByLabelText(/Cash Payment/i);
    const cardInput = screen.getByLabelText(/Card Payment/i);
    const submitButton = screen.getByText('Submit');

    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '1500');

    await userEvent.clear(cashInput);
    await userEvent.type(cashInput, '1000');

    // 카드 값을 잘못 입력
    await userEvent.clear(cardInput);
    await userEvent.type(cardInput, '300'); // 올바른 값은 500

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/현금 \+ 카드 = 총 매출이어야 합니다/i)).toBeInTheDocument();
    });
  });

  // 테스트 7: 온라인 상태에서 API 제출
  test('온라인 상태에서 API 제출이 성공한다', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    mockUseOfflineSync.mockReturnValue({
      ...defaultOfflineSyncMock,
      isOffline: false,
    });

    render(<SalesForm />);

    const totalInput = screen.getByLabelText(/Total Revenue/i);
    const cashInput = screen.getByLabelText(/Cash Payment/i);
    const submitButton = screen.getByText('Submit');

    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '1000');

    await userEvent.clear(cashInput);
    await userEvent.type(cashInput, '600');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/sales',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  // 테스트 8: 오프라인 상태에서 IndexedDB 저장
  test('오프라인 상태에서 IndexedDB에 저장된다', async () => {
    mockAddPendingSale.mockResolvedValueOnce({
      id: 'test_123',
      date: '2026-08-18',
      total_revenue: 1000,
      cash_payment: 600,
      card_payment: 400,
      status: 'pending',
      createdAt: Date.now(),
    });

    mockUseOfflineSync.mockReturnValue({
      ...defaultOfflineSyncMock,
      isOffline: true,
    });

    render(<SalesForm />);

    const totalInput = screen.getByLabelText(/Total Revenue/i);
    const cashInput = screen.getByLabelText(/Cash Payment/i);
    const submitButton = screen.getByText('Submit');

    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '1000');

    await userEvent.clear(cashInput);
    await userEvent.type(cashInput, '600');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddPendingSale).toHaveBeenCalledWith(
        expect.objectContaining({
          total_revenue: 1000,
          cash_payment: 600,
          card_payment: 400,
        })
      );
    });
  });

  // 테스트 9: 대기 중인 항목 표시
  test('대기 중인 항목이 있으면 표시된다', () => {
    mockUseOfflineSync.mockReturnValue({
      ...defaultOfflineSyncMock,
      pendingCount: 3,
      isSyncing: false,
    });

    render(<SalesForm />);

    expect(screen.getByText(/3개의 항목이 동기화 대기 중입니다./i)).toBeInTheDocument();
  });

  // 테스트 10: 동기화 진행 중 표시
  test('동기화 중일 때 진행 상태를 표시한다', () => {
    mockUseOfflineSync.mockReturnValue({
      ...defaultOfflineSyncMock,
      pendingCount: 2,
      isSyncing: true,
      syncStatus: 'syncing',
    });

    render(<SalesForm />);

    expect(screen.getByText(/동기화 중.../i)).toBeInTheDocument();
  });

  // 테스트 11: Submit 버튼 상태
  test('폼이 변경되지 않으면 Submit 버튼이 비활성화된다', () => {
    render(<SalesForm />);

    const submitButton = screen.getByText('Submit') as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);
  });

  // 테스트 12: Reset 버튼
  test('Reset 버튼이 폼을 초기화한다', async () => {
    render(<SalesForm />);

    const totalInput = screen.getByLabelText(/Total Revenue/i) as HTMLInputElement;
    const resetButton = screen.getByText('Reset');

    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '1000');

    expect(totalInput.value).toBe('1000');

    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(totalInput.value).toBe('0');
    });
  });

  // 테스트 13: 카드 결제 자동 계산
  test('카드 결제가 자동으로 계산된다', async () => {
    render(<SalesForm />);

    const totalInput = screen.getByLabelText(/Total Revenue/i);
    const cashInput = screen.getByLabelText(/Cash Payment/i);
    const cardInput = screen.getByLabelText(/Card Payment/i) as HTMLInputElement;

    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '1500');

    await userEvent.clear(cashInput);
    await userEvent.type(cashInput, '1000');

    // 자동 계산 대기
    await waitFor(() => {
      expect(parseFloat(cardInput.value)).toBe(500);
    });
  });

  // 테스트 14: 날짜 필드 기본값
  test('날짜 필드에 오늘 날짜가 기본값으로 설정된다', () => {
    render(<SalesForm />);

    const dateInput = screen.getByLabelText(/Date/i) as HTMLInputElement;
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    expect(dateInput.value).toBe(expectedDate);
  });

  // 테스트 15: 미래 날짜 검증
  test('미래 날짜 입력은 검증 에러를 표시한다', async () => {
    render(<SalesForm />);

    const dateInput = screen.getByLabelText(/Date/i);
    const submitButton = screen.getByText('Submit');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, tomorrowString);

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/과거 또는 오늘 날짜만 입력 가능합니다/i)).toBeInTheDocument();
    });
  });
});
