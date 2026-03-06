import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Dependencies from './Dependencies';

const Index = () => {
  const [activeTab, setActiveTab] = useState('scanner');

  return (
    <div className="min-h-screen glass-bg">
      {/* Navigation Tabs — Frosted glass */}
      <div className="glass-nav sticky top-0 z-40">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                activeTab === 'scanner'
                  ? 'border-[#AFCB0E] text-[#AFCB0E]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:border-[#D1D5DB]'
              }`}
            >
              Code Scanner
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                activeTab === 'dependencies'
                  ? 'border-[#AFCB0E] text-[#AFCB0E]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:border-[#D1D5DB]'
              }`}
            >
              Dependencies
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'scanner' && <Dashboard />}
        {activeTab === 'dependencies' && <Dependencies />}
      </div>
    </div>
  );
};

export default Index;
