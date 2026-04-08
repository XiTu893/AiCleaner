import React, { useState, useEffect } from 'react';
import { Package, Trash2, Search, HardDrive } from 'lucide-react';

interface InstallerFile {
  id: string;
  name: string;
  path: string;
  size: string;
  sizeBytes: number;
  date: string;
  type: string;
  selected: boolean;
}

const PackageCleaner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [installerFiles, setInstallerFiles] = useState<InstallerFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  const mockFiles: InstallerFile[] = [
    {
      id: '1',
      name: 'ChromeSetup.exe',
      path: 'C:\\Users\\Downloads\\ChromeSetup.exe',
      size: '95.2 MB',
      sizeBytes: 99824435,
      date: '2024-01-15',
      type: '安装包',
      selected: true,
    },
    {
      id: '2',
      name: 'Office365Installer.exe',
      path: 'C:\\Users\\Downloads\\Office365Installer.exe',
      size: '2.1 GB',
      sizeBytes: 2254857830,
      date: '2024-01-10',
      type: '安装包',
      selected: true,
    },
    {
      id: '3',
      name: 'ZoomInstaller.msi',
      path: 'C:\\Users\\Downloads\\ZoomInstaller.msi',
      size: '68.5 MB',
      sizeBytes: 71832371,
      date: '2024-01-12',
      type: '安装包',
      selected: true,
    },
    {
      id: '4',
      name: 'VLCSetup.exe',
      path: 'C:\\Users\\Downloads\\VLCSetup.exe',
      size: '42.3 MB',
      sizeBytes: 44351283,
      date: '2024-01-08',
      type: '安装包',
      selected: false,
    },
    {
      id: '5',
      name: 'AdobeReaderDC.exe',
      path: 'C:\\Users\\Downloads\\AdobeReaderDC.exe',
      size: '256 MB',
      sizeBytes: 268435456,
      date: '2024-01-05',
      type: '安装包',
      selected: true,
    },
  ];

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    setInstallerFiles([]);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setInstallerFiles(mockFiles);
          setSelectedFiles(mockFiles.map(f => f.id));
          const total = mockFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
          setTotalSize(total);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const toggleSelect = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedFiles(installerFiles.map((f) => f.id));
  };

  const deselectAll = () => {
    setSelectedFiles([]);
  };

  const cleanSelected = () => {
    const count = selectedFiles.length;
    const size = installerFiles
      .filter(f => selectedFiles.includes(f.id))
      .reduce((sum, f) => sum + f.sizeBytes, 0);
    alert(`确定要删除选中的 ${count} 个安装包文件吗？\n\n将释放 ${formatSize(size)} 空间`);
  };

  const formatSize = (bytes: number): string => {
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(2)} GB`;
    } else if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  useEffect(() => {
    startScan();
  }, []);

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>安装包文件扫描</h3>
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
            <p className="progress-text">正在扫描安装包文件... {progress}%</p>
          </div>
        )}

        {!scanning && installerFiles.length > 0 && (
          <>
            <div className="scan-summary">
              <div className="summary-item">
                <Package size={20} color="#3498db" />
                <span>
                  安装包数量：<strong>{installerFiles.length}</strong>
                </span>
              </div>
              <div className="summary-item">
                <HardDrive size={20} color="#e74c3c" />
                <span>
                  占用空间：<strong>{formatSize(totalSize)}</strong>
                </span>
              </div>
              <div className="summary-item">
                <Trash2 size={20} color="#27ae60" />
                <span>
                  可选清理：<strong>{formatSize(selectedFiles.reduce((sum, id) => {
                    const file = installerFiles.find(f => f.id === id);
                    return sum + (file?.sizeBytes || 0);
                  }, 0))}</strong>
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
                onClick={cleanSelected}
                disabled={selectedFiles.length === 0}
              >
                <Trash2 size={18} />
                清理选中文件 ({selectedFiles.length})
              </button>
            </div>

            <div className="driver-list">
              {installerFiles.map((file) => (
                <div key={file.id} className="driver-item">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleSelect(file.id)}
                    className="driver-checkbox"
                  />
                  <div className="driver-info">
                    <div className="driver-header">
                      <span className="driver-name">{file.name}</span>
                      <span className="driver-type">{file.type}</span>
                    </div>
                    <div className="driver-details">
                      <span>路径：{file.path}</span>
                      <span>大小：{file.size}</span>
                      <span>日期：{file.date}</span>
                    </div>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => toggleSelect(file.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!scanning && installerFiles.length === 0 && (
          <div className="empty-state">
            <Package size={64} color="#bdc3c7" />
            <h3>未扫描安装包</h3>
            <p>点击"扫描"按钮开始检测系统中的安装包文件</p>
            <button className="primary-button" onClick={startScan}>
              开始扫描
            </button>
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>💡 安装包清理提示</h4>
        <ul>
          <li>安装包文件通常是 .exe、.msi 格式，安装完成后可安全删除</li>
          <li>清理安装包可以释放大量磁盘空间</li>
          <li>建议保留常用软件的安装包以便快速重装</li>
          <li>删除前请确认软件已经成功安装</li>
        </ul>
      </div>
    </div>
  );
};

export default PackageCleaner;
