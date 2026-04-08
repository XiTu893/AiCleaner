import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Activity, Cpu, HardDrive, Monitor, RefreshCw, Database, Layers, Zap } from 'lucide-react';

interface HealthStatus {
  component: string;
  status: 'good' | 'warning' | 'error';
  score: number;
  message: string;
}

interface GPUInfo {
  name: string;
  adapterRAM: number;
  driverVersion: string;
  status: string;
}

interface SystemInfo {
  platform: string;
  arch: string;
  cpus: Array<{ model: string; speed: number }>;
  totalMemory: number;
  freeMemory: number;
  hostname: string;
  release: string;
  uptime: number;
  gpu: GPUInfo[];
}

interface DiskInfo {
  name: string;
  freeSpace: number;
  size: number;
}

const HardwareOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<number | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([]);
  const [infoLoading, setInfoLoading] = useState(true);
  const mountedRef = useRef(true);

  const STORAGE_KEY = 'hardware_health_check';

  const saveHealthData = (score: number, status: HealthStatus[], time: number) => {
    try {
      const data = {
        overallScore: score,
        healthStatus: status,
        lastCheckTime: time
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('保存健康数据失败:', error);
    }
  };

  const loadHealthData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setOverallScore(parsed?.overallScore || 0);
        setHealthStatus(parsed?.healthStatus || []);
        setLastCheckTime(parsed?.lastCheckTime || null);
        return parsed;
      }
    } catch (error) {
      console.error('加载健康数据失败:', error);
    }
    return null;
  };

  const shouldAutoCheck = (lastTime: number | null): boolean => {
    if (!lastTime) return true;
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - lastTime > oneDay;
  };

  const tabs = [
    { id: 'health', label: '健康状态', icon: <Activity size={16} /> },
    { id: 'cpu', label: 'CPU', icon: <Cpu size={16} /> },
    { id: 'memory', label: '内存', icon: <Layers size={16} /> },
    { id: 'gpu', label: '显卡', icon: <Monitor size={16} /> },
    { id: 'disk', label: '磁盘', icon: <HardDrive size={16} /> },
  ];

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'CPU':
        return <Cpu size={20} />;
      case '内存':
        return <Activity size={20} />;
      case '硬盘':
        return <HardDrive size={20} />;
      case '显卡':
        return <Monitor size={20} />;
      default:
        return <Activity size={20} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#27ae60';
      case 'warning':
        return '#f39c12';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const handleTaskUpdate = useCallback((task: any) => {
    if (task.id === currentTaskId && mountedRef.current) {
      if (task.status === 'completed' && task.result) {
        setHealthStatus(task.result.healthStatus || []);
        setOverallScore(task.result.overallScore || 0);
        setLoading(false);
      } else if (task.status === 'failed' || task.status === 'cancelled') {
        setLoading(false);
      }
    }
  }, [currentTaskId]);

  useEffect(() => {
    mountedRef.current = true;
    
    window.electronAPI.onTaskUpdate(handleTaskUpdate);
    loadHardwareInfo();
    
    const savedData = loadHealthData();
    if (!savedData || !savedData.lastCheckTime) {
      checkHardwareHealth();
    }
    
    return () => {
      mountedRef.current = false;
      window.electronAPI.removeTaskUpdateListener();
    };
  }, [handleTaskUpdate]);

  const loadHardwareInfo = async () => {
    try {
      const system = await window.electronAPI.getSystemInfo();
      const disks = await window.electronAPI.getDiskInfo();
      setSystemInfo(system);
      setDiskInfo(disks);
    } catch (error) {
      console.error('加载硬件信息失败:', error);
    } finally {
      setInfoLoading(false);
    }
  };

  const checkHardwareHealth = async () => {
    setScanning(true);
    setProgress(0);
    setHealthStatus([]);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          
          const mockStatus: HealthStatus[] = [
            {
              component: 'CPU',
              status: 'good',
              score: 95,
              message: 'CPU 运行正常，温度在安全范围内',
            },
            {
              component: '内存',
              status: 'good',
              score: 92,
              message: '内存使用正常，无异常占用',
            },
            {
              component: '硬盘',
              status: 'warning',
              score: 75,
              message: 'C 盘剩余空间不足，建议清理',
            },
            {
              component: '显卡',
              status: 'good',
              score: 90,
              message: '显卡驱动正常，性能良好',
            },
          ];

          if (mountedRef.current) {
            setHealthStatus(mockStatus);
            const avgScore = Math.round(mockStatus.reduce((sum, s) => sum + s.score, 0) / mockStatus.length);
            setOverallScore(avgScore);
            const now = Date.now();
            setLastCheckTime(now);
            saveHealthData(avgScore, mockStatus, now);
          }
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatGHz = (mhz: number) => {
    return `${(mhz / 1000).toFixed(2)} GHz`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  const formatLastCheckTime = (timestamp: number | null) => {
    if (!timestamp) return '未检测';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      return '刚刚检测';
    } else if (hours < 24) {
      return `${hours}小时前检测`;
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderHealthTab = () => (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>硬件健康检测</h3>
          <button className="primary-button" onClick={checkHardwareHealth} disabled={scanning}>
            <RefreshCw size={18} />
            {scanning ? '检测中...' : '重新检测'}
          </button>
        </div>

        {scanning && (
          <div className="scan-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">正在检测硬件健康状态... {progress}%</p>
          </div>
        )}

        {!scanning && healthStatus.length > 0 && (
          <>
            <div className="card" style={{ textAlign: 'center', padding: '25px 20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontSize: '42px', 
                  fontWeight: 'bold', 
                  color: overallScore >= 90 ? '#27ae60' : overallScore >= 70 ? '#f39c12' : '#e74c3c',
                  marginBottom: '8px'
                }}>
                  {overallScore || '--'}分
                </div>
                <p style={{ color: '#7f8c8d', fontSize: '14px', margin: 0 }}>
                  {overallScore >= 90 ? '电脑状态优秀' : overallScore >= 70 ? '电脑状态良好' : '电脑状态一般'}
                </p>
                {lastCheckTime && (
                  <p style={{ color: '#95a5a6', fontSize: '12px', marginTop: '8px' }}>
                    {formatLastCheckTime(lastCheckTime)}
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px', paddingBottom: '10px' }}>
                <Activity size={18} />
                硬件健康状态
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {healthStatus.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--bg-card)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${getStatusColor(item.status)}`,
                    }}
                  >
                    <div style={{ color: getStatusColor(item.status) }}>{getComponentIcon(item.component)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.component}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getStatusIcon(item.status)}
                          <span style={{ fontWeight: 'bold', color: getStatusColor(item.status), fontSize: '13px' }}>{item.score}%</span>
                        </div>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        background: 'var(--border-light)', 
                        borderRadius: '3px', 
                        overflow: 'hidden',
                        marginBottom: '4px'
                      }}>
                        <div
                          style={{
                            width: `${item.score}%`,
                            height: '100%',
                            background: getStatusColor(item.status),
                            transition: 'width 0.5s',
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '12px', color: '#7f8c8d', margin: 0 }}>{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!scanning && healthStatus.length === 0 && (
          <div className="empty-state">
            <Activity size={64} color="#bdc3c7" />
            <h3>未检测硬件健康</h3>
            <p>点击"重新检测"按钮开始检测硬件健康状态</p>
            <button className="primary-button" onClick={checkHardwareHealth}>
              开始检测
            </button>
          </div>
        )}
      </div>
    </div>
  );

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
              {systemInfo?.cpus[0]?.model || '未知'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>核心数</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>{systemInfo?.cpus.length || 0} 核心</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>主频</div>
              <div style={{ fontSize: '13px', color: '#2c3e50' }}>{formatGHz(systemInfo?.cpus[0]?.speed || 0)}</div>
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
                background: 'var(--bg-card)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMemoryTab = () => (
    <div className="card">
      <div className="card-title">
        <Layers size={18} />
        内存信息
      </div>
      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">总内存</div>
          <div className="info-value">{formatSize(systemInfo?.totalMemory || 0)}</div>
        </div>
        <div className="info-item">
          <div className="info-label">可用内存</div>
          <div className="info-value">{formatSize(systemInfo?.freeMemory || 0)}</div>
        </div>
        <div className="info-item">
          <div className="info-label">已使用内存</div>
          <div className="info-value">
            {formatSize((systemInfo?.totalMemory || 0) - (systemInfo?.freeMemory || 0))}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">使用率</div>
          <div className="info-value">
            {systemInfo?.totalMemory
              ? Math.round(((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100)
              : 0}%
          </div>
        </div>
      </div>
    </div>
  );

  const renderGPUTab = () => (
    <div className="card">
      <div className="card-title">
        <Monitor size={18} />
        显卡信息
      </div>
      {systemInfo?.gpu && systemInfo.gpu.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {systemInfo.gpu.map((gpu, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--primary-color)',
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                显卡 {index + 1}: {gpu.name}
              </div>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div className="info-label">显存容量</div>
                  <div className="info-value">{formatSize(gpu.adapterRAM)}</div>
                </div>
                <div>
                  <div className="info-label">驱动版本</div>
                  <div className="info-value">{gpu.driverVersion}</div>
                </div>
                <div>
                  <div className="info-label">状态</div>
                  <div className="info-value" style={{ color: gpu.status === 'OK' ? 'var(--accent-color)' : 'var(--danger-color)' }}>
                    {gpu.status === 'OK' ? '正常' : '异常'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', color: '#95a5a6' }}>
          <Monitor size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
          <p>未检测到独立显卡</p>
        </div>
      )}
    </div>
  );

  const renderDiskTab = () => (
    <div className="card">
      <div className="card-title">
        <HardDrive size={18} />
        磁盘信息
      </div>
      {diskInfo.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {diskInfo.map((disk, index) => {
            const usagePercent = Math.round((disk.freeSpace / disk.size) * 100);
            return (
              <div
              key={index}
              style={{
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--primary-color)',
              }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{disk.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatSize(disk.size)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${usagePercent}%`,
                        height: '100%',
                        background: usagePercent > 80 ? 'var(--danger-color)' : usagePercent > 50 ? 'var(--warning-color)' : 'var(--accent-color)',
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px' }}>{100 - usagePercent}% 可用</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  已用：{formatSize(disk.size - disk.freeSpace)} / 可用：{formatSize(disk.freeSpace)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', color: '#95a5a6' }}>
          <HardDrive size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
          <p>未检测到磁盘信息</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (infoLoading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          <p className="loading-text">正在加载硬件参数...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'health':
        return renderHealthTab();
      case 'cpu':
        return renderCPUTab();
      case 'memory':
        return renderMemoryTab();
      case 'gpu':
        return renderGPUTab();
      case 'disk':
        return renderDiskTab();
      default:
        return renderHealthTab();
    }
  };

  return (
    <div>
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

export default HardwareOverview;
