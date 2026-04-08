import React, { useState, useEffect } from 'react';
import { Database, Search, RotateCcw, HardDrive } from 'lucide-react';

interface RecoverableFile {
  id: string;
  name: string;
  path: string;
  size: string;
  date: string;
  type: string;
  recoverable: boolean;
  selected: boolean;
}

interface DriveInfo {
  letter: string;
  name: string;
  type: string;
  totalSize: string;
  freeSize: string;
  selected: boolean;
}

const DataRecovery: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<RecoverableFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);

  const mockFiles: RecoverableFile[] = [
    {
      id: '1',
      name: '重要文档.docx',
      path: 'C:\\Users\\Documents\\重要文档.docx',
      size: '2.5 MB',
      date: '2024-01-15',
      type: 'Word 文档',
      recoverable: true,
      selected: true,
    },
    {
      id: '2',
      name: '照片_20240115.jpg',
      path: 'C:\\Users\\Pictures\\照片_20240115.jpg',
      size: '4.8 MB',
      date: '2024-01-15',
      type: '图片',
      recoverable: true,
      selected: true,
    },
    {
      id: '3',
      name: '项目报告.pdf',
      path: 'C:\\Users\\Downloads\\项目报告.pdf',
      size: '1.2 MB',
      date: '2024-01-14',
      type: 'PDF 文件',
      recoverable: true,
      selected: false,
    },
    {
      id: '4',
      name: '视频剪辑.mp4',
      path: 'C:\\Users\\Videos\\视频剪辑.mp4',
      size: '125 MB',
      date: '2024-01-13',
      type: '视频',
      recoverable: false,
      selected: false,
    },
    {
      id: '5',
      name: '工作表格.xlsx',
      path: 'C:\\Users\\Documents\\工作表格.xlsx',
      size: '3.6 MB',
      date: '2024-01-12',
      type: 'Excel 表格',
      recoverable: true,
      selected: true,
    },
  ];

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    try {
      const disks = await window.electronAPI.getDiskInfo();
      const driveList: DriveInfo[] = [
        { letter: 'C:', name: '系统盘', type: 'Local Disk', totalSize: '500 GB', freeSize: '150 GB', selected: true },
        { letter: 'D:', name: '数据盘', type: 'Local Disk', totalSize: '1 TB', freeSize: '600 GB', selected: false },
        { letter: 'E:', name: '备份盘', type: 'Local Disk', totalSize: '2 TB', freeSize: '1.2 TB', selected: false },
      ];
      setDrives(driveList);
    } catch (error) {
      const fallbackDrives: DriveInfo[] = [
        { letter: 'C:', name: '系统盘', type: 'Local Disk', totalSize: '500 GB', freeSize: '150 GB', selected: true },
        { letter: 'D:', name: '数据盘', type: 'Local Disk', totalSize: '1 TB', freeSize: '600 GB', selected: false },
      ];
      setDrives(fallbackDrives);
    } finally {
      setLoadingDrives(false);
    }
  };

  const toggleDrive = (letter: string) => {
    setDrives(prev => prev.map(drive => 
      drive.letter === letter ? { ...drive, selected: !drive.selected } : drive
    ));
  };

  const selectAllDrives = () => {
    setDrives(prev => prev.map(drive => ({ ...drive, selected: true })));
  };

  const deselectAllDrives = () => {
    setDrives(prev => prev.map(drive => ({ ...drive, selected: false })));
  };

  const startScan = () => {
    const selectedDrives = drives.filter(d => d.selected);
    if (selectedDrives.length === 0) {
      alert('请至少选择一个磁盘进行扫描');
      return;
    }

    setScanning(true);
    setProgress(0);
    setFiles([]);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setFiles(mockFiles);
          const recoverable = mockFiles.filter(f => f.recoverable).map(f => f.id);
          setSelectedFiles(recoverable);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const toggleSelect = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedFiles(files.filter(f => f.recoverable).map(f => f.id));
  };

  const deselectAll = () => {
    setSelectedFiles([]);
  };

  const recoverFiles = () => {
    const count = selectedFiles.length;
    alert(`正在恢复 ${count} 个文件...\n\n请选择恢复目标位置`);
  };

  const selectedDrivesCount = drives.filter(d => d.selected).length;

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>数据恢复扫描</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="primary-button" onClick={startScan} disabled={scanning || selectedDrivesCount === 0}>
              <Search size={18} />
              {scanning ? '扫描中...' : '开始扫描'}
            </button>
          </div>
        </div>

        {!scanning && files.length === 0 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title" style={{ marginBottom: '15px' }}>
              <HardDrive size={18} />
              选择要扫描的磁盘
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button 
                  className="secondary-button" 
                  onClick={selectAllDrives}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  全选
                </button>
                <button 
                  className="secondary-button" 
                  onClick={deselectAllDrives}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  取消全选
                </button>
              </div>
            </div>

            {loadingDrives ? (
              <div className="loading">
                <div className="spinner"></div>
                <p className="loading-text">正在加载磁盘信息...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {drives.map((drive) => (
                  <div
                    key={drive.letter}
                    style={{
                      padding: '15px',
                      background: drive.selected ? 'var(--primary-color-light)' : 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: `2px solid ${drive.selected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => toggleDrive(drive.letter)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="checkbox"
                        checked={drive.selected}
                        onChange={() => toggleDrive(drive.letter)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: drive.selected ? 'var(--primary-color)' : 'var(--text-secondary)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-light)'
                      }}>
                        <HardDrive size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)' }}>
                          {drive.letter}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {drive.name}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      可用: {drive.freeSize} / {drive.totalSize}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {scanning && (
          <div className="scan-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">
              正在扫描 {drives.filter(d => d.selected).map(d => d.letter).join(', ')} ... {progress}%
            </p>
            <p className="scan-detail">正在分析文件系统结构...</p>
          </div>
        )}

        {!scanning && files.length > 0 && (
          <>
            <div className="scan-summary">
              <div className="summary-item">
                <Database size={20} color="#3498db" />
                <span>
                  找到文件：<strong>{files.length}</strong>
                </span>
              </div>
              <div className="summary-item">
                <HardDrive size={20} color="#27ae60" />
                <span>
                  可恢复：<strong>{files.filter(f => f.recoverable).length}</strong>
                </span>
              </div>
              <div className="summary-item">
                <RotateCcw size={20} color="#e74c3c" />
                <span>
                  已损坏：<strong>{files.filter(f => !f.recoverable).length}</strong>
                </span>
              </div>
            </div>

            <div className="action-buttons">
              <button className="secondary-button" onClick={selectAll}>
                全选可恢复文件
              </button>
              <button className="secondary-button" onClick={deselectAll}>
                取消全选
              </button>
              <button
                className="primary-button"
                onClick={recoverFiles}
                disabled={selectedFiles.length === 0}
              >
                <RotateCcw size={18} />
                恢复选中文件 ({selectedFiles.length})
              </button>
            </div>

            <div className="driver-list">
              {files.map((file) => (
                <div key={file.id} className="driver-item">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleSelect(file.id)}
                    disabled={!file.recoverable}
                    className="driver-checkbox"
                  />
                  <div className="driver-info">
                    <div className="driver-header">
                      <span className="driver-name">{file.name}</span>
                      <span
                        className={`driver-status ${
                          file.recoverable ? 'normal' : 'missing'
                        }`}
                      >
                        {file.recoverable ? '可恢复' : '已损坏'}
                      </span>
                    </div>
                    <div className="driver-details">
                      <span>类型：{file.type}</span>
                      <span>大小：{file.size}</span>
                      <span>删除日期：{file.date}</span>
                      <span>路径：{file.path}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!scanning && files.length === 0 && (
          <div className="empty-state">
            <Database size={64} color="#bdc3c7" />
            <h3>数据恢复</h3>
            <p>选择磁盘后开始扫描，支持 NTFS/FAT32 文件系统</p>
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>💡 数据恢复提示</h4>
        <ul>
          <li>文件删除后尽快扫描，恢复成功率更高</li>
          <li>避免向丢失文件所在分区写入新数据</li>
          <li>恢复的文件建议保存到其他磁盘分区</li>
          <li>SSD 硬盘由于 TRIM 特性，恢复成功率较低</li>
        </ul>
      </div>
    </div>
  );
};

export default DataRecovery;
