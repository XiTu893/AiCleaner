import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface SoftwareUpdate {
  name: string;
  currentVersion: string;
  availableVersion: string;
  publisher: string;
  size: string;
  priority: 'high' | 'medium' | 'low';
  selected: boolean;
}

const SoftwareUpgrade: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updates, setUpdates] = useState<SoftwareUpdate[]>([]);
  const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);

  const mockUpdates: SoftwareUpdate[] = [
    {
      name: 'Google Chrome',
      currentVersion: '120.0.6099.109',
      availableVersion: '121.0.6167.85',
      publisher: 'Google LLC',
      size: '95.2 MB',
      priority: 'high',
      selected: true,
    },
    {
      name: 'Microsoft Office 365',
      currentVersion: '16.0.17126.20132',
      availableVersion: '16.0.17328.20068',
      publisher: 'Microsoft Corporation',
      size: '2.1 GB',
      priority: 'high',
      selected: true,
    },
    {
      name: 'Adobe Reader DC',
      currentVersion: '23.006.20360',
      availableVersion: '23.008.20470',
      publisher: 'Adobe Inc.',
      size: '256 MB',
      priority: 'medium',
      selected: true,
    },
    {
      name: 'Zoom',
      currentVersion: '5.16.10',
      availableVersion: '5.17.0',
      publisher: 'Zoom Video Communications',
      size: '68.5 MB',
      priority: 'low',
      selected: false,
    },
    {
      name: 'VLC Media Player',
      currentVersion: '3.0.18',
      availableVersion: '3.0.20',
      publisher: 'VideoLAN',
      size: '42.3 MB',
      priority: 'low',
      selected: false,
    },
  ];

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    setUpdates([]);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setUpdates(mockUpdates);
          const highPriority = mockUpdates.filter(u => u.priority === 'high').map(u => u.name);
          setSelectedUpdates(highPriority);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const toggleSelect = (name: string) => {
    setSelectedUpdates((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  const selectAll = () => {
    setSelectedUpdates(updates.map((u) => u.name));
  };

  const deselectAll = () => {
    setSelectedUpdates([]);
  };

  const downloadUpdates = () => {
    alert(`正在下载 ${selectedUpdates.length} 个软件更新...`);
  };

  useEffect(() => {
    startScan();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '重要';
      case 'medium':
        return '推荐';
      case 'low':
        return '可选';
      default:
        return '';
    }
  };

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>软件升级检测</h3>
          <button className="primary-button" onClick={startScan} disabled={scanning}>
            <ArrowUpCircle size={18} />
            {scanning ? '扫描中...' : '重新扫描'}
          </button>
        </div>

        {scanning && (
          <div className="scan-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">正在检测软件更新... {progress}%</p>
          </div>
        )}

        {!scanning && updates.length > 0 && (
          <>
            <div className="scan-summary">
              <div className="summary-item">
                <CheckCircle size={20} color="#27ae60" />
                <span>
                  已是最新：<strong>{updates.filter(u => u.priority === 'low').length}</strong>
                </span>
              </div>
              <div className="summary-item">
                <AlertCircle size={20} color="#f39c12" />
                <span>
                  可更新：<strong>{updates.length}</strong>
                </span>
              </div>
              <div className="summary-item">
                <AlertCircle size={20} color="#e74c3c" />
                <span>
                  重要更新：<strong>{updates.filter(u => u.priority === 'high').length}</strong>
                </span>
              </div>
            </div>

            <div className="action-buttons">
              <button className="secondary-button" onClick={selectAll}>
                全选
              </button>
              <button className="secondary-button" onClick={deselectAll}>
                取消全选
              </button>
              <button
                className="primary-button"
                onClick={downloadUpdates}
                disabled={selectedUpdates.length === 0}
              >
                <Download size={18} />
                下载选中更新 ({selectedUpdates.length})
              </button>
            </div>

            <div className="driver-list">
              {updates.map((update, index) => (
                <div key={index} className="driver-item">
                  <input
                    type="checkbox"
                    checked={selectedUpdates.includes(update.name)}
                    onChange={() => toggleSelect(update.name)}
                    className="driver-checkbox"
                  />
                  <div className="driver-info">
                    <div className="driver-header">
                      <span className="driver-name">{update.name}</span>
                      <span
                        className="driver-status"
                        style={{ color: getPriorityColor(update.priority) }}
                      >
                        {getPriorityText(update.priority)}
                      </span>
                    </div>
                    <div className="driver-details">
                      <span>厂商：{update.publisher}</span>
                      <span>
                        当前：{update.currentVersion} → 最新：{update.availableVersion}
                      </span>
                      <span>更新大小：{update.size}</span>
                    </div>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => toggleSelect(update.name)}
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!scanning && updates.length === 0 && (
          <div className="empty-state">
            <ArrowUpCircle size={64} color="#bdc3c7" />
            <h3>未扫描更新</h3>
            <p>点击"扫描"按钮开始检测软件更新</p>
            <button className="primary-button" onClick={startScan}>
              开始扫描
            </button>
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>💡 软件升级提示</h4>
        <ul>
          <li>及时更新软件可以获取最新功能和安全补丁</li>
          <li>重要更新建议优先下载安装</li>
          <li>大型更新（如 Office）建议在空闲时间下载</li>
          <li>更新前建议保存正在进行的工作</li>
        </ul>
      </div>
    </div>
  );
};

export default SoftwareUpgrade;
