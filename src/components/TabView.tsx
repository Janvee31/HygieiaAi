'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TabViewProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ComponentType<any>;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
  themeColor?: string;
}

const TabView: React.FC<TabViewProps> = ({ tabs, defaultTab, themeColor = '#3b82f6' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-center border-b border-white/10 mb-6">
        <div className="inline-flex bg-black/30 backdrop-blur-md rounded-t-xl p-1 border border-white/10 border-b-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`px-6 py-3 font-medium text-sm transition-all relative rounded-lg flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? `${themeColor}20` : ''
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {Icon && <Icon className="w-4 h-4" style={{ color: activeTab === tab.id ? themeColor : 'rgba(255, 255, 255, 0.6)' }} />}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: themeColor }}
                    layoutId="tabIndicator"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-grow overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-full transition-opacity duration-300 ${
              activeTab === tab.id ? 'block' : 'hidden'
            }`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabView;
