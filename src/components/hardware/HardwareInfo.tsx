import React, { useState, useEffect } from 'react';
import { Cpu, Monitor, HardDrive, Activity, Smartphone, Radio, Music, Save } from 'lucide-react';

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

const HardwareInfo: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHardwareInfo();
    const interval = setInterval(loadHardwareInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHardwareInfo = async () => {
    try {
      const system = await window.electronAPI.getSystemInfo();
      const disks = await window.electronAPI.getDiskInfo();
      setSystemInfo(system);
      setDiskInfo(disks);
    } catch (error) {
      console.error('加载硬件信息失败:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">正在加载硬件参数...</p>
      </div>
    );
  }

  return (
    <div>
      {/* CPU 信息 */}
      <div className="card">
        <div className="card-title">
          <Cpu size={20} />
          CPU 信息
        </div>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">处理器型号</div>
            <div className="info-value">
              {systemInfo?.cpus[0]?.model || '未知'}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">核心数量</div>
            <div className="info-value">{systemInfo?.cpus.length || 0} 核心</div>
          </div>
          <div className="info-item">
            <div className="info-label">主频</div>
            <div className="info-value">{formatGHz(systemInfo?.cpus[0]?.speed || 0)}</div>
          </div>
          <div className="info-item">
            <div className="info-label">架构</div>
            <div className="info-value">{systemInfo?.arch || '未知'}</div>
          </div>
        </div>
      </div>

      {/* 内存信息 */}
      <div className="card">
        <div className="card-title">
          <Activity size={20} />
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

      {/* 显卡信息 */}
      <div className="card">
        <div className="card-title">
          <Monitor size={20} />
          显卡信息
        </div>
        {systemInfo?.gpu && systemInfo.gpu.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Monitor size={40} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>未检测到独立显卡</p>
          </div>
        )}
      </div>

      {/* 磁盘信息 */}
      <div className="card">
        <div className="card-title">
          <HardDrive size={20} />
          磁盘信息
        </div>
        {diskInfo.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <HardDrive size={40} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>未检测到磁盘信息</p>
          </div>
        )}
      </div>

      {/* 系统信息 */}
      <div className="card">
        <div className="card-title">
          <Save size={20} />
          系统信息
        </div>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">操作系统</div>
            <div className="info-value">{systemInfo?.platform || '未知'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">主机名</div>
            <div className="info-value">{systemInfo?.hostname || '未知'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">系统版本</div>
            <div className="info-value">{systemInfo?.release || '未知'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">运行时间</div>
            <div className="info-value">{formatUptime(systemInfo?.uptime || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareInfo;
