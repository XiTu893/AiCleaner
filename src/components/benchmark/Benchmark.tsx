import React, { useState } from 'react';
import { Gauge, Trophy, BarChart3 } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import BenchmarkOverall from './BenchmarkOverall';
import BenchmarkSub from './BenchmarkSub';
import BenchmarkRank from './BenchmarkRank';

const Benchmark: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overall');

  const tabs = [
    { id: 'overall', label: '综合跑分', icon: <Gauge size={18} /> },
    { id: 'sub', label: '分项评测', icon: <BarChart3 size={18} /> },
    { id: 'rank', label: '性能排行', icon: <Trophy size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overall':
        return <BenchmarkOverall />;
      case 'sub':
        return <BenchmarkSub />;
      case 'rank':
        return <BenchmarkRank />;
      default:
        return <BenchmarkOverall />;
    }
  };

  return (
    <div>
      <div className="header">
        <h2>⚡ 性能评测</h2>
      </div>

      <HorizontalTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Benchmark;
