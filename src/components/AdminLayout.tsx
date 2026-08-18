import React, { useState } from 'react';
import { BarChart3, FileText, Scale, Settings, LogOut } from 'lucide-react';
import Dashboard from './Dashboard';
import InvoiceManagement from './InvoiceManagement';
import ReconciliationUI from './ReconciliationUI';

type TabType = 'dashboard' | 'invoices' | 'reconciliation';

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: BarChart3,
    },
    {
      id: 'invoices',
      label: '송장 관리',
      icon: FileText,
    },
    {
      id: 'reconciliation',
      label: '대조 관리',
      icon: Scale,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'reconciliation':
        return <ReconciliationUI />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <div className="w-64 bg-bg-secondary border-r border-border-color flex flex-col shadow-sm">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-border-color">
          <h1 className="text-lg font-extrabold tracking-tight text-accent">
            Store Hub
          </h1>
          <p className="text-[11px] text-text-muted mt-1">
            Admin Dashboard
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-text-secondary hover:bg-bg-hover'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 space-y-1 border-t border-border-color">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-text-secondary hover:bg-bg-hover transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm">설정</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-text-secondary hover:bg-bg-hover transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">로그아웃</span>
          </button>

          {/* User Info */}
          <div className="pt-2 mt-2 border-t border-border-color">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-text-primary">Chloe Admin</p>
              <p className="text-[11px] text-text-muted">chloe@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-bg-secondary border-b border-border-color px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>마지막 동기화: 방금 전</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
