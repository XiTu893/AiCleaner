import React, { useState, useEffect } from 'react';

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    addLog('Debug panel initialized');
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      addLog('Testing window.electronAPI...');
      
      if (!window.electronAPI) {
        addLog('❌ ERROR: window.electronAPI is undefined!');
        return;
      }
      
      addLog('✅ window.electronAPI exists');
      
      addLog('Calling getSystemInfo()...');
      const info = await window.electronAPI.getSystemInfo();
      setSystemInfo(info);
      addLog('✅ getSystemInfo() succeeded');
      addLog(`CPU Count: ${info.cpus?.length}`);
      addLog(`Total Memory: ${(info.totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB`);
      
      addLog('Calling getDiskInfo()...');
      const disks = await window.electronAPI.getDiskInfo();
      addLog(`✅ getDiskInfo() succeeded - ${disks.length} disks found`);
      
    } catch (error) {
      addLog(`❌ ERROR: ${error}`);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      width: '400px',
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: '20px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>🔍 Debug Panel</h3>
      <button 
        onClick={testAPI}
        style={{
          background: '#3498db',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        测试 API
      </button>
      
      {systemInfo && (
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div><strong>CPU 核心数:</strong> {systemInfo.cpus?.length || 0}</div>
          <div><strong>总内存:</strong> {(systemInfo.totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB</div>
          <div><strong>可用内存:</strong> {(systemInfo.freeMemory / (1024 * 1024 * 1024)).toFixed(2)} GB</div>
          <div><strong>平台:</strong> {systemInfo.platform}</div>
          <div><strong>架构:</strong> {systemInfo.arch}</div>
        </div>
      )}
      
      <div style={{ marginBottom: '5px', color: '#fff' }}>日志:</div>
      {logs.map((log, i) => (
        <div key={i} style={{ marginBottom: '3px' }}>{log}</div>
      ))}
    </div>
  );
};

export default DebugPanel;
