import React, { useState, useEffect } from 'react';
import { Monitor, Zap, Activity, Cpu, Database } from 'lucide-react';

const GPUZ: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gpu');
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

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '未知';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const tabs = [
    { id: 'gpu', label: '显卡', icon: <Monitor size={16} /> },
    { id: 'sensors', label: '传感器', icon: <Activity size={16} /> },
    { id: 'advanced', label: '高级', icon: <Cpu size={16} /> },
    { id: 'validation', label: '验证', icon: <Database size={16} /> },
  ];

  const renderGPUTab = () => {
    const gpu = systemInfo?.gpu?.[0] || {
      name: 'NVIDIA GeForce RTX 3080',
      adapterRAM: 10737418240,
      driverVersion: '537.42',
      status: 'OK'
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div className="card-title">
            <Monitor size={18} />
            名称
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>GPU</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {gpu.name}
            </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>GPU 修订</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>GA102</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>技术</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>8 nm</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>芯片面积</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>628 mm²</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>发布日期</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Sep 17th, 2020</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>BIOS 版本</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>94.02.71.40.02</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>设备 ID</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>10DE 2206 1433 10DE</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>子供应商</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>ASUS (1433)</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>ROP 单元</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>96</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>总线接口</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>PCIe x16 v4.0 @ x16 4.0</div>
          </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Activity size={18} />
            时钟频率
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>GPU 核心</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-color)' }}>1440 MHz</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--accent-color)' }}>950 MHz</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存带宽</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>760.0 GB/s</div>
          </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Database size={18} />
            显存
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存类型</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>GDDR6X</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存容量</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {formatSize(gpu.adapterRAM)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存位宽</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>320 bit</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Cpu size={18} />
            NVIDIA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>驱动程序版本</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {gpu.driverVersion}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>PhysX</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>是</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>CUDA</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>8704</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>DirectX 支持</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>12.1 / 12.1</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Shader Model</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>6.7</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>OpenCL</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>3.0</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Vulkan</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>1.3.274</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>CUDA 计算能力</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>8.6</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSensorsTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div className="card">
        <div className="card-title">
          <Activity size={18} />
          GPU 传感器
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>GPU 核心</div>
            <div style={{ fontSize: '22px', fontWeight: '600', color: 'var(--primary-color)' }}>42%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存控制器</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-color)' }}>28%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存使用</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-color)' }}>4523 MB</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>GPU 温度</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--danger-color)' }}>58°C</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>功耗</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--warning-color)' }}>234 W</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Zap size={18} />
          时钟频率
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>GPU 核心</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-color)' }}>1440 MHz</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>显存</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-color)' }}>950 MHz</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>性能限制</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>无</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div className="card">
        <div className="card-title">
          <Cpu size={18} />
          电源管理
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>P-State 0</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>1935 MHz @ 1.100V</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>P-State 1</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>1920 MHz @ 1.087V</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>P-State 2</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>1905 MHz @ 1.075V</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Database size={18} />
          多 GPU
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>SLI</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>禁用</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderValidationTab = () => (
    <div className="card">
      <div className="card-title">
        <Database size={18} />
        验证结果
      </div>
      <div style={{ textAlign: 'center', padding: '30px 20px' }}>
        <Activity size={40} color="var(--text-muted)" style={{ marginBottom: '15px', opacity: 0.5 }} />
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>暂无验证数据</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">正在加载 GPU 信息...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'gpu':
        return renderGPUTab();
      case 'sensors':
        return renderSensorsTab();
      case 'advanced':
        return renderAdvancedTab();
      case 'validation':
        return renderValidationTab();
      default:
        return renderGPUTab();
    }
  };

  return (
    <div>
      <div className="header">
        <h2>🎮 GPU-Z</h2>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '16px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
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

export default GPUZ;
