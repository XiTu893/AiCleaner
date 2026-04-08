import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trash, Search, Check, RotateCcw, Info, Play, Pause } from 'lucide-react';

interface JunkItem {
  id: string;
  name: string;
  description: string;
  path: string;
  size: number;
  sizeMB: string;
  type: string;
  selected: boolean;
  uniqueId?: string;
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
  items: JunkItem[];
  scanned: boolean;
  scanning: boolean;
}

interface ScanState {
  isScanning: boolean;
  isPaused: boolean;
  scanProgress: number;
  scanStatus: string;
  currentScanItem: string;
  currentCategoryIndex: number;
  categories: CategoryData[];
}

const JunkCleaner: React.FC = () => {
  const [cleaning, setCleaning] = useState(false);
  const [cleanedSize, setCleanedSize] = useState(0);
  const [scanState, setScanState] = useState<ScanState | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const mountedRef = useRef(true);

  const loadScanState = useCallback(async () => {
    try {
      const state = await window.electronAPI.getJunkScanState();
      if (mountedRef.current) {
        setScanState(state);
      }
    } catch (error) {
      console.error('加载扫描状态失败:', error);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = setInterval(async () => {
      await loadScanState();
    }, 500);
    
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
        }, 500);
        setPollingInterval(fastInterval);
      }
    } else {
      stopPolling();
    }
  }, [scanState?.isScanning, pollingInterval, stopPolling]);

  const getTotalSize = (items: JunkItem[]) => {
    return items.reduce((sum, item) => sum + ((item.size || 0) / 1024 / 1024), 0);
  };

  const getSelectedSize = (items: JunkItem[]) => {
    return items.filter(item => item.selected).reduce((sum, item) => sum + ((item.size || 0) / 1024 / 1024), 0);
  };

  const getSelectedCount = (items: JunkItem[]) => {
    return items.filter(item => item.selected).length;
  };

  const getTotalStats = () => {
    if (!scanState) return { totalItems: 0, totalSize: 0, totalSelected: 0, totalSelectedSize: 0 };

    let totalItems = 0;
    let totalSize = 0;
    let totalSelected = 0;
    let totalSelectedSize = 0;

    scanState.categories.forEach(cat => {
      totalItems += cat.items.length;
      totalSize += cat.items.reduce((sum, item) => sum + ((item.size || 0) / 1024 / 1024), 0);
      totalSelected += cat.items.filter(item => item.selected).length;
      totalSelectedSize += cat.items.filter(item => item.selected).reduce((sum, item) => sum + ((item.size || 0) / 1024 / 1024), 0);
    });

    return { totalItems, totalSize, totalSelected, totalSelectedSize };
  };

  const toggleItem = async (categoryId: string, itemUniqueId: string) => {
    const category = scanState?.categories.find(c => c.id === categoryId);
    if (!category) return;

    const item = category.items.find(i => i.uniqueId === itemUniqueId);
    if (!item) return;

    await window.electronAPI.updateJunkItemSelection(categoryId, itemUniqueId, !item.selected);
    await loadScanState();
  };

  const selectAll = async (categoryId: string) => {
    await window.electronAPI.toggleJunkCategorySelection(categoryId, true);
    await loadScanState();
  };

  const deselectAll = async (categoryId: string) => {
    await window.electronAPI.toggleJunkCategorySelection(categoryId, false);
    await loadScanState();
  };

  const startScan = async () => {
    console.log('[JunkCleaner] 点击开始扫描');
    await window.electronAPI.startJunkScan();
    await loadScanState();
    startPolling();
  };

  const pauseScan = async () => {
    await window.electronAPI.pauseJunkScan();
    await loadScanState();
  };

  const resumeScan = async () => {
    await window.electronAPI.resumeJunkScan();
    await loadScanState();
  };

  const resetScan = async () => {
    await window.electronAPI.resetJunkScan();
    await loadScanState();
  };

  const cleanSelected = async (categoryId: string) => {
    const category = scanState?.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const selectedItems = category.items.filter(item => item.selected);
    if (selectedItems.length === 0) return;

    setCleaning(true);

    try {
      const result = await window.electronAPI.cleanSelectedJunk(categoryId);

      if (result.success) {
        setCleanedSize(prev => prev + (result.totalSize / 1024 / 1024 || 0));
        await loadScanState();
      }
    } catch (error) {
      console.error('清理失败:', error);
    } finally {
      setCleaning(false);
    }
  };

  const cleanAllSelected = async () => {
    if (!scanState) return;

    const hasSelectedItems = scanState.categories.some(cat => 
      cat.items.some(item => item.selected)
    );
    
    if (!hasSelectedItems) return;

    setCleaning(true);

    try {
      const result = await window.electronAPI.cleanAllSelectedJunk();

      if (result.success) {
        setCleanedSize(prev => prev + (result.totalSize / 1024 / 1024 || 0));
        await loadScanState();
      }
    } catch (error) {
      console.error('清理失败:', error);
    } finally {
      setCleaning(false);
    }
  };

  if (!scanState) {
    return <div>加载中...</div>;
  }

  const { totalItems, totalSize, totalSelected, totalSelectedSize } = getTotalStats();
  const hasScannedItems = scanState.categories.some(cat => cat.scanned);
  const activeCategory = scanState.categories[activeTab];

  return (
    <div>
      <div className="header">
        <h2>🗑️ 垃圾清理</h2>
        {cleanedSize > 0 && (
          <div style={{
            padding: '10px 15px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            color: 'var(--accent-color)',
            fontSize: '14px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Check size={16} style={{ display: 'inline', marginRight: '8px' }} />
            已清理 <strong>{cleanedSize.toFixed(2)} MB</strong> 垃圾文件
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)', color: 'var(--text-primary)' }}>
        <div className="card-title">
          <Play size={20} />
          垃圾清理扫描
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
          一键扫描所有垃圾文件类别，包括：<br />
          ✓ 系统临时文件 &nbsp;&nbsp; ✓ 应用缓存 &nbsp;&nbsp; ✓ 注册表冗余 &nbsp;&nbsp; ✓ 大文件
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            className="primary-button"
            onClick={async () => {
              if (scanState.isScanning) {
                if (scanState.isPaused) {
                  await resumeScan();
                } else {
                  await pauseScan();
                }
              } else {
                if (scanState.scanProgress === 100) {
                  await resetScan();
                }
                await startScan();
              }
            }}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              background: scanState.isScanning ? (scanState.isPaused ? 'var(--warning-color)' : 'var(--danger-color)') : 'var(--accent-color)',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              opacity: 1
            }}
          >
            {scanState.isScanning
              ? (scanState.isPaused ? <Play size={20} /> : <Pause size={20} />)
              : <Play size={20} />
            }
            {scanState.isScanning
              ? (scanState.isPaused ? '继续扫描' : '暂停扫描')
              : (scanState.scanProgress === 100 ? '重新扫描' : '开始扫描')
            }
          </button>

          {hasScannedItems && (
            <button
              className="secondary-button"
              onClick={resetScan}
              disabled={scanState.isScanning}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              <RotateCcw size={16} />
              清空结果
            </button>
          )}
        </div>

        {scanState.isScanning && (
          <div style={{ marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <span>{scanState.scanStatus}</span>
              <span>{scanState.scanProgress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '10px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${scanState.scanProgress}%`,
                height: '100%',
                background: 'var(--gradient-primary)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            {scanState.currentScanItem && (
              <div style={{
                marginTop: '12px',
                padding: '10px 15px',
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontFamily: 'Consolas, Monaco, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ color: 'var(--primary-color)', marginRight: '8px' }}>→</span>
                {scanState.currentScanItem}
              </div>
            )}
          </div>
        )}
      </div>

      {hasScannedItems && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">
            <Check size={20} />
            扫描汇总
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '15px',
            padding: '15px',
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {totalItems}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>总项目数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                {totalSize.toFixed(1)} MB
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>总大小</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {totalSelected}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>已选中</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                {totalSelectedSize.toFixed(1)} MB
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>选中大小</div>
            </div>
          </div>

          {totalSelected > 0 && (
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
              <button
                className="primary-button"
                onClick={cleanAllSelected}
                disabled={cleaning}
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                <Trash size={16} />
                {cleaning ? '清理中...' : `一键清理所有选中项 (${totalSelectedSize.toFixed(1)} MB)`}
              </button>
            </div>
          )}
        </div>
      )}

      {hasScannedItems && (
        <div className="card">
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '20px'
          }}>
            {scanState.categories.map((category, index) => (
              <div
                key={category.id}
                onClick={() => setActiveTab(index)}
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  borderBottom: activeTab === index ? '3px solid var(--primary-color)' : '3px solid transparent',
                  color: activeTab === index ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontWeight: activeTab === index ? 'bold' : 'normal',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {category.name}
                {category.scanned && category.items.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '0px',
                    background: 'var(--danger-color)',
                    color: 'white',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                    transform: 'translateX(50%)'
                  }}>
                    {category.items.length}
                  </span>
                )}
              </div>
            ))}
          </div>

          {activeCategory && (
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                {activeCategory.description}
              </div>

              <div style={{
                padding: '12px',
                background: activeCategory.scanned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.6)',
                borderRadius: '8px',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid var(--border-color)'
              }}>
                {activeCategory.scanning ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid var(--border-color)',
                      borderTop: '3px solid var(--primary-color)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 'bold' }}>
                      正在扫描...
                    </span>
                  </>
                ) : activeCategory.scanned ? (
                  <>
                    <Check size={20} style={{ color: 'var(--accent-color)' }} />
                    <span style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: 'bold' }}>
                      已扫描完成
                    </span>
                  </>
                ) : (
                  <>
                    <Search size={20} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      等待扫描
                    </span>
                  </>
                )}
              </div>

              {activeCategory.scanned && activeCategory.items.length > 0 && (
                <>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(0, 212, 255, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--primary-color)' }}>
                        共 <strong>{activeCategory.items.length}</strong> 项
                      </span>
                      <span style={{ color: 'var(--primary-color)', marginLeft: '15px' }}>
                        选中 <strong>{getSelectedCount(activeCategory.items)}</strong> 项
                      </span>
                    </div>
                    <div style={{ color: 'var(--danger-color)' }}>
                      总计 <strong>{getTotalSize(activeCategory.items).toFixed(1)}</strong> MB
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button
                      className="secondary-button"
                      onClick={() => selectAll(activeCategory.id)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      全选
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => deselectAll(activeCategory.id)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      取消全选
                    </button>
                    <button
                      className="primary-button"
                      onClick={() => cleanSelected(activeCategory.id)}
                      disabled={cleaning || getSelectedCount(activeCategory.items) === 0}
                      style={{ padding: '5px 10px', fontSize: '12px', marginLeft: 'auto' }}
                    >
                      <Trash size={16} />
                      {cleaning ? '清理中...' : `清理选中 (${getSelectedSize(activeCategory.items).toFixed(1)} MB)`}
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {activeCategory.items.map((item: JunkItem) => {
                      const itemKey = item.uniqueId || item.id;
                      return (
                        <div
                          key={itemKey}
                          style={{
                            padding: '12px',
                            background: item.selected ? 'rgba(0, 212, 255, 0.1)' : 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '8px',
                            border: item.selected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                          onClick={() => toggleItem(activeCategory.id, itemKey)}
                        >
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleItem(activeCategory.id, itemKey)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.description}</div>
                            {item.path && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {item.path}
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 'bold', color: 'var(--danger-color)', fontSize: '14px' }}>
                            {(item.size / 1024 / 1024).toFixed(1)} MB
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeCategory.scanned && activeCategory.items.length === 0 && (
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <Info size={48} style={{ marginBottom: '10px' }} />
                  <div>未发现{activeCategory.name}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {scanState.categories.find(c => c.id === 'registry')?.scanned && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-title">
            <Info size={20} />
            注册表清理说明
          </div>
          <div style={{ padding: '15px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--warning-color)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <strong>注意：</strong> 注册表清理功能需要管理员权限，建议在专业指导下使用。
            清理前建议先备份注册表。
          </div>
        </div>
      )}
    </div>
  );
};

export default JunkCleaner;
