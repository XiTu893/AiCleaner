import React, { useState } from 'react';
import { HardDrive, RotateCcw, FolderOpen, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface BackupItem {
  id: string;
  name: string;
  version: string;
  backupDate?: string;
  size?: string;
  selected: boolean;
}

const DriverBackup: React.FC = () => {
  const [mode, setMode] = useState<'backup' | 'restore'>('backup');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backupItems, setBackupItems] = useState<BackupItem[]>([]);
  const [restoreItems, setRestoreItems] = useState<BackupItem[]>([]);

  const mockBackupItems: BackupItem[] = [
    { id: '1', name: 'NVIDIA GeForce RTX 3060', version: '31.0.15.3118', selected: true },
    { id: '2', name: 'Intel(R) UHD Graphics', version: '30.0.101.1339', selected: true },
    { id: '3', name: 'Realtek High Definition Audio', version: '6.0.9265.1', selected: true },
    { id: '4', name: 'Intel(R) Wi-Fi 6 AX201', version: '22.190.0.2', selected: true },
    { id: '5', name: 'Bluetooth Device', version: '22.150.0.5', selected: false },
  ];

  const mockRestoreItems: BackupItem[] = [
    {
      id: '1',
      name: 'NVIDIA GeForce RTX 3060',
      version: '31.0.15.3118',
      backupDate: '2024-01-15 14:30',
      size: '512 MB',
      selected: true,
    },
    {
      id: '2',
      name: 'Intel(R) Wi-Fi 6 AX201',
      version: '22.190.0.2',
      backupDate: '2024-01-10 09:15',
      size: '85 MB',
      selected: true,
    },
  ];

  const scanDrivers = () => {
    setScanning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          if (mode === 'backup') {
            setBackupItems(mockBackupItems);
          } else {
            setRestoreItems(mockRestoreItems);
          }
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const toggleSelect = (id: string, isBackup: boolean) => {
    if (isBackup) {
      setBackupItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item
        )
      );
    } else {
      setRestoreItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item
        )
      );
    }
  };

  const selectAll = (isBackup: boolean) => {
    if (isBackup) {
      setBackupItems((prev) => prev.map((item) => ({ ...item, selected: true })));
    } else {
      setRestoreItems((prev) => prev.map((item) => ({ ...item, selected: true })));
    }
  };

  const deselectAll = (isBackup: boolean) => {
    if (isBackup) {
      setBackupItems((prev) => prev.map((item) => ({ ...item, selected: false })));
    } else {
      setRestoreItems((prev) => prev.map((item) => ({ ...item, selected: false })));
    }
  };

  const handleBackup = () => {
    const selected = backupItems.filter((item) => item.selected);
    alert(`正在备份 ${selected.length} 个驱动程序到指定位置...`);
  };

  const handleRestore = () => {
    const selected = restoreItems.filter((item) => item.selected);
    alert(`正在还原 ${selected.length} 个驱动程序...`);
  };

  const handleScan = () => {
    if (mode === 'backup') {
      scanDrivers();
    } else {
      scanDrivers();
    }
  };

  return (
    <div className="sub-feature-container">
      <div className="mode-switch">
        <button
          className={`mode-button ${mode === 'backup' ? 'active' : ''}`}
          onClick={() => setMode('backup')}
        >
          <HardDrive size={18} />
          驱动备份
        </button>
        <button
          className={`mode-button ${mode === 'restore' ? 'active' : ''}`}
          onClick={() => setMode('restore')}
        >
          <RotateCcw size={18} />
          驱动还原
        </button>
      </div>

      {mode === 'backup' ? (
        <div className="backup-section">
          <div className="scan-header">
            <h3>备份当前驱动程序</h3>
            <button className="primary-button" onClick={handleScan} disabled={scanning}>
              <FolderOpen size={18} />
              {scanning ? '扫描中...' : '扫描驱动'}
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
              <p className="progress-text">正在扫描可备份的驱动... {progress}%</p>
            </div>
          )}

          {!scanning && backupItems.length > 0 && (
            <>
              <div className="backup-info">
                <AlertCircle size={20} color="#3498db" />
                <p>
                  备份驱动可以帮助您在驱动更新出现问题时快速恢复到之前的版本。
                  建议定期备份重要驱动。
                </p>
              </div>

              <div className="action-buttons">
                <button className="secondary-button" onClick={() => selectAll(true)}>
                  全选
                </button>
                <button className="secondary-button" onClick={() => deselectAll(true)}>
                  取消全选
                </button>
                <button className="secondary-button" onClick={handleBackup}>
                  <Save size={18} />
                  选择备份位置
                </button>
                <button
                  className="primary-button"
                  onClick={handleBackup}
                  disabled={backupItems.filter((i) => i.selected).length === 0}
                >
                  <HardDrive size={18} />
                  开始备份 ({backupItems.filter((i) => i.selected).length})
                </button>
              </div>

              <div className="driver-list">
                {backupItems.map((item) => (
                  <div key={item.id} className="driver-item">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelect(item.id, true)}
                      className="driver-checkbox"
                    />
                    <div className="driver-info">
                      <div className="driver-header">
                        <span className="driver-name">{item.name}</span>
                        <CheckCircle size={16} color="#27ae60" />
                      </div>
                      <div className="driver-details">
                        <span className="driver-version">版本：{item.version}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!scanning && backupItems.length === 0 && (
          <div className="empty-state">
            <HardDrive size={64} color="#bdc3c7" />
            <h3>未扫描驱动</h3>
              <p>点击"扫描驱动"按钮开始检测可备份的驱动程序</p>
              <button className="primary-button" onClick={handleScan}>
                开始扫描
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="restore-section">
          <div className="scan-header">
            <h3>还原已备份的驱动</h3>
            <button className="primary-button" onClick={handleScan} disabled={scanning}>
              <FolderOpen size={18} />
              {scanning ? '扫描中...' : '查找备份'}
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
              <p className="progress-text">正在查找可用的备份... {progress}%</p>
            </div>
          )}

          {!scanning && restoreItems.length > 0 && (
            <>
              <div className="backup-info">
                <AlertCircle size={20} color="#f39c12" />
                <p>
                  还原驱动将替换当前驱动程序为备份版本。
                  请确保选择正确的备份版本，还原过程中不要关闭程序。
                </p>
              </div>

              <div className="action-buttons">
                <button className="secondary-button" onClick={() => selectAll(false)}>
                  全选
                </button>
                <button className="secondary-button" onClick={() => deselectAll(false)}>
                  取消全选
                </button>
                <button
                  className="primary-button"
                  onClick={handleRestore}
                  disabled={restoreItems.filter((i) => i.selected).length === 0}
                >
                  <RotateCcw size={18} />
                  开始还原 ({restoreItems.filter((i) => i.selected).length})
                </button>
              </div>

              <div className="driver-list">
                {restoreItems.map((item) => (
                  <div key={item.id} className="driver-item">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelect(item.id, false)}
                      className="driver-checkbox"
                    />
                    <div className="driver-info">
                      <div className="driver-header">
                        <span className="driver-name">{item.name}</span>
                        <span className="driver-backup-date">{item.backupDate}</span>
                      </div>
                      <div className="driver-details">
                        <span className="driver-version">版本：{item.version}</span>
                        <span className="driver-size">大小：{item.size}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!scanning && restoreItems.length === 0 && (
            <div className="empty-state">
              <RotateCcw size={64} color="#bdc3c7" />
              <h3>未找到备份</h3>
              <p>点击"查找备份"按钮搜索可用的驱动备份文件</p>
              <button className="primary-button" onClick={handleScan}>
                开始扫描
              </button>
            </div>
          )}
        </div>
      )}

      <div className="tips-section">
        <h4>💡 备份与还原提示</h4>
        <ul>
          <li>建议在新装系统或更新驱动前先备份当前驱动</li>
          <li>备份文件会占用磁盘空间，请定期清理旧备份</li>
          <li>还原驱动后可能需要重启系统才能生效</li>
          <li>如还原后出现问题，可尝试系统还原点恢复</li>
        </ul>
      </div>
    </div>
  );
};

export default DriverBackup;
