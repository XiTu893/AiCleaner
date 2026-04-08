import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertTriangle, Download, RotateCcw } from 'lucide-react';

interface Driver {
  name: string;
  version: string;
  status: 'normal' | 'outdated' | 'missing';
  updateAvailable?: string;
  category: string;
}

const DriverDetect: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  const mockDrivers: Driver[] = [
    {
      name: 'NVIDIA GeForce RTX 3060',
      version: '31.0.15.3118',
      status: 'outdated',
      updateAvailable: '31.0.15.3623',
      category: '显卡驱动',
    },
    {
      name: 'Intel(R) UHD Graphics',
      version: '30.0.101.1339',
      status: 'normal',
      category: '显卡驱动',
    },
    {
      name: 'Realtek High Definition Audio',
      version: '6.0.9265.1',
      status: 'normal',
      category: '声卡驱动',
    },
    {
      name: 'Intel(R) Wi-Fi 6 AX201',
      version: '22.190.0.2',
      status: 'outdated',
      updateAvailable: '22.200.0.10',
      category: '网卡驱动',
    },
    {
      name: 'Bluetooth Device',
      version: '',
      status: 'missing',
      category: '蓝牙驱动',
    },
    {
      name: 'Canon MF Network Scanner',
      version: '1.03.0003',
      status: 'normal',
      category: '打印机驱动',
    },
  ];

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    setDrivers([]);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setDrivers(mockDrivers);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const toggleSelect = (driverName: string) => {
    setSelectedDrivers((prev) =>
      prev.includes(driverName)
        ? prev.filter((d) => d !== driverName)
        : [...prev, driverName]
    );
  };

  const selectAll = () => {
    const outdatedOrMissing = drivers
      .filter((d) => d.status === 'outdated' || d.status === 'missing')
      .map((d) => d.name);
    setSelectedDrivers(outdatedOrMissing);
  };

  const deselectAll = () => {
    setSelectedDrivers([]);
  };

  const downloadSelected = () => {
    alert(`正在下载 ${selectedDrivers.length} 个驱动程序...`);
  };

  useEffect(() => {
    startScan();
  }, []);

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>驱动状态检测</h3>
          <button className="primary-button" onClick={startScan} disabled={scanning}>
            <Search size={18} />
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
            <p className="progress-text">正在扫描系统驱动... {progress}%</p>
          </div>
        )}

        {!scanning && drivers.length > 0 && (
          <>
            <div className="scan-summary">
              <div className="summary-item">
                <CheckCircle size={20} color="#27ae60" />
                <span>
                  正常：<strong>{drivers.filter((d) => d.status === 'normal').length}</strong>
                </span>
              </div>
              <div className="summary-item">
                <AlertTriangle size={20} color="#f39c12" />
                <span>
                  可更新：<strong>{drivers.filter((d) => d.status === 'outdated').length}</strong>
                </span>
              </div>
              <div className="summary-item">
                <AlertTriangle size={20} color="#e74c3c" />
                <span>
                  缺失：<strong>{drivers.filter((d) => d.status === 'missing').length}</strong>
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
                onClick={downloadSelected}
                disabled={selectedDrivers.length === 0}
              >
                <Download size={18} />
                下载选中驱动 ({selectedDrivers.length})
              </button>
            </div>

            <div className="driver-list">
              {drivers.map((driver, index) => (
                <div key={index} className="driver-item">
                  <input
                    type="checkbox"
                    checked={selectedDrivers.includes(driver.name)}
                    onChange={() => toggleSelect(driver.name)}
                    disabled={driver.status === 'normal'}
                    className="driver-checkbox"
                  />
                  <div className="driver-info">
                    <div className="driver-header">
                      <span className="driver-name">{driver.name}</span>
                      <span className={`driver-status ${driver.status}`}>
                        {driver.status === 'normal' && '正常'}
                        {driver.status === 'outdated' && '可更新'}
                        {driver.status === 'missing' && '缺失'}
                      </span>
                    </div>
                    <div className="driver-details">
                      <span className="driver-category">{driver.category}</span>
                      <span className="driver-version">
                        当前版本：{driver.version || '未知'}
                      </span>
                      {driver.updateAvailable && (
                        <span className="driver-update">
                          最新版本：{driver.updateAvailable}
                        </span>
                      )}
                    </div>
                  </div>
                  {driver.status !== 'normal' && (
                    <button className="icon-button">
                      <Download size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {!scanning && drivers.length === 0 && (
          <div className="empty-state">
            <Search size={64} color="#bdc3c7" />
            <h3>未扫描驱动</h3>
            <p>点击"扫描"按钮开始检测系统驱动状态</p>
            <button className="primary-button" onClick={startScan}>
              开始扫描
            </button>
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>💡 驱动维护提示</h4>
        <ul>
          <li>定期更新驱动可提升系统性能和稳定性</li>
          <li>建议优先更新显卡、网卡等关键驱动</li>
          <li>更新驱动前建议创建系统还原点</li>
          <li>如驱动更新后出现问题，可使用"驱动备份/还原"功能恢复</li>
        </ul>
      </div>
    </div>
  );
};

export default DriverDetect;
