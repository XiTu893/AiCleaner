import React, { useState } from 'react';
import { Trash, Zap, HardDrive } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import JunkCleaner from './JunkCleaner';
import OptimizeSpeed from './OptimizeSpeed';
import CDriveCleaner from './CDriveCleaner';

const Cleaner: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cleaner');

  const tabs = [
    { id: 'cleaner', label: '垃圾清理', icon: <Trash size={18} /> },
    { id: 'speed', label: '优化加速', icon: <Zap size={18} /> },
    { id: 'cdrive', label: 'C 盘瘦身', icon: <HardDrive size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'cleaner':
        return <JunkCleaner />;
      case 'speed':
        return <OptimizeSpeed />;
      case 'cdrive':
        return <CDriveCleaner />;
      default:
        return <JunkCleaner />;
    }
  };

  return (
    <div>
      <div className="header">
        <h2>📂 清理优化</h2>
      </div>

      <HorizontalTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Cleaner;
