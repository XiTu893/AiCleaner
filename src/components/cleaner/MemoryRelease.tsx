import React, { useState, useEffect } from 'react';
import { Activity, Zap, Check, RefreshCw, Cpu, HardDrive, Database, Trash2, X } from 'lucide-react';

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
}

const MemoryRelease: React.FC = () => {
  const [releasing, setReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const [memoryBefore, setMemoryBefore] = useState<MemoryStats | null>(null);
  const [memoryAfter, setMemoryAfter] = useState<MemoryStats | null>(null);
  const [releasedSize, setReleasedSize] = useState(0);
  const [releaseCount, setReleaseCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'release' | 'processes' | 'optimize' | 'history'>('release');
  const [processList, setProcessList] = useState<ProcessInfo[]>([]);
  const [processLoading, setProcessLoading] = useState(false);
  const [processScanned, setProcessScanned] = useState(false); // 是否已扫描过进程

  useEffect(() => {
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

  const loadProcessList = async () => {
    console.log('开始加载进程列表...');
    setProcessLoading(true);
    try {
      console.log('调用 getProcessList API');
      const processes = await window.electronAPI.getProcessList();
      if (processes) {
        console.log('设置进程列表，数量:', processes.length);
        setProcessList(processes);
      }
      setProcessScanned(true); // 标记已扫描
    } catch (error) {
      console.error('加载进程列表失败:', error);
      setProcessScanned(true); // 失败也标记已扫描
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
        loadProcessList(); // 刷新列表
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
        setReleased(true);
      } else {
        alert('内存释放失败：' + result.message);
      }
    } catch (error) {
      console.error('内存释放失败:', error);
      alert('内存释放失败：' + (error as Error).message);
    } finally {
      setReleasing(false);
    }
  };

  const reset = () => {
    setReleased(false);
    setMemoryAfter(null);
    loadMemoryInfo();
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'history':
        return releaseCount;
      default:
        return 0;
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <Activity size={20} />
          内存释放
        </div>

        {/* 标签页导航 - 始终显示 */}
        <div style={{ display: 'flex', gap: '0px', marginTop: '20px', borderBottom: '2px solid #e0e0e0' }}>
          {[
            { key: 'release', label: '内存释放' },
            { key: 'processes', label: '进程列表' },
            { key: 'optimize', label: '优化建议' },
            { key: 'history', label: '释放记录' }
          ].map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '3px solid #3498db' : '3px solid transparent',
                color: activeTab === tab.key ? '#3498db' : '#7f8c8d',
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
              {tab.key === 'processes' && processLoading && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '0px',
                  background: '#3498db',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  transform: 'translateX(50%)',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}>
                  扫描中...
                </span>
              )}
              {tab.key === 'processes' && !processLoading && processScanned && processList.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '0px',
                  background: '#e74c3c',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  transform: 'translateX(50%)'
                }}>
                  {processList.length}
                </span>
              )}
              {tab.key === 'processes' && !processLoading && processScanned && processList.length === 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '0px',
                  background: '#95a5a6',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  transform: 'translateX(50%)'
                }}>
                  0
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 标签页内容区域 */}
        {activeTab === 'release' && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginTop: '20px'
          }}>
            {!released ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Activity size={64} color="#9b59b6" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '10px' }}>智能内存释放</h3>
                <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                  一键释放内存，提升系统运行速度
                </p>
                
                {memoryBefore && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '40px', 
                    marginBottom: '20px',
                    padding: '20px',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>总内存</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                        {memoryBefore.totalGB} GB
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px solid #dfe6e9', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>已使用</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
                        {memoryBefore.usedGB} GB
                      </div>
                      <div style={{ fontSize: '14px', color: '#e74c3c', marginTop: '5px' }}>
                        {memoryBefore.percent}%
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px solid #dfe6e9', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>空闲</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
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
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60', marginBottom: '10px' }}>
                  ✓ 释放完成
                </div>
                
                <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginTop: '20px' }}>
                  {memoryBefore && (
                    <>
                      <div>
                        <div style={{ fontSize: '13px', color: '#7f8c8d' }}>释放前</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
                          {memoryBefore.usedGB} GB
                        </div>
                        <div style={{ fontSize: '14px', color: '#e74c3c', marginTop: '5px' }}>
                          {memoryBefore.percent}%
                        </div>
                      </div>
                      
                      <div style={{ borderLeft: '2px solid #ecf0f1', paddingLeft: '30px' }}>
                        <div style={{ fontSize: '13px', color: '#7f8c8d' }}>已释放</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>
                          {releasedSize.toFixed(2)} GB
                        </div>
                      </div>
                      
                      {memoryAfter && (
                        <div style={{ borderLeft: '2px solid #ecf0f1', paddingLeft: '30px' }}>
                          <div style={{ fontSize: '13px', color: '#7f8c8d' }}>释放后</div>
                          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                            {memoryAfter.usedGB} GB
                          </div>
                          <div style={{ fontSize: '14px', color: '#27ae60', marginTop: '5px' }}>
                            {memoryAfter.percent}%
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={reset} style={{ padding: '8px 20px', fontSize: '13px' }}>
                    再次释放
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'processes' && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginTop: '20px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>内存状态</div>
            {memoryBefore && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
                  <Cpu size={32} color="#3498db" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
                    {memoryBefore.totalGB} GB
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>总内存</div>
                </div>
                <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
                  <Activity size={32} color="#e74c3c" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
                    {memoryBefore.usedGB} GB
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>已使用</div>
                </div>
                <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
                  <HardDrive size={32} color="#27ae60" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
                    {memoryBefore.freeGB} GB
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>空闲</div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>进程列表</div>
                {processLoading && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#3498db',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                    扫描中...
                  </span>
                )}
                {!processLoading && processScanned && (
                  <span style={{ fontSize: '12px', color: '#27ae60' }}>
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
            <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '10px' }}>
              共 {processList.length} 个进程，按内存使用排序
            </div>
            {processLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#7f8c8d' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', margin: '0 auto 20px' }}></div>
                <div>正在扫描进程...</div>
                <div style={{ fontSize: '12px', marginTop: '10px' }}>请稍候</div>
              </div>
            ) : processList.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#7f8c8d' }}>
                <Database size={48} style={{ marginBottom: '15px', opacity: 0.3 }} />
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>未找到进程</div>
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
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {processList.map((process) => (
                  <div
                    key={process.pid}
                    style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>{process.name}</span>
                        <span style={{ fontSize: '11px', color: '#95a5a6', background: '#ecf0f1', padding: '2px 6px', borderRadius: '4px' }}>
                          PID: {process.pid}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#7f8c8d' }}>
                        <span style={{ color: '#e74c3c', fontWeight: '500' }}>
                          内存：{formatMemory(process.memory)}
                        </span>
                      </div>
                    </div>
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                      title="结束进程"
                    >
                      <X size={14} />
                      结束
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimize' && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginTop: '20px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>内存优化建议</div>
            <div style={{ lineHeight: '2', color: '#7f8c8d', fontSize: '13px' }}>
              <p>• 定期释放内存可保持系统流畅运行</p>
              <p>• 关闭不需要的浏览器标签页可节省大量内存</p>
              <p>• 减少后台运行的程序数量</p>
              <p>• 如经常内存不足，建议增加物理内存</p>
              <p>• 使用游戏模式可优化内存分配</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginTop: '20px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>释放记录</div>
            {releaseCount > 0 ? (
              <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
                <Check size={20} color="#27ae60" style={{ display: 'inline', marginRight: '8px' }} />
                本次会话已成功释放 {releaseCount} 次内存，保持系统最佳状态
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
                暂无释放记录
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryRelease;
