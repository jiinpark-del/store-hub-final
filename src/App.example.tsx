/**
 * App Example - SalesForm 사용 예제
 * 이 파일은 SalesForm 컴포넌트를 React 앱에서 어떻게 사용하는지 보여줍니다.
 */

import React from 'react';
import SalesForm from './components/SalesForm';

/**
 * 기본 사용 예제
 */
export const BasicExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <SalesForm />
      </div>
    </div>
  );
};

/**
 * 전체 앱 구조 예제
 */
export const FullAppExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Store Hub - Daily Sales Manager
          </h1>
          <p className="mt-2 text-gray-600">
            온라인/오프라인 모두 지원하는 판매 데이터 입력 시스템
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 폼 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <SalesForm />
          </div>

          {/* 정보 섹션 */}
          <div className="space-y-6">
            {/* 기능 설명 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기능</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  <span>실시간 유효성 검증</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  <span>오프라인 모드 - IndexedDB 저장</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  <span>자동 동기화 (온라인 복구 시)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  <span>카드 결제 자동 계산</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  <span>Idempotency 지원</span>
                </li>
              </ul>
            </div>

            {/* 기술 스택 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기술 스택</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">React</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">18.2+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">TypeScript</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">5.0+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">React Hook Form</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">7.48+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Zod</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">3.22+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">IDB</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">7.1+</span>
                </div>
              </div>
            </div>

            {/* 오프라인 작동 방식 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-2">오프라인 작동 방식</h2>
              <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                <li>네트워크 없을 때 데이터는 IndexedDB에 저장</li>
                <li>온라인 복구 시 자동으로 서버에 동기화</li>
                <li>Idempotency-Key로 중복 방지</li>
                <li>동기화 상태가 UI에 표시됨</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            Store Hub © 2026 | 소매점 관리 시스템
          </p>
        </div>
      </footer>
    </div>
  );
};

/**
 * 기본 내보내기 - FullAppExample
 */
export default FullAppExample;
