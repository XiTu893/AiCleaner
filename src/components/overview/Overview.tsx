import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cpu, Database, Activity, Clock, HardDrive, Home, Monitor, Wifi, Thermometer, Shield, Server, Battery, BatteryCharging, Zap } from 'lucide-react';

interface SystemStats {
  cpuCount: number;
  totalMemory: number;
  diskCount: number;
  uptime: number;
  gpuCount: number;
  cpuUsage?: number;
  memoryUsage?: number;
  platform?: string;
  arch?: string;
  hostname?: string;
  release?: string;
  gpu?: any[];
}

interface DiskInfo {
  name: string;
  size: number;
  freeSpace: number;
}

interface BatteryInfo {
  present: boolean;
  name: string;
  status: string;
  percent: number;
  isCharging: boolean;
  isFull: boolean;
  isDischarging: boolean;
  remainingTime: string;
  health: number;
}

const Overview: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [systemUsage, setSystemUsage] = useState<any>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([]);
  const [networkInfo, setNetworkInfo] = useState<{ upload: number; download: number }>({ upload: 0, download: 0 });
  const [diskUsage, setDiskUsage] = useState<{ read: number; write: number }>({ read: 0, write: 0 });
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    loadStats();
    loadSystemUsage();
    loadBatteryStatus();
    const usageInterval = setInterval(loadSystemUsage, 10000); // 10 秒刷新一次
    const batteryInterval = setInterval(loadBatteryStatus, 10000); // 10 秒刷新一次电池状态
    
    return () => {
      mountedRef.current = false;
      clearInterval(usageInterval);
      clearInterval(batteryInterval);
    };
  }, []);

  const loadStats = async () => {
    try {
      const system = await window.electronAPI.getSystemInfo();
      const disks = await window.electronAPI.getDiskInfo();
      setStats({
        cpuCount: system.cpus.length,
        totalMemory: system.totalMemory,
        diskCount: disks.length,
        uptime: system.uptime,
        gpuCount: system.gpu?.length || 0,
        platform: system.platform,
        arch: system.arch,
        hostname: system.hostname,
        release: system.release,
        gpu: system.gpu
      });
      setDiskInfo(disks);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSystemUsage = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const usage = await window.electronAPI.getSystemUsage();
      setSystemUsage(usage);
      
      // 模拟网络和磁盘速度（实际应该从后端获取）
      setNetworkInfo({
        upload: Math.random() * 50 + 10,
        download: Math.random() * 200 + 50
      });
      
      setDiskUsage({
        read: Math.random() * 100 + 20,
        write: Math.random() * 50 + 10
      });
    } catch (error) {
      console.error('Failed to load system usage:', error);
    }
  }, []);

  const loadBatteryStatus = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const battery = await window.electronAPI.getBatteryStatus();
      setBatteryInfo(battery);
    } catch (error) {
      console.error('Failed to load battery status:', error);
    }
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  const getUsageColor = (percent: number) => {
    if (percent < 50) return '#27ae60';
    if (percent < 80) return '#f39c12';
    return '#e74c3c';
  };

  const formatDiskSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${Math.round(gb)} GB`;
  };

  const getOSDisplayName = () => {
    if (!stats?.platform) return '未知';
    const platform = stats.platform;
    const release = stats.release || '';
    
    if (platform === 'win32') {
      const versionMap: { [key: string]: string } = {
        '10.0': 'Windows 10/11',
        '6.3': 'Windows 8.1',
        '6.2': 'Windows 8',
        '6.1': 'Windows 7'
      };
      const version = Object.keys(versionMap).find(v => release.startsWith(v)) || 'Windows';
      return `${version} (${stats.arch === 'x64' ? '64 位' : '32 位'})`;
    }
    return platform;
  };

  const getCPUModel = () => {
    return stats?.gpu?.[0]?.name || '未知 CPU';
  };

  const getGPUName = () => {
    if (!stats?.gpu || stats.gpu.length === 0) return '未知';
    return stats.gpu.map((g: any) => g.name).join(', ');
  };

  return (
    <div>
      <div className="header">
        <h2 style={{ marginBottom: '15px' }}>🏠 系统概览</h2>
      </div>

      {/* 基本信息卡片 */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Home size={20} color="var(--primary-color)" />
          基本信息
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Shield size={24} color="var(--primary-color)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>计算机名</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats?.hostname || '加载中...'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Server size={24} color="var(--accent-color)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>操作系统</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{getOSDisplayName()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Cpu size={24} color="var(--danger-color)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>处理器</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats?.cpuCount || 0} 核心</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Database size={24} color="var(--warning-color)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>内存</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{Math.round((stats?.totalMemory || 0) / (1024 * 1024 * 1024))} GB</div>
            </div>
          </div>
        </div>
      </div>

      {/* 硬件详情 */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Monitor size={20} color="var(--secondary-color)" />
          硬件详情
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Cpu size={20} color="var(--primary-color)" />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>CPU 型号</span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', paddingLeft: '30px' }}>
              {getCPUModel()}
            </div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Monitor size={20} color="var(--accent-color)" />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>GPU 显卡</span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', paddingLeft: '30px' }}>
              {getGPUName()}
            </div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <HardDrive size={20} color="var(--danger-color)" />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>磁盘存储</span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', paddingLeft: '30px' }}>
              {diskInfo.length > 0 ? (
                diskInfo.map((disk, index) => (
                  <div key={index} style={{ marginBottom: index < diskInfo.length - 1 ? '4px' : 0 }}>
                    {disk.name}: {formatDiskSize(disk.size)} (可用：{formatDiskSize(disk.freeSpace)})
                  </div>
                ))
              ) : (
                '加载中...'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 实时状态 */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--danger-color)" />
          实时状态
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={16} color="var(--primary-color)" />
                CPU 使用率
              </span>
              <span style={{ fontWeight: '600', color: getUsageColor(systemUsage?.cpu || 0) }}>{systemUsage?.cpu || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${systemUsage?.cpu || 0}%`,
                  background: getUsageColor(systemUsage?.cpu || 0)
                }} 
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} color="var(--accent-color)" />
                内存使用率
              </span>
              <span style={{ fontWeight: '600', color: getUsageColor(systemUsage?.memory || 0) }}>{systemUsage?.memory || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${systemUsage?.memory || 0}%`,
                  background: getUsageColor(systemUsage?.memory || 0)
                }} 
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              已用：{Math.round(((systemUsage?.totalMemory - systemUsage?.freeMemory) || 0) / (1024 * 1024 * 1024))} GB / 总共：{Math.round((systemUsage?.totalMemory || 0) / (1024 * 1024 * 1024))} GB
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={16} color="var(--danger-color)" />
                磁盘活动
              </span>
              <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                读取：{diskUsage.read.toFixed(1)} KB/s  写入：{diskUsage.write.toFixed(1)} KB/s
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(diskUsage.read / 2, 100)}%`, height: '100%', background: 'var(--danger-color)', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(diskUsage.write / 2, 100)}%`, height: '100%', background: 'var(--warning-color)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wifi size={16} color="var(--warning-color)" />
                网络速度
              </span>
              <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                ↑ {networkInfo.upload.toFixed(1)} KB/s  ↓ {networkInfo.download.toFixed(1)} KB/s
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(networkInfo.upload / 2, 100)}%`, height: '100%', background: 'var(--secondary-color)', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(networkInfo.download / 5, 100)}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
          {batteryInfo && batteryInfo.present && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {batteryInfo.isCharging ? <BatteryCharging size={16} color="var(--accent-color)" /> : <Battery size={16} color="var(--warning-color)" />}
                  电池状态
                </span>
                <span style={{ fontWeight: '600', color: batteryInfo.isCharging ? 'var(--accent-color)' : batteryInfo.percent < 20 ? 'var(--danger-color)' : 'var(--primary-color)' }}>
                  {batteryInfo.percent}% {batteryInfo.status}
                </span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${batteryInfo.percent}%`,
                    background: batteryInfo.isCharging ? 'var(--accent-color)' : batteryInfo.percent < 20 ? 'var(--danger-color)' : batteryInfo.percent < 50 ? 'var(--warning-color)' : 'var(--primary-color)'
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {batteryInfo.isCharging && '⚡ 充电中'}
                  {batteryInfo.isFull && '✓ 已充满'}
                  {batteryInfo.isDischarging && '🔋 放电中'}
                  {!batteryInfo.isCharging && !batteryInfo.isFull && !batteryInfo.isDischarging && batteryInfo.status}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  剩余时间：{batteryInfo.remainingTime}
                </span>
              </div>
              {batteryInfo.health < 100 && (
                <div style={{ fontSize: '11px', color: 'var(--warning-color)', marginTop: '4px' }}>
                  电池健康度：{batteryInfo.health}%
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 运行时间 */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
        <div className="stat-card" style={{ padding: '18px', background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <Clock size={28} color="white" />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>系统运行时间</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats ? formatUptime(stats.uptime) : '--'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            自上次启动以来的时间
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
