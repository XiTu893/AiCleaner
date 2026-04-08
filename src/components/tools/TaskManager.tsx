import React, { useState, useEffect } from 'react';
import { Activity, Search, X, RefreshCw, AlertTriangle } from 'lucide-react';

interface Process {
  name: string;
  pid: number;
  memory: number;
  parentPid: number;
}

const TaskManager: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'memory'>('memory');
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  const loadProcesses = async () => {
    try {
      const processList = await window.electronAPI.getProcessList();
      setProcesses(processList);
      setLoading(false);
    } catch (error) {
      console.error('加载进程列表失败:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKillProcess = async (pid: number) => {
    if (!confirm(`确定要终止进程 ${pid} 吗？\n\n注意：终止系统进程可能导致系统不稳定！`)) {
      return;
    }

    try {
      const result = await window.electronAPI.killProcess(pid);
      if (result.success) {
        alert(`✅ 进程 ${pid} 已终止`);
        loadProcesses();
      } else {
        alert(`❌ 终止失败：${result.error}`);
      }
    } catch (error) {
      alert(`❌ 终止进程失败：${error}`);
    }
  };

  const filteredProcesses = processes.filter(process =>
    process.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    if (sortBy === 'memory') {
      return b.memory - a.memory;
    }
    return a.name.localeCompare(b.name);
  });

  const formatMemory = (bytes: number): string => {
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(2)} GB`;
    } else if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  const getTotalMemory = (): number => {
    return processes.reduce((sum, p) => sum + p.memory, 0);
  };

  const topProcesses = [...processes].sort((a, b) => b.memory - a.memory).slice(0, 5);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">正在加载进程列表...</p>
      </div>
    );
  }

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>
            <Activity size={20} style={{ display: 'inline', marginRight: '8px' }} />
            进程管理 ({processes.length} 个进程)
          </h3>
          <button className="primary-button" onClick={loadProcesses}>
            <RefreshCw size={18} />
            刷新
          </button>
        </div>

        {/* 内存使用概览 */}
        <div className="scan-summary" style={{ marginBottom: '20px' }}>
          <div className="summary-item">
            <Activity size={20} color="#3498db" />
            <span>
              总内存占用：<strong>{formatMemory(getTotalMemory())}</strong>
            </span>
          </div>
          <div className="summary-item">
            <span>
              进程数量：<strong>{processes.length}</strong>
            </span>
          </div>
        </div>

        {/* 内存占用 Top5 */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f4f8', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '10px' }}>
            📊 内存占用 Top 5
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topProcesses.map((process, index) => (
              <div key={process.pid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    background: index === 0 ? '#f39c12' : index === 1 ? '#bdc3c7' : index === 2 ? '#cd7f32' : '#ecf0f1',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: index < 3 ? 'white' : '#7f8c8d'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: '13px', color: '#2c3e50' }}>{process.name}</span>
                </div>
                <span style={{ fontSize: '13px', color: '#7f8c8d' }}>{formatMemory(process.memory)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 搜索框 */}
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="搜索进程名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 排序选项 */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <button
            className={`secondary-button ${sortBy === 'memory' ? 'active' : ''}`}
            onClick={() => setSortBy('memory')}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            按内存排序
          </button>
          <button
            className={`secondary-button ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => setSortBy('name')}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            按名称排序
          </button>
        </div>

        {/* 进程列表 */}
        {sortedProcesses.length === 0 ? (
          <div className="empty-state">
            <Search size={64} color="#bdc3c7" />
            <h3>未找到匹配的进程</h3>
            <p>请尝试其他搜索关键词</p>
          </div>
        ) : (
          <div className="driver-list" style={{ marginTop: '15px' }}>
            {sortedProcesses.map((process) => (
              <div key={process.pid} className="driver-item">
                <div className="driver-info">
                  <div className="driver-header">
                    <span className="driver-name">{process.name}</span>
                    <span style={{ fontSize: '12px', color: '#95a5a6' }}>PID: {process.pid}</span>
                  </div>
                  <div className="driver-details">
                    <span>内存：{formatMemory(process.memory)}</span>
                    {process.parentPid > 0 && (
                      <span>父进程：{process.parentPid}</span>
                    )}
                  </div>
                </div>
                <button
                  className="icon-button"
                  onClick={() => handleKillProcess(process.pid)}
                  title="终止进程"
                  style={{ 
                    color: '#e74c3c',
                    borderColor: '#e74c3c'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>⚠️ 进程管理提示</h4>
        <ul>
          <li>终止系统进程可能导致系统不稳定或程序崩溃</li>
          <li>建议仅终止您了解的应用程序进程</li>
          <li>某些进程可能会自动重启</li>
          <li>如遇恶意软件，建议使用专业杀毒软件处理</li>
        </ul>
      </div>
    </div>
  );
};

export default TaskManager;
