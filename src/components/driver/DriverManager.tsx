import React, { useState } from 'react';
import { Search, HardDrive, RotateCcw } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import DriverDetect from './DriverDetect';
import DriverBackup from './DriverBackup';

const DriverManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('detect');

  const tabs = [
    { id: 'detect', label: '驱动检测', icon: <Search size={18} /> },
    { id: 'backup', label: '驱动备份/还原', icon: <HardDrive size={18} /> },
  ];

  return (
    <div className="feature-container">
      <h1 className="feature-title">驱动管理</h1>
      <p className="feature-description">
        智能检测驱动状态，提供驱动备份与还原功能，确保系统稳定运行
      </p>

      <HorizontalTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="tab-content">
        {activeTab === 'detect' && <DriverDetect />}
        {activeTab === 'backup' && <DriverBackup />}
      </div>
    </div>
  );
};

export default DriverManager;
