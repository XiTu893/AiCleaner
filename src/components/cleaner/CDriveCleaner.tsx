import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HardDrive, Trash, Folder, ArrowRight, Check, Activity, Move, Search, RotateCcw } from 'lucide-react';

interface CDriveState {
  isScanning: boolean;
  scanProgress: number;
  scanStatus: string;
  currentScanItem: string;
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  folders: Array<{
    name: string;
    path: string;
    size: number;
    sizeGB: string;
  }>;
  largeFiles: Array<{
    name: string;
    sizeMB: string;
    size: number;
    path: string;
    type: string;
    selected: boolean;
    description: string;
    modifiedTime: string;
  }>;
  cleanupItems: Array<{
    name: string;
    path: string;
    type: string;
    description: string;
    size: number;
    sizeMB: string;
    sizeGB: string;
    selected: boolean;
  }>;
  migratableSoftware: Array<{
    name: string;
    path: string;
    size: number;
    sizeMB: string;
    sizeGB: string;
    availableDrives: string[];
    selected: boolean;
  }>;
}

// 子组件：扫描进度条
const ScanProgress = React.memo(({ scanState }: { scanState: CDriveState }) => {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '3px solid var(--danger-color)',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
          {scanState.scanStatus}
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
          width: `${scanState.scanProgress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--danger-color), var(--danger-color-dark))',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {scanState.currentScanItem}
      </div>
    </div>
  );
});

// 子组件：选项卡导航
const TabNavigation = React.memo(({ activeTab, setActiveTab, tabCounts }: { activeTab: string, setActiveTab: (tab: string) => void, tabCounts: { cleanup: number, largefiles: number, software: number } }) => {
  return (
    <div style={{ display: 'flex', gap: '0px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
      {
        [
          { key: 'analysis', label: '空间分析', count: 0 },
          { key: 'cleanup', label: '可清理项', count: tabCounts.cleanup },
          { key: 'largefiles', label: '大文件', count: tabCounts.largefiles },
          { key: 'software', label: '软件迁移', count: tabCounts.software }
        ].map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
        ))
      }
    </div>
  );
});

const CDriveCleaner: React.FC = () => {
  const [cleaning, setCleaning] = useState(false);
  const [cleanedSize, setCleanedSize] = useState(0);
  const [scanState, setScanState] = useState<CDriveState | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [targetDrive, setTargetDrive] = useState('D:');
  const [activeTab, setActiveTab] = useState<'analysis' | 'cleanup' | 'largefiles' | 'software'>('analysis');
  const mountedRef = useRef(true);
  const lastStateRef = useRef<CDriveState | null>(null);

  // 优化轮询机制，减少不必要的更新
  const loadScanState = useCallback(async () => {
    try {
      const state = await window.electronAPI.getCDriveScanState();
      if (mountedRef.current) {
        // 只在状态发生变化时更新
        if (JSON.stringify(state) !== JSON.stringify(lastStateRef.current)) {
          setScanState(state);
          lastStateRef.current = state;
        }
      }
    } catch (error) {
      console.error('加载扫描状态失败:', error);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // 增加轮询间隔，减少更新频率
    const interval = setInterval(async () => {
      await loadScanState();
    }, 1000); // 从500ms改为1000ms
    
    setPollingInterval(interval);
  }, [loadScanState, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  useEffect(() => {
    mountedRef.current = true;
    loadScanState();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [loadScanState, stopPolling]);

  useEffect(() => {
    if (scanState?.isScanning) {
      if (!pollingInterval) {
        const fastInterval = setInterval(async () => {
          await loadScanState();
        }, 1000); // 从500ms改为1000ms
        setPollingInterval(fastInterval);
      }
    } else {
      stopPolling();
    }
  }, [scanState?.isScanning, pollingInterval, stopPolling]);

  const formatBytes = useCallback((bytes: number) => {
    const safeBytes = typeof bytes === 'number' && !isNaN(bytes) && bytes >= 0 ? bytes : 0;
    if (safeBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(safeBytes) / Math.log(k));
    return parseFloat((safeBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 缓存选项卡计数
  const tabCounts = useMemo(() => {
    return {
      cleanup: Array.isArray(scanState?.cleanupItems) ? scanState.cleanupItems.length : 0,
      largefiles: Array.isArray(scanState?.largeFiles) ? scanState.largeFiles.length : 0,
      software: Array.isArray(scanState?.migratableSoftware) ? scanState.migratableSoftware.length : 0
    };
  }, [scanState]);

  // 缓存计算结果
  const getTotalSelectedSoftwareSize = useCallback(() => {
    if (!scanState || !Array.isArray(scanState.migratableSoftware)) return 0;
    return scanState.migratableSoftware.filter(s => s?.selected).reduce((sum, s) => sum + (s?.size || 0), 0);
  }, [scanState]);

  const getTotalSelectedSize = useCallback(() => {
    if (!scanState || !Array.isArray(scanState.largeFiles)) return 0;
    return scanState.largeFiles.filter(f => f?.selected).reduce((sum, f) => sum + (f?.size || 0), 0);
  }, [scanState]);

  const getTotalCleanupSize = useCallback(() => {
    if (!scanState || !Array.isArray(scanState.cleanupItems)) return 0;
    return scanState.cleanupItems.filter(f => f?.selected).reduce((sum, f) => sum + (f?.size || 0), 0);
  }, [scanState]);

  const toggleSoftware = async (software: any) => {
    await window.electronAPI.toggleSoftwareSelection(software.path, !software.selected);
    await loadScanState();
  };

  const selectAllSoftware = async () => {
    await window.electronAPI.selectAllMigratableSoftware(true);
    await loadScanState();
  };

  const deselectAllSoftware = async () => {
    await window.electronAPI.selectAllMigratableSoftware(false);
    await loadScanState();
  };

  const moveSoftware = async () => {
    const safeSoftware = Array.isArray(scanState?.migratableSoftware) ? scanState.migratableSoftware : [];
    const softwareToMove = safeSoftware.filter(s => s?.selected);
    if (softwareToMove.length === 0) return;

    setCleaning(true);
    try {
      const result = await window.electronAPI.moveSelectedSoftware(targetDrive);
      if (result.success) {
        setCleanedSize(result.totalSize / 1024 / 1024 / 1024);
        await loadScanState();
        // 迁移完成后停止轮询
        setTimeout(() => {
          stopPolling();
        }, 1000);
      }
    } catch (error) {
      console.error('迁移软件失败:', error);
    } finally {
      setCleaning(false);
    }
  };

  const startScan = async () => {
    console.log('[CDriveCleaner] 点击开始扫描');
    await window.electronAPI.startCDriveScan();
    await loadScanState();
    startPolling();
  };

  const resetScan = async () => {
    await window.electronAPI.resetCDriveScan();
    await loadScanState();
  };

  const toggleFile = async (file: any) => {
    await window.electronAPI.toggleLargeFileSelection(file.path, !file.selected);
    await loadScanState();
  };

  const selectAll = async () => {
    await window.electronAPI.selectAllLargeFiles(true);
    await loadScanState();
  };

  const deselectAll = async () => {
    await window.electronAPI.selectAllLargeFiles(false);
    await loadScanState();
  };

  const toggleCleanupItem = async (item: any) => {
    await window.electronAPI.toggleCleanupItemSelection(item.path, !item.selected);
    await loadScanState();
  };

  const selectAllCleanupItems = async () => {
    await window.electronAPI.selectAllCleanupItems(true);
    await loadScanState();
  };

  const deselectAllCleanupItems = async () => {
    await window.electronAPI.selectAllCleanupItems(false);
    await loadScanState();
  };

  const cleanSelectedItems = async () => {
    const safeCleanupItems = Array.isArray(scanState?.cleanupItems) ? scanState.cleanupItems : [];
    const itemsToClean = safeCleanupItems.filter(f => f?.selected);
    if (itemsToClean.length === 0) return;

    setCleaning(true);
    try {
      const result = await window.electronAPI.cleanSelectedItems();
      if (result.success) {
        setCleanedSize(result.totalSize / 1024 / 1024 / 1024);
        // 清理后重新加载状态，但不重新开始扫描
        await loadScanState();
        // 显示清理完成提示，1 秒后停止轮询
        setTimeout(() => {
          stopPolling();
        }, 1000);
      }
    } catch (error) {
      console.error('清理失败:', error);
    } finally {
      setCleaning(false);
    }
  };

  const moveFiles = async () => {
    const safeLargeFiles = Array.isArray(scanState?.largeFiles) ? scanState.largeFiles : [];
    const filesToMove = safeLargeFiles.filter(f => f?.selected);
    if (filesToMove.length === 0) return;

    setCleaning(true);
    try {
      const result = await window.electronAPI.moveSelectedLargeFiles(targetDrive);
      if (result.success) {
        setCleanedSize(result.totalSize / 1024 / 1024 / 1024);
        await loadScanState();
        // 移动完成后停止轮询
        setTimeout(() => {
          stopPolling();
        }, 1000);
      }
    } catch (error) {
      console.error('迁移文件失败:', error);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div>
      {!scanState || !scanState.isScanning && scanState?.scanProgress === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <HardDrive size={80} color="var(--danger-color)" style={{ marginBottom: '20px' }} />
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '10px' }}>C 盘空间分析</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>分析 C 盘大文件，释放系统盘空间</p>
          <button 
            className="btn btn-primary" 
            onClick={startScan} 
            disabled={scanState?.isScanning}
            style={{ padding: '8px 20px', fontSize: '14px' }}
          >
            {scanState?.isScanning ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div>
                分析中...
              </>
            ) : (
              <>
                <Search size={20} />
                开始分析
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-title">
              <Activity size={20} />
              C 盘瘦身
            </div>

            {scanState?.isScanning && scanState && (
              <ScanProgress scanState={scanState} />
            )}

            <TabNavigation 
              activeTab={activeTab} 
              setActiveTab={(tab) => setActiveTab(tab as any)} 
              tabCounts={tabCounts} 
            />

            {activeTab === 'analysis' && scanState && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-primary)' }}>C 盘使用情况</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      总容量：{formatBytes(scanState.totalSpace)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                      {scanState.totalSpace > 0 ? ((scanState.usedSpace / scanState.totalSpace) * 100).toFixed(1) : '0.0'}% 已使用
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      剩余 {formatBytes(scanState.freeSpace)}
                    </div>
                  </div>
                </div>
                <div style={{ height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden', marginTop: '15px' }}>
                  <div 
                    style={{ 
                      width: `${scanState.totalSpace > 0 ? (scanState.usedSpace / scanState.totalSpace) * 100 : 0}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--danger-color), var(--danger-color-dark))' 
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
                  {Array.isArray(scanState.folders) && scanState.folders.map((folder: any, index: number) => (
                    <div 
                      key={index}
                      style={{
                        flex: '1',
                        minWidth: '200px',
                        padding: '15px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>{folder?.name || '未知文件夹'}</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{folder?.sizeGB || '0'} GB</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px' }}>{folder?.path || ''}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button 
                    className="secondary-button" 
                    onClick={resetScan}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    <RotateCcw size={16} />
                    重新分析
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'cleanup' && scanState && (
              <div>
                <div style={{ padding: '15px', background: 'var(--warning-color-light)', borderRadius: '8px', marginBottom: '15px', color: 'var(--warning-color)' }}>
                  <strong>提示：</strong> 扫描系统临时文件、回收站、Windows更新缓存等可清理内容
                </div>

                {Array.isArray(scanState.cleanupItems) && scanState.cleanupItems.length > 0 && (
                  <>
                    <div style={{ 
                      padding: '12px', 
                      background: 'var(--primary-color-light)', 
                      borderRadius: '8px', 
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}>
                      <div>
                        <span style={{ color: 'var(--primary-color)' }}>
                          共发现 <strong>{scanState.cleanupItems.length}</strong> 项可清理内容
                        </span>
                        <span style={{ color: 'var(--primary-color)', fontSize: '14px', marginLeft: '20px' }}>
                          选中 <strong>{Array.isArray(scanState.cleanupItems) ? scanState.cleanupItems.filter(f => f?.selected).length : 0}</strong> 项
                        </span>
                      </div>
                      <div style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
                        总计 <strong>{(getTotalCleanupSize() / 1024 / 1024 / 1024).toFixed(2)}</strong> GB
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button className="secondary-button" onClick={selectAllCleanupItems} style={{ padding: '5px 10px', fontSize: '12px' }}>
                        全选
                      </button>
                      <button className="secondary-button" onClick={deselectAllCleanupItems} style={{ padding: '5px 10px', fontSize: '12px' }}>
                        取消全选
                      </button>

                      <button 
                        className="primary-button" 
                        onClick={cleanSelectedItems}
                        disabled={cleaning || (Array.isArray(scanState.cleanupItems) ? scanState.cleanupItems.filter(f => f?.selected).length : 0) === 0}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        <Trash size={16} />
                        {cleaning ? '清理中...' : `清理选中 (${(getTotalCleanupSize() / 1024 / 1024).toFixed(0)} MB)`}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                      {Array.isArray(scanState.cleanupItems) && scanState.cleanupItems.map((item: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px',
                            background: item?.selected ? 'var(--primary-color-light)' : 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: item?.selected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleCleanupItem(item)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={item?.selected || false}
                                onChange={() => toggleCleanupItem(item)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '18px', height: '18px' }}
                              />
                              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item?.name || '未知'}</div>
                            </div>
                            <div style={{ color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '14px' }}>
                              {item?.sizeGB && parseFloat(item.sizeGB) > 1 ? `${item.sizeGB} GB` : `${item.sizeMB} MB`}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                            {item?.description || ''}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {item?.path || ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(!Array.isArray(scanState.cleanupItems) || scanState.cleanupItems.length === 0) && scanState.scanProgress === 100 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Trash size={48} color="var(--text-secondary)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <div style={{ color: 'var(--text-primary)' }}>没有发现可清理内容</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'largefiles' && scanState && (
              <div>
                <div style={{ padding: '15px', background: 'var(--warning-color-light)', borderRadius: '8px', marginBottom: '15px', color: 'var(--warning-color)' }}>
                  <strong>提示：</strong> 扫描用户目录、下载、桌面、文档等文件夹中超过 100MB 的大文件
                </div>

                {Array.isArray(scanState.largeFiles) && scanState.largeFiles.length > 0 && (
                  <>
                    <div style={{ 
                      padding: '12px', 
                      background: 'var(--primary-color-light)', 
                      borderRadius: '8px', 
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}>
                      <div>
                        <span style={{ color: 'var(--primary-color)' }}>
                          共发现 <strong>{scanState.largeFiles.length}</strong> 个大文件
                        </span>
                        <span style={{ color: 'var(--primary-color)', fontSize: '14px', marginLeft: '20px' }}>
                          选中 <strong>{Array.isArray(scanState.largeFiles) ? scanState.largeFiles.filter(f => f?.selected).length : 0}</strong> 个
                        </span>
                      </div>
                      <div style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
                        总计 <strong>{(getTotalSelectedSize() / 1024 / 1024 / 1024).toFixed(2)}</strong> GB
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button className="secondary-button" onClick={selectAll} style={{ padding: '5px 10px', fontSize: '12px' }}>
                        全选
                      </button>
                      <button className="secondary-button" onClick={deselectAll} style={{ padding: '5px 10px', fontSize: '12px' }}>
                        取消全选
                      </button>
                      
                      <select
                        value={targetDrive}
                        onChange={(e) => setTargetDrive(e.target.value)}
                        style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        <option value="D:">D: 盘</option>
                        <option value="E:">E: 盘</option>
                        <option value="F:">F: 盘</option>
                      </select>

                      <button 
                        className="primary-button" 
                        onClick={moveFiles}
                        disabled={cleaning || (Array.isArray(scanState.largeFiles) ? scanState.largeFiles.filter(f => f?.selected).length : 0) === 0}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        <Move size={16} />
                        {cleaning ? '迁移中...' : `迁移选中 (${(getTotalSelectedSize() / 1024 / 1024).toFixed(0)} MB)`}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                      {Array.isArray(scanState.largeFiles) && scanState.largeFiles.map((file: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px',
                            background: file?.selected ? 'var(--primary-color-light)' : 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: file?.selected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleFile(file)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={file?.selected || false}
                                onChange={() => toggleFile(file)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '18px', height: '18px' }}
                              />
                              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{file?.name || '未知文件'}</div>
                            </div>
                            <div style={{ color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '14px' }}>
                              {file?.sizeMB || '0'} MB
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                            {file?.path || ''}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            修改时间：{file?.modifiedTime ? new Date(file.modifiedTime).toLocaleString('zh-CN') : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(!Array.isArray(scanState.largeFiles) || scanState.largeFiles.length === 0) && scanState.scanProgress === 100 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Folder size={48} color="var(--text-secondary)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <div style={{ color: 'var(--text-primary)' }}>没有发现大文件</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'software' && scanState && (
              <div>
                <div style={{ padding: '15px', background: 'var(--warning-color-light)', borderRadius: '8px', marginBottom: '15px', color: 'var(--warning-color)' }}>
                  <strong>提示：</strong> 将 C 盘的大软件迁移到其他盘，释放系统空间（迁移前请关闭相关软件）
                </div>

                {Array.isArray(scanState.migratableSoftware) && scanState.migratableSoftware.length > 0 && (
                  <>
                    <div style={{ 
                      padding: '12px', 
                      background: 'var(--primary-color-light)', 
                      borderRadius: '8px', 
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}>
                      <div>
                        <span style={{ color: 'var(--primary-color)' }}>
                          共发现 <strong>{scanState.migratableSoftware.length}</strong> 个可迁移软件
                        </span>
                        <span style={{ color: 'var(--primary-color)', fontSize: '14px', marginLeft: '20px' }}>
                          选中 <strong>{Array.isArray(scanState.migratableSoftware) ? scanState.migratableSoftware.filter(s => s?.selected).length : 0}</strong> 个
                        </span>
                      </div>
                      <div style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
                        总计 <strong>{(getTotalSelectedSoftwareSize() / 1024 / 1024 / 1024).toFixed(2)}</strong> GB
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button className="secondary-button" onClick={selectAllSoftware} style={{ padding: '5px 10px', fontSize: '12px' }}>
                        全选
                      </button>
                      <button className="secondary-button" onClick={deselectAllSoftware} style={{ padding: '5px 10px', fontSize: '12px' }}>
                        取消全选
                      </button>
                      
                      <select
                        value={targetDrive}
                        onChange={(e) => setTargetDrive(e.target.value)}
                        style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        <option value="D:">D: 盘</option>
                        <option value="E:">E: 盘</option>
                        <option value="F:">F: 盘</option>
                        <option value="G:">G: 盘</option>
                      </select>

                      <button 
                        className="primary-button" 
                        onClick={moveSoftware}
                        disabled={cleaning || (Array.isArray(scanState.migratableSoftware) ? scanState.migratableSoftware.filter(s => s?.selected).length : 0) === 0}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        <Move size={16} />
                        {cleaning ? '迁移中...' : `迁移选中 (${(getTotalSelectedSoftwareSize() / 1024 / 1024).toFixed(0)} MB)`}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                      {Array.isArray(scanState.migratableSoftware) && scanState.migratableSoftware.map((software: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px',
                            background: software?.selected ? 'var(--primary-color-light)' : 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: software?.selected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleSoftware(software)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={software?.selected || false}
                                onChange={() => toggleSoftware(software)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '18px', height: '18px' }}
                              />
                              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{software?.name || '未知软件'}</div>
                            </div>
                            <div style={{ color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '14px' }}>
                              {software?.sizeGB && parseFloat(software.sizeGB) > 1 ? `${software.sizeGB} GB` : `${software.sizeMB} MB`}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {software?.path || ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(!Array.isArray(scanState.migratableSoftware) || scanState.migratableSoftware.length === 0) && scanState.scanProgress === 100 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Activity size={48} color="var(--text-secondary)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <div style={{ color: 'var(--text-primary)' }}>没有发现可迁移的软件（大于 100MB）</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {cleanedSize > 0 && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-title">
                <Check size={20} color="var(--success-color)" />
                操作完成
              </div>
              <div style={{ padding: '20px', background: 'var(--success-color-light)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success-color)', marginBottom: '10px' }}>
                  ✓ 成功释放 {cleanedSize.toFixed(2)} GB 空间
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {activeTab === 'largefiles' 
                    ? `文件已移动到 ${targetDrive}\AICLeaner_Migrated_Files 文件夹`
                    : activeTab === 'software'
                    ? `软件已移动到 ${targetDrive}\AICLeaner_Moved_Software 文件夹`
                    : ''}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CDriveCleaner;
