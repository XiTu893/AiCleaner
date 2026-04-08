import React, { useState, useEffect } from 'react';
import { Zap, Check, Settings, Play, Square, Activity, Cpu, HardDrive, Database, RefreshCw, Power, X } from 'lucide-react';

interface StartupItem {
  id: string;
  name: string;
  command: string;
  location: string;
  enabled: boolean;
  description: string;
  running?: boolean;
  startupType?: 'Auto' | 'Manual' | 'Disabled';
}

interface SystemService {
  id: string;
  name: string;
  displayName: string;
  startMode: string;
  state: string;
  optimized: boolean;
  description: string;
}

interface ProgressData {
  type: 'start' | 'optimizing' | 'complete' | 'error';
  message: string;
  progress: number;
}

interface MemoryStats {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  percent: number;
}

interface ProcessInfo {
  name: string;
  pid: number;
  memory: number;
  parentPid: number;
  path?: string;
}

const OptimizeSpeed: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'startup' | 'service' | 'gamemode' | 'memory'>('startup');
  const [startupItems, setStartupItems] = useState<StartupItem[]>([]);
  const [systemServices, setSystemServices] = useState<SystemService[]>([]);
  const [gameModeEnabled, setGameModeEnabled] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState({
    startupOptimized: 0,
    servicesOptimized: 0,
    memoryReleased: 0,
  });

  const [releasing, setReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const [memoryBefore, setMemoryBefore] = useState<MemoryStats | null>(null);
  const [memoryAfter, setMemoryAfter] = useState<MemoryStats | null>(null);
  const [releasedSize, setReleasedSize] = useState(0);
  const [releaseCount, setReleaseCount] = useState(0);
  
  const [processList, setProcessList] = useState<ProcessInfo[]>([]);
  const [processLoading, setProcessLoading] = useState(false);
  const [processScanned, setProcessScanned] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'memory'>('memory');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [startupSortBy, setStartupSortBy] = useState<'name' | 'type' | 'status'>('name');
  const [startupSortOrder, setStartupSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [serviceSortBy, setServiceSortBy] = useState<'name' | 'status' | 'startMode'>('name');
  const [serviceSortOrder, setServiceSortOrder] = useState<'asc' | 'desc'>('asc');

  const [startupLoading, setStartupLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(true);

  useEffect(() => {
    loadStartupItems();
    loadSystemServices();
    loadGameModeStatus();
    loadMemoryInfo();
    loadProcessList();
  }, []);

  const loadMemoryInfo = async () => {
    try {
      const usage = await window.electronAPI.getSystemUsage();
      if (usage) {
        const totalMemory = typeof usage.totalMemory === 'number' ? usage.totalMemory : 0;
        const freeMemory = typeof usage.freeMemory === 'number' ? usage.freeMemory : 0;
        const usedMemory = totalMemory - freeMemory;
        const percent = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;
        
        setMemoryBefore({
          totalGB: parseFloat((totalMemory / 1024 / 1024 / 1024).toFixed(2)),
          usedGB: parseFloat((usedMemory / 1024 / 1024 / 1024).toFixed(2)),
          freeGB: parseFloat((freeMemory / 1024 / 1024 / 1024).toFixed(2)),
          percent: percent,
        });
      }
    } catch (error) {
      console.error('加载内存信息失败:', error);
    }
  };

  const releaseMemory = async () => {
    setReleasing(true);
    
    try {
      const result = await window.electronAPI.releaseMemory();
      
      if (result.success) {
        const usage = await window.electronAPI.getSystemUsage();
        if (usage) {
          const totalMemory = typeof usage.totalMemory === 'number' ? usage.totalMemory : 0;
          const freeMemory = typeof usage.freeMemory === 'number' ? usage.freeMemory : 0;
          const usedMemory = totalMemory - freeMemory;
          const percent = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;
          
          setMemoryAfter({
            totalGB: parseFloat((totalMemory / 1024 / 1024 / 1024).toFixed(2)),
            usedGB: parseFloat((usedMemory / 1024 / 1024 / 1024).toFixed(2)),
            freeGB: parseFloat((freeMemory / 1024 / 1024 / 1024).toFixed(2)),
            percent: percent,
          });
          
          if (memoryBefore) {
            const released = memoryBefore.usedGB - parseFloat((usedMemory / 1024 / 1024 / 1024).toFixed(2));
            setReleasedSize(released > 0 ? released : 0);
          }
        }
        
        setReleaseCount(prev => prev + 1);
        setOptimizationStats(prev => ({
          ...prev,
          memoryReleased: prev.memoryReleased + 1,
        }));
        setReleased(true);
      }
    } catch (error) {
      console.error('内存释放失败:', error);
    } finally {
      setReleasing(false);
    }
  };

  const resetRelease = () => {
    setReleased(false);
    setMemoryAfter(null);
    loadMemoryInfo();
  };

  const loadProcessList = async () => {
    console.log('开始加载进程列表...');
    setProcessLoading(true);
    try {
      console.log('调用 getProcessList API');
      const processes = await window.electronAPI.getProcessList();
      console.log('进程列表结果:', processes);
      if (processes) {
        console.log('设置进程列表，数量:', processes.length);
        setProcessList(processes);
        setProcessScanned(true);
      } else {
        console.log('进程列表结果为空');
        setProcessScanned(true);
      }
    } catch (error) {
      console.error('加载进程列表失败:', error);
      setProcessScanned(true);
    } finally {
      setProcessLoading(false);
    }
  };

  const handleKillProcess = async (processId: number, processName: string) => {
    if (!confirm(`确定要结束进程 ${processName} (PID: ${processId}) 吗？\n\n注意：结束系统关键进程可能导致系统不稳定。`)) {
      return;
    }
    
    try {
      const result = await window.electronAPI.killProcess(processId);
      if (result.success) {
        alert(`进程 ${processName} 已结束`);
        loadProcessList();
      } else {
        alert(`结束进程失败：${result.message}`);
      }
    } catch (error) {
      console.error('结束进程失败:', error);
      alert(`结束进程失败：${(error as Error).message}`);
    }
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const getSortedProcessList = () => {
    const sorted = [...processList];
    sorted.sort((a, b) => {
      if (sortBy === 'memory') {
        return sortOrder === 'desc' ? b.memory - a.memory : a.memory - b.memory;
      } else {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (sortOrder === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      }
    });
    return sorted;
  };

  const toggleSort = (field: 'name' | 'memory') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'memory' ? 'desc' : 'asc');
    }
  };

  const getSortedStartupItems = () => {
    const sorted = [...startupItems];
    sorted.sort((a, b) => {
      if (startupSortBy === 'name') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return startupSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (startupSortBy === 'type') {
        const typeOrder = { 'Auto': 0, 'Manual': 1, 'Disabled': 2 };
        const typeA = typeOrder[a.startupType || 'Manual'];
        const typeB = typeOrder[b.startupType || 'Manual'];
        return startupSortOrder === 'asc' ? typeA - typeB : typeB - typeA;
      } else {
        const statusA = a.running ? 0 : 1;
        const statusB = b.running ? 0 : 1;
        return startupSortOrder === 'asc' ? statusA - statusB : statusB - statusA;
      }
    });
    return sorted;
  };

  const toggleStartupSort = (field: 'name' | 'type' | 'status') => {
    if (startupSortBy === field) {
      setStartupSortOrder(startupSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStartupSortBy(field);
      setStartupSortOrder('asc');
    }
  };

  const getSortedSystemServices = () => {
    const sorted = [...systemServices];
    sorted.sort((a, b) => {
      if (serviceSortBy === 'name') {
        const nameA = a.displayName.toLowerCase();
        const nameB = b.displayName.toLowerCase();
        return serviceSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (serviceSortBy === 'startMode') {
        const modeOrder: { [key: string]: number } = { 'Auto': 0, 'Manual': 1, 'Disabled': 2 };
        const modeA = modeOrder[a.startMode || 'Manual'] || 1;
        const modeB = modeOrder[b.startMode || 'Manual'] || 1;
        return serviceSortOrder === 'asc' ? modeA - modeB : modeB - modeA;
      } else {
        const statusA = a.state === 'Running' ? 0 : 1;
        const statusB = b.state === 'Running' ? 0 : 1;
        return serviceSortOrder === 'asc' ? statusA - statusB : statusB - statusA;
      }
    });
    return sorted;
  };

  const toggleServiceSort = (field: 'name' | 'status' | 'startMode') => {
    if (serviceSortBy === field) {
      setServiceSortOrder(serviceSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setServiceSortBy(field);
      setServiceSortOrder('asc');
    }
  };

  const loadStartupItems = async () => {
    try {
      const result = await window.electronAPI.getStartupItems();
      const items = result?.items || result || [];
      console.log('加载启动项:', items.length, '个');
      setStartupItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('加载启动项失败:', error);
      setStartupItems([]);
    } finally {
      setStartupLoading(false);
    }
  };

  const loadSystemServices = async () => {
    try {
      const result = await window.electronAPI.getSystemServices();
      const services = result?.services || result || [];
      console.log('加载系统服务:', services.length, '个');
      setSystemServices(Array.isArray(services) ? services : []);
    } catch (error) {
      console.error('加载系统服务失败:', error);
      setSystemServices([]);
    } finally {
      setServiceLoading(false);
    }
  };

  const loadGameModeStatus = async () => {
    try {
      const status = await window.electronAPI.getGameModeStatus();
      setGameModeEnabled(status || false);
    } catch (error) {
      console.error('加载游戏模式状态失败:', error);
    }
  };

  const toggleStartupItem = async (item: StartupItem, enable: boolean) => {
    try {
      const result = await window.electronAPI.toggleStartupItem(item, enable);
      if (result.success) {
        setStartupItems(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safePrev.map(i => 
            i.id === item.id ? { ...i, enabled: enable } : i
          );
        });
        setOptimizationStats(prev => ({
          ...prev,
          startupOptimized: prev.startupOptimized + 1,
        }));
      }
    } catch (error) {
      console.error('切换启动项失败:', error);
    }
  };

  const optimizeService = async (service: SystemService, mode: string) => {
    try {
      const result = await window.electronAPI.optimizeService(service.name, mode);
      if (result.success) {
        setSystemServices(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safePrev.map(s =>
            s.id === service.id ? { ...s, startMode: mode, optimized: true } : s
          );
        });
        setOptimizationStats(prev => ({
          ...prev,
          servicesOptimized: prev.servicesOptimized + 1,
        }));
      }
    } catch (error) {
      console.error('优化服务失败:', error);
    }
  };

  const toggleService = async (service: SystemService, enable: boolean) => {
    const newMode = enable ? 'Auto' : 'Manual';
    await optimizeService(service, newMode);
  };

  const handleServiceStart = async (service: SystemService) => {
    try {
      const result = await window.electronAPI.startService(service.name);
      if (result.success) {
        setSystemServices(prev => prev.map(s =>
          s.id === service.id ? { ...s, state: 'Running' } : s
        ));
      }
    } catch (error) {
      console.error('启动服务失败:', error);
      alert('启动服务失败：' + (error as Error).message);
    }
  };

  const handleServiceStop = async (service: SystemService) => {
    try {
      const result = await window.electronAPI.stopService(service.name);
      if (result.success) {
        setSystemServices(prev => prev.map(s =>
          s.id === service.id ? { ...s, state: 'Stopped' } : s
        ));
      }
    } catch (error) {
      console.error('停止服务失败:', error);
      alert('停止服务失败：' + (error as Error).message);
    }
  };

  const handleServiceDelete = async (service: SystemService) => {
    if (!confirm(`确定要删除服务 "${service.displayName}" 吗？\n\n警告：删除服务可能导致系统不稳定！`)) {
      return;
    }
    try {
      const result = await window.electronAPI.deleteService(service.name);
      if (result.success) {
        setSystemServices(prev => prev.filter(s => s.id !== service.id));
      } else {
        alert('删除服务失败：' + (result as any).error);
      }
    } catch (error) {
      console.error('删除服务失败:', error);
      alert('删除服务失败：' + (error as Error).message);
    }
  };

  const handleStartupEnable = async (item: StartupItem) => {
    try {
      const result = await window.electronAPI.setStartupItemType(item, 'Auto');
      if (result.success) {
        setStartupItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, enabled: true, startupType: 'Auto' } : i
        ));
      }
    } catch (error) {
      console.error('设为自动启动失败:', error);
      alert('设为自动启动失败：' + (error as Error).message);
    }
  };

  const handleStartupSetManual = async (item: StartupItem) => {
    try {
      const result = await window.electronAPI.setStartupItemType(item, 'Manual');
      if (result.success) {
        setStartupItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, enabled: true, startupType: 'Manual' } : i
        ));
      }
    } catch (error) {
      console.error('设为手动启动失败:', error);
      alert('设为手动启动失败：' + (error as Error).message);
    }
  };

  const handleStartupDisable = async (item: StartupItem) => {
    try {
      const result = await window.electronAPI.setStartupItemType(item, 'Disabled');
      if (result.success) {
        setStartupItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, enabled: false, startupType: 'Disabled' } : i
        ));
      }
    } catch (error) {
      console.error('禁用启动项失败:', error);
      alert('禁用失败：' + (error as Error).message);
    }
  };

  const handleStartupRun = async (item: StartupItem) => {
    try {
      const result = await window.electronAPI.runStartupItem(item);
      if (result.success) {
        setStartupItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, running: true } : i
        ));
        alert(`已启动：${item.name}`);
      } else {
        alert('启动失败：' + (result as any).error);
      }
    } catch (error) {
      console.error('启动项运行失败:', error);
      alert('启动失败：' + (error as Error).message);
    }
  };

  const handleStartupStop = async (item: StartupItem) => {
    if (!confirm(`确定要停止 "${item.name}" 的进程吗？\n\n这可能会导致未保存的数据丢失！`)) {
      return;
    }
    try {
      const result = await window.electronAPI.stopStartupItem(item);
      if (result.success) {
        setStartupItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, running: false } : i
        ));
        alert(`已停止：${item.name}`);
      } else {
        alert('停止失败：' + (result as any).error);
      }
    } catch (error) {
      console.error('启动项停止失败:', error);
      alert('停止失败：' + (error as Error).message);
    }
  };

  const toggleGameMode = async (enable: boolean) => {
    try {
      const result = await window.electronAPI.toggleGameMode(enable);
      if (result.success) {
        setGameModeEnabled(enable);
      }
    } catch (error) {
      console.error('切换游戏模式失败:', error);
    }
  };

  const startOptimization = async () => {
    setOptimizing(true);
    setShowProgress(true);
    setProgress({
      type: 'start',
      message: '开始系统优化...',
      progress: 0,
    });

    try {
      setProgress({
        type: 'optimizing',
        message: '正在优化开机启动项...',
        progress: 25,
      });

      const safeStartupItems = Array.isArray(startupItems) ? startupItems : [];
      for (const item of safeStartupItems) {
        if (item.enabled && !item.location.includes('Windows')) {
          await toggleStartupItem(item, false);
        }
      }

      setProgress({
        type: 'optimizing',
        message: '正在优化系统服务...',
        progress: 50,
      });

      const safeSystemServices = Array.isArray(systemServices) ? systemServices : [];
      const servicesToOptimize = safeSystemServices.filter(s => 
        s.startMode === 'Auto' && !s.name.includes('Windows') && !s.name.includes('System')
      );
      
      for (const service of servicesToOptimize.slice(0, 5)) {
        await optimizeService(service, 'Manual');
      }

      setProgress({
        type: 'optimizing',
        message: '正在释放内存...',
        progress: 75,
      });

      const memoryResult = await window.electronAPI.releaseMemory();
      if (memoryResult.success) {
        setOptimizationStats(prev => ({
          ...prev,
          memoryReleased: prev.memoryReleased + 1,
        }));
        setReleaseCount(prev => prev + 1);
      }

      setProgress({
        type: 'complete',
        message: '系统优化完成！',
        progress: 100,
      });

      setOptimized(true);
    } catch (error) {
      console.error('优化失败:', error);
      setProgress({
        type: 'error',
        message: '优化失败：' + (error as Error).message,
        progress: 0,
      });
    } finally {
      setOptimizing(false);
    }
  };

  const getOptimizedCount = () => {
    const safeStartupItems = Array.isArray(startupItems) ? startupItems : [];
    const safeSystemServices = Array.isArray(systemServices) ? systemServices : [];
    return safeStartupItems.filter(i => !i.enabled).length + 
           safeSystemServices.filter(s => s.optimized).length;
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'startup':
        return Array.isArray(startupItems) ? startupItems.length : 0;
      case 'service':
        return Array.isArray(systemServices) ? systemServices.length : 0;
      case 'memory':
        return releaseCount;
      default:
        return 0;
    }
  };

  return (
    <div>
      {optimized ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success-color)', marginBottom: '10px' }}>
            ✓ 优化完成
          </div>
          <div style={{ fontSize: '24px', color: 'var(--text-secondary)', margin: '20px 0' }}>
            已优化 {getOptimizedCount()} 项
          </div>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
            <div style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', minWidth: '150px', borderLeft: '3px solid var(--success-color)' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                {optimizationStats.startupOptimized}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>启动项已禁用</div>
            </div>
            <div style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', minWidth: '150px', borderLeft: '3px solid var(--primary-color)' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {optimizationStats.servicesOptimized}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>服务已优化</div>
            </div>
            <div style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', minWidth: '150px', borderLeft: '3px solid var(--info-color)' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--info-color)' }}>
                {optimizationStats.memoryReleased}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>内存已释放</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setOptimized(false)} style={{ marginTop: '30px', padding: '8px 20px', fontSize: '13px' }}>
            返回
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px' }}>
          <Zap size={64} color="var(--warning-color)" style={{ marginBottom: '15px' }} />
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '10px' }}>系统优化加速</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>优化系统配置，提升运行速度</p>
          <button className="btn btn-primary" onClick={startOptimization} disabled={optimizing} style={{ padding: '8px 20px', fontSize: '14px' }}>
            {optimizing ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div>
                优化中...
              </>
            ) : (
              <>
                <Zap size={20} />
                一键优化
              </>
            )}
          </button>
        </div>
      )}

      {showProgress && progress && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            {optimizing ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid var(--warning-color)',
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <Check size={20} color="var(--success-color)" />
            )}
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
              {progress.message}
            </h3>
          </div>

          <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--bg-tertiary)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${progress.progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--warning-color), var(--success-color))',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>{progress.message}</span>
            <span>{progress.progress}%</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <Settings size={20} />
          优化项目
        </div>

        <div style={{ display: 'flex', gap: '0px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
          {[
            { key: 'startup', label: '启动项管理', count: getTabCount('startup') },
            { key: 'service', label: '系统服务', count: getTabCount('service') },
            { key: 'gamemode', label: '游戏模式', count: gameModeEnabled ? 1 : 0 },
            { key: 'memory', label: '内存释放', count: getTabCount('memory') }
          ].map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === tab.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '0px',
                  background: 'var(--danger-color)',
                  color: 'var(--text-light)',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  transform: 'translateX(50%)'
                }}>
                  {tab.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {activeTab === 'startup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {startupLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                正在加载启动项...
              </div>
            ) : startupItems.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                未找到启动项
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  共 {getSortedStartupItems().length} 个启动项，{getSortedStartupItems().filter((i) => i.enabled).length} 个已启用
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 200px',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}>
                  <div 
                    onClick={() => toggleStartupSort('name')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    名称
                    {startupSortBy === 'name' && (startupSortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div 
                    onClick={() => toggleStartupSort('type')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    类型
                    {startupSortBy === 'type' && (startupSortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div 
                    onClick={() => toggleStartupSort('status')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    状态
                    {startupSortBy === 'status' && (startupSortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    操作
                  </div>
                </div>
                
                {getSortedStartupItems().map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 200px',
                      gap: '10px',
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      alignItems: 'center',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{item.name}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.location}</div>
                    </div>
                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: item.startupType === 'Auto' ? 'var(--success-color-light)' : item.startupType === 'Manual' ? 'var(--warning-color-light)' : 'var(--danger-color-light)',
                        color: item.startupType === 'Auto' ? 'var(--success-color)' : item.startupType === 'Manual' ? 'var(--warning-color)' : 'var(--danger-color)',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.startupType === 'Auto' ? '自动' : item.startupType === 'Manual' ? '手动' : '禁用'}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: item.running ? 'var(--success-color-light)' : 'var(--bg-tertiary)',
                        color: item.running ? 'var(--success-color)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.running ? '运行中' : '未运行'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          if (item.startupType !== 'Auto') {
                            handleStartupEnable(item);
                          }
                        }}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: item.startupType === 'Auto' ? 'var(--success-color)' : 'var(--bg-tertiary)',
                          color: item.startupType === 'Auto' ? 'var(--text-light)' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="设为自动启动"
                      >
                        {item.startupType === 'Auto' && '✓ '}自动
                      </button>
                      <button
                        onClick={() => {
                          if (item.startupType !== 'Manual') {
                            handleStartupSetManual(item);
                          }
                        }}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: item.startupType === 'Manual' ? 'var(--warning-color)' : 'var(--bg-tertiary)',
                          color: item.startupType === 'Manual' ? 'var(--text-light)' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="设为手动启动"
                      >
                        {item.startupType === 'Manual' && '✓ '}手动
                      </button>
                      <button
                        onClick={() => {
                          if (item.startupType !== 'Disabled') {
                            handleStartupDisable(item);
                          }
                        }}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: item.startupType === 'Disabled' ? 'var(--danger-color)' : 'var(--bg-tertiary)',
                          color: item.startupType === 'Disabled' ? 'var(--text-light)' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="禁止启动"
                      >
                        {item.startupType === 'Disabled' && '✓ '}禁用
                      </button>
                      {item.running ? (
                        <button
                          onClick={() => handleStartupStop(item)}
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: 'var(--danger-color)',
                            color: 'var(--text-light)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="停止进程"
                        >
                          <Power size={12} />
                          停止
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartupRun(item)}
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: 'var(--success-color)',
                            color: 'var(--text-light)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="立即启动"
                        >
                          <Play size={12} />
                          启动
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'service' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {serviceLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                正在加载系统服务...
              </div>
            ) : systemServices.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                未找到系统服务
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  共 {getSortedSystemServices().slice(0, 50).length} 个服务（显示前 50 个）
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 200px',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}>
                  <div 
                    onClick={() => toggleServiceSort('name')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    名称
                    {serviceSortBy === 'name' && (serviceSortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div 
                    onClick={() => toggleServiceSort('startMode')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    类型
                    {serviceSortBy === 'startMode' && (serviceSortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div 
                    onClick={() => toggleServiceSort('status')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    状态
                    {serviceSortBy === 'status' && (serviceSortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    操作
                  </div>
                </div>
                
                {getSortedSystemServices().slice(0, 50).map((service) => (
                  <div
                    key={service.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 200px',
                      gap: '10px',
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      alignItems: 'center',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>{service.displayName}</span>
                      </div>
                      {service.description && service.description !== '系统服务' && (
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4', maxHeight: '30px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {service.description.length > 100 ? service.description.substring(0, 100) + '...' : service.description}
                        </div>
                      )}
                    </div>
                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: service.startMode === 'Auto' ? 'var(--success-color-light)' : 'var(--warning-color-light)',
                        color: service.startMode === 'Auto' ? 'var(--success-color)' : 'var(--warning-color)',
                        whiteSpace: 'nowrap'
                      }}>
                        {service.startMode === 'Auto' ? '自动' : service.startMode === 'Manual' ? '手动' : service.startMode}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: service.state === 'Running' ? 'var(--primary-color-light)' : 'var(--info-color-light)',
                        color: service.state === 'Running' ? 'var(--primary-color)' : 'var(--info-color)',
                        whiteSpace: 'nowrap'
                      }}>
                        {service.state === 'Running' ? '运行中' : '已停止'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          if (service.startMode !== 'Auto') {
                            optimizeService(service, 'Auto');
                          }
                        }}
                        style={{ 
                          padding: '3px 6px', 
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: service.startMode === 'Auto' ? 'var(--success-color)' : 'var(--bg-tertiary)',
                          color: service.startMode === 'Auto' ? 'var(--text-light)' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="设为自动启动"
                      >
                        {service.startMode === 'Auto' && '✓ '}自动
                      </button>
                      <button
                        onClick={() => {
                          if (service.startMode !== 'Manual') {
                            optimizeService(service, 'Manual');
                          }
                        }}
                        style={{ 
                          padding: '3px 6px', 
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: service.startMode === 'Manual' ? 'var(--warning-color)' : 'var(--bg-tertiary)',
                          color: service.startMode === 'Manual' ? 'var(--text-light)' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="设为手动启动"
                      >
                        {service.startMode === 'Manual' && '✓ '}手动
                      </button>
                      <button
                        onClick={() => {
                          if (service.startMode !== 'Disabled') {
                            optimizeService(service, 'Disabled');
                          }
                        }}
                        style={{ 
                          padding: '3px 6px', 
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: service.startMode === 'Disabled' ? 'var(--danger-color)' : 'var(--bg-tertiary)',
                          color: service.startMode === 'Disabled' ? 'var(--text-light)' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="禁用服务"
                      >
                        {service.startMode === 'Disabled' && '✓ '}禁用
                      </button>
                      {service.state === 'Running' ? (
                        <button
                          onClick={() => handleServiceStop(service)}
                          style={{ 
                            padding: '3px 6px', 
                            fontSize: '10px',
                            fontWeight: 'bold',
                            background: 'var(--danger-color)',
                            color: 'var(--text-light)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="停止服务"
                        >
                          <Power size={10} />
                          停止
                        </button>
                      ) : (
                        <button
                          onClick={() => handleServiceStart(service)}
                          style={{ 
                            padding: '3px 6px', 
                            fontSize: '10px',
                            fontWeight: 'bold',
                            background: 'var(--success-color)',
                            color: 'var(--text-light)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="启动服务"
                        >
                          <Power size={10} />
                          启动
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'gamemode' && (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
              游戏模式可以优化系统资源分配，提升游戏性能
            </div>
            <button
              className={gameModeEnabled ? 'secondary-button' : 'primary-button'}
              onClick={() => toggleGameMode(!gameModeEnabled)}
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              {gameModeEnabled ? '禁用游戏模式' : '启用游戏模式'}
            </button>
            {gameModeEnabled && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--success-color-light)', borderRadius: '8px' }}>
                <Check size={16} color="var(--success-color)" style={{ display: 'inline', marginRight: '8px' }} />
                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>游戏模式已启用</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'memory' && (
          <div>
            {!released ? (
              <div style={{ padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
                <Activity size={64} color="var(--info-color)" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '10px' }}>智能内存释放</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  一键释放内存，提升系统运行速度
                </p>
                
                {memoryBefore && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '40px', 
                    marginBottom: '20px',
                    padding: '20px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>总内存</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {memoryBefore.totalGB} GB
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>已使用</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                        {memoryBefore.usedGB} GB
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--danger-color)', marginTop: '5px' }}>
                        {memoryBefore.percent}%
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>空闲</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                        {memoryBefore.freeGB} GB
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={releaseMemory}
                    disabled={releasing}
                    style={{ padding: '8px 20px', fontSize: '13px' }}
                  >
                    {releasing ? (
                      <>
                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div>
                        释放中...
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        立即释放
                      </>
                    )}
                  </button>
                  
                  <button 
                    className="secondary-button" 
                    onClick={() => {
                      loadMemoryInfo();
                      loadProcessList();
                    }}
                    style={{ padding: '8px 20px', fontSize: '13px' }}
                  >
                    <RefreshCw size={18} />
                    刷新
                  </button>
                </div>

                {releaseCount > 0 && (
                  <div style={{ marginTop: '20px', fontSize: '13px', color: '#7f8c8d' }}>
                    已执行 {releaseCount} 次内存释放
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success-color)', marginBottom: '10px' }}>
                  ✓ 释放完成
                </div>
                
                <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginTop: '20px' }}>
                  {memoryBefore && (
                    <>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>释放前</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                          {memoryBefore.usedGB} GB
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--danger-color)', marginTop: '5px' }}>
                          {memoryBefore.percent}%
                        </div>
                      </div>
                      
                      <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '30px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>已释放</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                          {releasedSize.toFixed(2)} GB
                        </div>
                      </div>
                      
                      {memoryAfter && (
                        <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '30px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>释放后</div>
                          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                            {memoryAfter.usedGB} GB
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--success-color)', marginTop: '5px' }}>
                            {memoryAfter.percent}%
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={resetRelease} style={{ padding: '8px 20px', fontSize: '13px' }}>
                    再次释放
                  </button>
                </div>
              </div>
            )}

            <div style={{ 
              padding: '20px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)' }}>进程列表</div>
                  {processLoading && (
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                      扫描中...
                    </span>
                  )}
                  {!processLoading && processScanned && (
                    <span style={{ fontSize: '12px', color: 'var(--success-color)' }}>
                      ✓ 已扫描
                    </span>
                  )}
                </div>
                <button 
                  className="secondary-button"
                  onClick={loadProcessList}
                  disabled={processLoading}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <RefreshCw size={14} style={{ marginRight: '4px', display: 'inline' }} />
                  刷新
                </button>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                共 {getSortedProcessList().length} 个进程
              </div>
              {processLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', margin: '0 auto 20px' }}></div>
                  <div>正在扫描进程...</div>
                  <div style={{ fontSize: '12px', marginTop: '10px' }}>请稍候</div>
                </div>
              ) : getSortedProcessList().length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Database size={48} style={{ marginBottom: '15px', opacity: 0.3, color: 'var(--text-secondary)' }} />
                  <div style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>未找到进程</div>
                  <div style={{ fontSize: '13px' }}>可能是扫描失败或没有权限</div>
                  <button 
                    className="btn btn-primary"
                    onClick={loadProcessList}
                    style={{ marginTop: '20px', padding: '8px 20px' }}
                  >
                    重新扫描
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 120px',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    color: 'var(--text-primary)'
                  }}>
                    <div 
                      onClick={() => toggleSort('name')}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      名称
                      {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                    <div 
                      onClick={() => toggleSort('memory')}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      内存
                      {sortBy === 'memory' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      CPU
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      操作
                    </div>
                  </div>
                  
                  {getSortedProcessList().map((process) => (
                    <div
                      key={process.pid}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 120px',
                        gap: '10px',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        alignItems: 'center',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{process.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                            PID: {process.pid}
                          </span>
                        </div>
                        {process.path && (
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: '1.3' }}>
                            {process.path}
                          </div>
                        )}
                      </div>
                      <div style={{ color: 'var(--danger-color)', fontWeight: '500', fontSize: '13px' }}>
                        {formatMemory(process.memory)}
                      </div>
                      <div style={{ color: 'var(--warning-color)', fontSize: '13px' }}>
                        --
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <button
                          className="secondary-button"
                          onClick={() => handleKillProcess(process.pid, process.name)}
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="结束进程"
                        >
                          <X size={14} />
                          结束
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizeSpeed;
