import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, Plus, Activity, RefreshCw } from 'lucide-react';

interface Software {
  name: string;
  publisher: string;
  version: string;
  uninstallString: string;
  installDate: string;
  location: string;
  registryPath: string;
}

interface Process {
  id: number;
  name: string;
  memory: number;
  path: string;
}

const SoftwareUninstaller: React.FC = () => {
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [processList, setProcessList] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [showForceUninstall, setShowForceUninstall] = useState(false);
  const [forceUninstallName, setForceUninstallName] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  useEffect(() => {
    loadSoftwareList();
  }, []);

  useEffect(() => {
    if (showForceUninstall) {
      loadProcessList();
    }
  }, [showForceUninstall]);

  const loadSoftwareList = async () => {
    setLoading(true);
    try {
      const software = await window.electronAPI.getInstalledSoftware();
      // 添加 registryPath 属性
      const softwareWithRegistryPath = software.map(item => ({
        ...item,
        registryPath: ''
      }));
      setSoftwareList(softwareWithRegistryPath);
      setTotalCount(softwareWithRegistryPath.length);
    } catch (error) {
      console.error('Failed to load software list:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcessList = async () => {
    setLoadingProcesses(true);
    try {
      const result = await window.electronAPI.getProcessList();
      if (result.success) {
        setProcessList(result.processes);
      }
    } catch (error) {
      console.error('Failed to load process list:', error);
    } finally {
      setLoadingProcesses(false);
    }
  };

  const handleUninstall = async (software: Software) => {
    setUninstalling(software.name);
    try {
      let result;
      if (!software.uninstallString) {
        result = await window.electronAPI.uninstallSoftware(software, true);
      } else {
        result = await window.electronAPI.uninstallSoftware(software);
        if (!result.success) {
          result = await window.electronAPI.uninstallSoftware(software, true);
        }
      }
      
      if (result.success) {
        loadSoftwareList();
      }
    } catch (error) {
      console.error('Failed to uninstall software:', error);
    } finally {
      setUninstalling(null);
    }
  };

  const handleForceUninstall = async () => {
    if (!forceUninstallName.trim()) return;
    
    setUninstalling(forceUninstallName);
    try {
      const software = {
        name: forceUninstallName,
        publisher: 'Unknown',
        version: 'Unknown',
        uninstallString: '',
        installDate: '',
        location: '',
        registryPath: ''
      };
      
      const result = await window.electronAPI.uninstallSoftware(software, true);
      
      if (result.success) {
        setForceUninstallName('');
        setShowForceUninstall(false);
        loadProcessList();
      }
    } catch (error) {
      console.error('Failed to force uninstall software:', error);
    } finally {
      setUninstalling(null);
    }
  };

  const handleProcessForceUninstall = async (process: Process) => {
    setUninstalling(process.name);
    try {
      const software = {
        name: process.name,
        publisher: 'Unknown',
        version: 'Unknown',
        uninstallString: '',
        installDate: '',
        location: '',
        registryPath: ''
      };
      
      const result = await window.electronAPI.uninstallSoftware(software, true);
      
      if (result.success) {
        setSelectedProcess(null);
        loadProcessList();
      }
    } catch (error) {
      console.error('Failed to force uninstall process:', error);
    } finally {
      setUninstalling(null);
    }
  };

  const filteredSoftware = softwareList.filter(software =>
    software.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    software.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h2>🗑️ 软件卸载</h2>
      </div>

      <div className="card">
        <div className="card-title">
          <Trash2 size={24} />
          已安装的软件 ({totalCount} 个)
        </div>

        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="搜索软件名称或厂商..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ margin: '15px 0', textAlign: 'right' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowForceUninstall(!showForceUninstall)}
          >
            <Plus size={16} />
            强力卸载
          </button>
        </div>

        {showForceUninstall && (
          <div className="force-uninstall-section" style={{ margin: '15px 0', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <h4>强力卸载</h4>
            <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              对于在列表中看不到但实际运行的程序（如 QQProtect.exe），可以在此输入程序名称或从运行进程中选择进行强力卸载
            </p>
            
            {/* 从运行进程中选择 */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ marginBottom: '10px' }}>当前运行的进程</h5>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>选择一个进程进行强力卸载</span>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={loadProcessList}
                  disabled={loadingProcesses}
                >
                  <RefreshCw size={14} />
                  刷新
                </button>
              </div>
              
              {loadingProcesses ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
                  <p style={{ marginTop: '10px', fontSize: '14px' }}>加载进程中...</p>
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>进程名称</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>内存占用</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processList.slice(0, 20).map((process) => (
                        <tr key={process.id} style={{ cursor: 'pointer', backgroundColor: selectedProcess?.id === process.id ? '#e8f4f8' : 'transparent' }}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{process.name}</td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{formatMemory(process.memory)}</td>
                          <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleProcessForceUninstall(process)}
                              disabled={uninstalling === process.name}
                            >
                              {uninstalling === process.name ? (
                                <>
                                  <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>
                                </>
                              ) : (
                                <>
                                  <Trash2 size={14} />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* 手动输入程序名称 */}
            <div style={{ marginTop: '20px' }}>
              <h5 style={{ marginBottom: '10px' }}>手动输入程序名称</h5>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="输入程序名称（如 QQProtect）"
                  value={forceUninstallName}
                  onChange={(e) => setForceUninstallName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-danger"
                  onClick={handleForceUninstall}
                  disabled={uninstalling === forceUninstallName || !forceUninstallName.trim()}
                >
                  {uninstalling === forceUninstallName ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      卸载中...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      卸载
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredSoftware.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7f8c8d' }}>
            <AlertCircle size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
            <p>未找到匹配的软件</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              如果要卸载的程序不在列表中，可以使用上方的「强力卸载」功能
            </p>
          </div>
        ) : (
          <ul className="software-list">
            {filteredSoftware.map((software, index) => (
              <li key={index} className="software-item">
                <div className="software-info">
                  <div className="software-name">{software.name}</div>
                  <div className="software-details">
                    厂商：{software.publisher} | 版本：{software.version}
                    {software.installDate && ` | 安装日期：${software.installDate}`}
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => handleUninstall(software)}
                  disabled={uninstalling === software.name}
                >
                  {uninstalling === software.name ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      卸载中...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      卸载
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SoftwareUninstaller;
