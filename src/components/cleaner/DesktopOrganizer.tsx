import React, { useState, useEffect } from 'react';
import { Layers, Grid, Check, Play, Square, Trash, RefreshCw, Activity, Scan } from 'lucide-react';

interface OrganizeResult {
  success: number;
  failed: number;
  organized: Array<{
    name: string;
    type: string;
    target: string;
  }>;
  errors?: Array<{
    file: string;
    error: string;
  }>;
}

interface BrokenShortcut {
  name: string;
  path: string;
  reason: string;
}

const DesktopOrganizer: React.FC = () => {
  const [organizing, setOrganizing] = useState(false);
  const [autoOrganizing, setAutoOrganizing] = useState(false);
  const [autoOrganizeEnabled, setAutoOrganizeEnabled] = useState(false);
  const [organized, setOrganized] = useState(false);
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [brokenShortcuts, setBrokenShortcuts] = useState<BrokenShortcut[]>([]);
  const [scanningShortcuts, setScanningShortcuts] = useState(false);
  const [activeTab, setActiveTab] = useState<'organize' | 'auto' | 'shortcuts'>('organize');

  const organizeDesktop = async () => {
    setOrganizing(true);
    try {
      const result = await window.electronAPI.organizeDesktop();
      setResult(result);
      setOrganized(true);
    } catch (error) {
      console.error('整理桌面失败:', error);
      alert('整理桌面失败：' + (error as Error).message);
    } finally {
      setOrganizing(false);
    }
  };

  const quickOrganizeDesktop = async () => {
    setOrganizing(true);
    try {
      const result = await window.electronAPI.quickOrganizeDesktop();
      setResult(result);
      setOrganized(true);
    } catch (error) {
      console.error('快速整理失败:', error);
    } finally {
      setOrganizing(false);
    }
  };

  const startAutoOrganize = async () => {
    try {
      const result = await window.electronAPI.startAutoOrganize();
      if (result.success) {
        setAutoOrganizeEnabled(true);
      }
    } catch (error) {
      console.error('启动自动整理失败:', error);
    }
  };

  const stopAutoOrganize = async () => {
    try {
      const result = await window.electronAPI.stopAutoOrganize();
      if (result.success) {
        setAutoOrganizeEnabled(false);
      }
    } catch (error) {
      console.error('停止自动整理失败:', error);
    }
  };

  const scanBrokenShortcuts = async () => {
    setScanningShortcuts(true);
    try {
      const result = await window.electronAPI.cleanBrokenShortcuts();
      if (result && result.cleaned) {
        setBrokenShortcuts(Array.isArray(result.cleaned) ? result.cleaned : []);
      }
    } catch (error) {
      console.error('扫描快捷方式失败:', error);
      setBrokenShortcuts([]);
    } finally {
      setScanningShortcuts(false);
    }
  };

  const reset = () => {
    setOrganized(false);
    setResult(null);
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'shortcuts':
        return Array.isArray(brokenShortcuts) ? brokenShortcuts.length : 0;
      default:
        return 0;
    }
  };

  return (
    <div>
      {!organized ? (
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px' }}>
          <Layers size={64} color="#3498db" style={{ marginBottom: '15px' }} />
          <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '10px' }}>桌面整理工具</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
            一键归类桌面图标，保持桌面整洁有序
          </p>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="primary-button" 
              onClick={organizeDesktop}
              disabled={organizing}
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              {organizing ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div>
                  整理中...
                </>
              ) : (
                <>
                  <Grid size={20} />
                  一键整理桌面
                </>
              )}
            </button>

            <button 
              className="secondary-button" 
              onClick={quickOrganizeDesktop}
              disabled={organizing}
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              <RefreshCw size={20} />
              快速归类
            </button>
          </div>

          {autoOrganizeEnabled && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: '#e8f5e9', 
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Play size={20} color="#27ae60" />
              <span style={{ color: '#27ae60', fontWeight: 'bold' }}>桌面自动整理已启动</span>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60', marginBottom: '10px' }}>
            ✓ 整理完成
          </div>
          
          {result && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', minWidth: '150px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                    {result.success}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '5px' }}>
                    成功整理
                  </div>
                </div>
                
                {result.failed > 0 && (
                  <div style={{ padding: '15px', background: '#ffebee', borderRadius: '8px', minWidth: '150px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
                      {result.failed}
                    </div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '5px' }}>
                      失败
                    </div>
                  </div>
                )}
              </div>

              {result.organized && Array.isArray(result.organized) && result.organized.length > 0 && (
                <div style={{ 
                  padding: '15px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  textAlign: 'left',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>已整理文件</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {result.organized.slice(0, 20).map((item: { name: string; type: string; target: string }, index: number) => (
                      <div 
                        key={index}
                        style={{ 
                          padding: '10px', 
                          background: 'white', 
                          borderRadius: '6px',
                          fontSize: '13px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: '#e3f2fd', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1976d2'
                        }}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                  {result.organized.length > 20 && (
                    <div style={{ textAlign: 'center', marginTop: '15px', color: '#7f8c8d' }}>
                      还有 {result.organized.length - 20} 个文件已整理
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary" onClick={reset} style={{ marginTop: '20px', padding: '8px 20px', fontSize: '13px' }}>
            返回
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <Grid size={20} />
          整理选项
        </div>

        <div style={{ display: 'flex', gap: '0px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
          {[
            { key: 'organize', label: '桌面整理', count: 0 },
            { key: 'auto', label: '自动整理', count: autoOrganizeEnabled ? 1 : 0 },
            { key: 'shortcuts', label: '快捷方式', count: Array.isArray(brokenShortcuts) ? brokenShortcuts.length : 0 }
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
              {tab.count > 0 && (
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
                  {tab.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {activeTab === 'organize' && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>整理规则</div>
            <div style={{ lineHeight: '2', color: '#7f8c8d', fontSize: '13px' }}>
              <p>• 文档资料 → 文档资料文件夹 (.doc, .xls, .pdf, .txt 等)</p>
              <p>• 图片视频 → 图片视频文件夹 (.jpg, .png, .mp4 等)</p>
              <p>• 音频文件 → 音频文件夹 (.mp3, .wav, .flac 等)</p>
              <p>• 压缩文件 → 压缩文件文件夹 (.zip, .rar, .7z 等)</p>
              <p>• 安装程序 → 安装程序文件夹 (.exe, .msi 等)</p>
              <p>• 代码文件 → 代码文件夹 (.js, .py, .java 等)</p>
              <p>• 其他文件 → 其他文件夹</p>
            </div>
          </div>
        )}

        {activeTab === 'auto' && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>自动整理桌面</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                  实时监控桌面变化，自动归类新文件
                </div>
              </div>
              {autoOrganizeEnabled ? (
                <button 
                  className="secondary-button" 
                  onClick={stopAutoOrganize}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  <Square size={18} />
                  停止监控
                </button>
              ) : (
                <button 
                  className="primary-button" 
                  onClick={startAutoOrganize}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  <Play size={18} />
                  启动监控
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shortcuts' && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>清理失效快捷方式</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                  扫描并标记失效的快捷方式
                </div>
              </div>
              <button 
                className="secondary-button" 
                onClick={scanBrokenShortcuts}
                disabled={scanningShortcuts}
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                <Scan size={18} />
                {scanningShortcuts ? '扫描中...' : '扫描'}
              </button>
            </div>

            {Array.isArray(brokenShortcuts) && brokenShortcuts.length > 0 && (
              <div style={{ 
                padding: '15px', 
                background: '#fff3cd', 
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#856404' }}>
                  发现 {brokenShortcuts.length} 个可能失效的快捷方式：
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {brokenShortcuts.map((shortcut: BrokenShortcut, index: number) => (
                    <div 
                      key={index}
                      style={{ 
                        padding: '8px', 
                        background: 'white', 
                        borderRadius: '4px',
                        marginBottom: '8px',
                        fontSize: '12px'
                      }}
                    >
                      {shortcut.name} - {shortcut.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {autoOrganizeEnabled && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-title">
            <Check size={20} color="#27ae60" />
            自动整理状态
          </div>
          <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', color: '#27ae60' }}>
            <Play size={16} style={{ display: 'inline', marginRight: '8px' }} />
            桌面自动整理监控中 - 新文件将自动归类到对应文件夹
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopOrganizer;
