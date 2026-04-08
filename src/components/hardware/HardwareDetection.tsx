import React, { useState } from 'react';
import { ClipboardCheck, Cpu, Monitor, Cpu as Chip, Gauge, Trophy, BarChart3 } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import HardwareOverview from './HardwareOverview';
import ScreenTest from './ScreenTest';
import CPUZ from './CPUZ';
import GPUZ from './GPUZ';
import BenchmarkCombined from '../benchmark/BenchmarkCombined';

const HardwareDetection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '硬件概览', icon: <ClipboardCheck size={18} /> },
    { id: 'cpu-z', label: 'CPU-Z', icon: <Chip size={18} /> },
    { id: 'gpu-z', label: 'GPU-Z', icon: <Monitor size={18} /> },
    { id: 'screen', label: '屏幕检测', icon: <Monitor size={18} /> },
    { id: 'benchmark', label: '性能评测', icon: <Gauge size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <HardwareOverview />;
      case 'cpu-z':
        return <CPUZ />;
      case 'gpu-z':
        return <GPUZ />;
      case 'screen':
        return <ScreenTest />;
      case 'benchmark':
        return <BenchmarkCombined />;
      default:
        return <HardwareOverview />;
    }
  };

  return (
    <div>
      <div className="header">
        <h2>🔍 硬件检测</h2>
      </div>

      <HorizontalTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default HardwareDetection;
