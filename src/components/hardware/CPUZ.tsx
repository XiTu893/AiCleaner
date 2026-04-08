import React, { useState, useEffect } from 'react';
import { Cpu, Database, Zap, Cpu as Chip, Layers, Activity } from 'lucide-react';

const CPUZ: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cpu');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await window.electronAPI.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('加载系统信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatGHz = (mhz: number) => {
    return `${(mhz / 1000).toFixed(2)} GHz`;
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const tabs = [
    { id: 'cpu', label: 'CPU', icon: <Cpu size={16} /> },
    { id: 'cache', label: '缓存', icon: <Database size={16} /> },
    { id: 'mainboard', label: '主板', icon: <Chip size={16} /> },
    { id: 'memory', label: '内存', icon: <Layers size={16} /> },
    { id: 'spd', label: 'SPD', icon: <Activity size={16} /> },
  ];

  const renderCPUTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div className="card">
        <div className="card-title">
          <Cpu size={18} />
          处理器
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>名称</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
              {systemInfo?.cpus[0]?.model || 'Intel(R) Core(TM) i7-10700K'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>代号</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>Comet Lake</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>最大睿频</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>5.10 GHz</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>TDP</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>125 W</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>插槽</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>LGA1200</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Activity size={18} />
          时钟频率
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>核心速度</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
              {formatGHz(systemInfo?.cpus[0]?.speed || 3800)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>倍频</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>x 38.0</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>总线速度</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>100 MHz</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Layers size={18} />
          核心数
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>核心数</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
                {systemInfo?.cpus.length || 8}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>线程数</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>16</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>超线程</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>已启用</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>虚拟化</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>已启用</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Zap size={18} />
          特性
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['MMX', 'SSE', 'SSE2', 'SSE3', 'SSSE3', 'SSE4.1', 'SSE4.2', 'AVX', 'AVX2', 'EM64T', 'VT-x', 'AES-NI'].map((feature, index) => (
            <span
              key={index}
              style={{
                padding: '4px 10px',
                background: '#ecf0f1',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#2c3e50'
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCacheTab = () => (
    <div className="card">
      <div className="card-title">
        <Database size={18} />
        缓存信息
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>L1 数据缓存</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>8 x 32 KB</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>L1 指令缓存</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>8 x 32 KB</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>L2 缓存</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>8 x 256 KB</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>L3 缓存</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>16 MB</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainboardTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div className="card">
        <div className="card-title">
          <Chip size={18} />
          主板
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>制造商</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>ASUS</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>型号</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>ROG STRIX Z490-E GAMING</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>芯片组</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>Intel Z490</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>BIOS 版本</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>2403</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>BIOS 日期</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>05/11/2021</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Activity size={18} />
          图形接口
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>接口</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>PCI-Express</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>版本</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>PCI-E 3.0 x16</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>当前带宽</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>PCI-E 3.0 x16</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMemoryTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div className="card">
        <div className="card-title">
          <Layers size={18} />
          常规
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>类型</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>DDR4</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>大小</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
              {formatSize(systemInfo?.totalMemory || 34359738368)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>通道数</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>双通道</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>NB 频率</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>1800 MHz</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Activity size={18} />
          时序
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>DRAM 频率</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3498db' }}>1800 MHz</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>CL</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>16</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>tRCD</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>18</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>tRP</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>18</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>tRAS</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>38</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>Command Rate</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>2T</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSPDTab = () => (
    <div className="card">
      <div className="card-title">
        <Activity size={18} />
        内存插槽 #1
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>模块容量</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>16 GB</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>最大带宽</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>DDR4-3600 (1800 MHz)</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>制造商</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>G.Skill</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>型号</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>F4-3600C16D-32GTZN</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>序列号</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>00000000</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>周/年份</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>32/20</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>电压</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>1.35 V</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>XMP 支持</div>
            <div style={{ fontSize: '13px', color: '#2c3e50' }}>是</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">正在加载 CPU 信息...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'cpu':
        return renderCPUTab();
      case 'cache':
        return renderCacheTab();
      case 'mainboard':
        return renderMainboardTab();
      case 'memory':
        return renderMemoryTab();
      case 'spd':
        return renderSPDTab();
      default:
        return renderCPUTab();
    }
  };

  return (
    <div>
      <div className="header">
        <h2>💻 CPU-Z</h2>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '2px solid #ecf0f1',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? '#3498db' : '#7f8c8d',
              borderBottom: activeTab === tab.id ? '2px solid #3498db' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};

export default CPUZ;
