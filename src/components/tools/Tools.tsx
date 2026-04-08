import React, { useState } from 'react';
import { Calculator, Database, Scissors } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import PowerCalculator from './PowerCalculator';
import DataRecovery from './DataRecovery';
import FileShredder from './FileShredder';

const Tools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('power');

  const tabs = [
    { id: 'power', label: '功耗计算器', icon: <Calculator size={18} /> },
    { id: 'recovery', label: '数据恢复', icon: <Database size={18} /> },
    { id: 'shredder', label: '文件粉碎机', icon: <Scissors size={18} /> },
  ];

  return (
    <div className="feature-container">
      <h1 className="feature-title">实用工具</h1>
      <p className="feature-description">
        提供多种实用工具，包括功耗计算、数据恢复和文件粉碎
      </p>

      <HorizontalTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="tab-content">
        {activeTab === 'power' && <PowerCalculator />}
        {activeTab === 'recovery' && <DataRecovery />}
        {activeTab === 'shredder' && <FileShredder />}
      </div>
    </div>
  );
};

export default Tools;
