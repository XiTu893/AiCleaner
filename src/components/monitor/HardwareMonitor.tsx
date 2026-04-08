import React, { useState, useEffect } from 'react';
import { Activity, Gauge, Heart, Power, ToggleLeft, ToggleRight } from 'lucide-react';
import HorizontalTabs from '../common/HorizontalTabs';
import RealTimeMonitor from './RealTimeMonitor';
import StressTest from '../benchmark/StressTest';
import HardwareHealth from './HardwareHealth';
import PowerSaving from '../cleaner/PowerSaving';

const HardwareMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('realtime');
  const [widgetEnabled, setWidgetEnabled] = useState(false);

  const tabs = [
    { id: 'realtime', label: '实时监控', icon: <Activity size={18} /> },
    { id: 'stress', label: '压力测试', icon: <Gauge size={18} /> },
    { id: 'health', label: '硬件健康', icon: <Heart size={18} /> },
    { id: 'power', label: '节能降温', icon: <Power size={18} /> },
  ];

  useEffect(() => {
    const checkWidgetStatus = async () => {
      try {
        const status = await window.electronAPI.getWidgetStatus();
        setWidgetEnabled(status.visible);
      } catch (error) {
        console.error('获取 widget 状态失败:', error);
      }
    };
    checkWidgetStatus();
  }, []);

  const toggleWidget = async () => {
    try {
      const result = await window.electronAPI.toggleWidget();
      setWidgetEnabled(result);
    } catch (error) {
      console.error('切换 widget 失败:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'realtime':
        return <RealTimeMonitor />;
      case 'stress':
        return <StressTest />;
      case 'health':
        return <HardwareHealth />;
      case 'power':
        return <PowerSaving />;
      default:
        return <RealTimeMonitor />;
    }
  };

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🛡️ 硬件监控</h2>
          <button
            onClick={toggleWidget}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: widgetEnabled ? 'var(--accent-color)' : '#7f8c8d',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'background 0.2s'
            }}
          >
            {widgetEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {widgetEnabled ? '关闭桌面组件' : '开启桌面组件'}
          </button>
        </div>
      </div>

      <HorizontalTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default HardwareMonitor;
