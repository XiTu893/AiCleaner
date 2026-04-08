import React, { useState } from 'react';
import { Trash, Package } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import SoftwareUninstall from './SoftwareUninstall';
import PackageCleaner from './PackageCleaner';

const SoftwareManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('uninstall');

  const tabs = [
    { id: 'uninstall', label: '软件卸载', icon: <Trash size={18} /> },
    { id: 'package', label: '安装包清理', icon: <Package size={18} /> },
  ];

  return (
    <div className="feature-container">
      <h1 className="feature-title">软件管理</h1>
      <p className="feature-description">
        全面管理软件卸载和安装包清理，保持系统整洁高效
      </p>

      <HorizontalTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="tab-content">
        {activeTab === 'uninstall' && <SoftwareUninstall />}
        {activeTab === 'package' && <PackageCleaner />}
      </div>
    </div>
  );
};

export default SoftwareManager;
