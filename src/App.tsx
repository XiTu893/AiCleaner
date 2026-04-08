import { useState, useEffect } from 'react';
import { Home, ClipboardCheck, Gauge, Shield, Layers, RefreshCw, Trash2, Wrench, Heart, Cpu, Thermometer, Zap, HardDrive, Smartphone, Calculator, FileSearch, Scissors, Monitor, Activity } from 'lucide-react';
import Overview from './components/overview/Overview';
import HardwareDetection from './components/hardware/HardwareDetection';
import HardwareMonitor from './components/monitor/HardwareMonitor';
import SoftwareManager from './components/software/SoftwareManager';
import Cleaner from './components/cleaner/Cleaner';
import DriverManager from './components/driver/DriverManager';
import Tools from './components/tools/Tools';
import Support from './components/support/Support';
import DesktopWidget from './components/widget/DesktopWidget';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isWidgetMode, setIsWidgetMode] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#widget') {
      setIsWidgetMode(true);
    }
  }, []);

  if (isWidgetMode) {
    return <DesktopWidget />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'hardware':
        return <HardwareDetection />;
      case 'monitor':
        return <HardwareMonitor />;
      case 'cleaner':
      case 'startup-opt':
      case 'c-drive':
      case 'desktop-org':
      case 'memory-release':
        return <Cleaner />;
      case 'driver':
      case 'driver-detect':
      case 'driver-backup':
        return <DriverManager />;
      case 'software':
      case 'software-mgr':
      case 'software-uninstall':
      case 'software-upgrade':
      case 'package-cleaner':
        return <SoftwareManager />;
      case 'tools':
      case 'power-calc':
      case 'desktop-monitor':
      case 'data-recovery':
      case 'file-shredder':
        return <Tools />;
      case 'support':
      case 'about':
      case 'help':
      case 'feedback':
        return <Support />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="logo">
          <h1>🔍 智清大师</h1>
          <p>AI Cleaner Pro</p>
        </div>
        <div className="menu-container">
          {/* 1. 首页 */}
          <div 
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home size={20} />
            <span>首 页</span>
          </div>

          {/* 2. 硬件检测 */}
          <div 
            className={`menu-item ${activeTab === 'hardware' ? 'active' : ''}`}
            onClick={() => setActiveTab('hardware')}
          >
            <ClipboardCheck size={20} />
            <span>硬件检测</span>
          </div>

          {/* 3. 硬件监控 */}
          <div 
            className={`menu-item ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            <Shield size={20} />
            <span>硬件监控</span>
          </div>

          {/* 5. 清理优化 */}
          <div 
            className={`menu-item ${activeTab === 'cleaner' ? 'active' : ''}`}
            onClick={() => setActiveTab('cleaner')}
          >
            <Layers size={20} />
            <span>清理优化</span>
          </div>

          {/* 6. 驱动管理 */}
          <div 
            className={`menu-item ${activeTab === 'driver' ? 'active' : ''}`}
            onClick={() => setActiveTab('driver')}
          >
            <RefreshCw size={20} />
            <span>驱动管理</span>
          </div>

          {/* 7. 软件管理 */}
          <div 
            className={`menu-item ${activeTab === 'software' ? 'active' : ''}`}
            onClick={() => setActiveTab('software')}
          >
            <Trash2 size={20} />
            <span>软件管理</span>
          </div>

          {/* 8. 实用工具 */}
          <div 
            className={`menu-item ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            <Wrench size={20} />
            <span>实用工具</span>
          </div>

          {/* 9. 技术支持 */}
          <div 
            className={`menu-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
            style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}
          >
            <Heart size={20} />
            <span>技术支持</span>
          </div>
          
          {/* 版本号 */}
          <div style={{ 
            padding: '15px 20px', 
            textAlign: 'center', 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.5)',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            v1.0.2
          </div>
        </div>
      </div>
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
