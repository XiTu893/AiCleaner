import React, { useState } from 'react';
import { Scissors, Trash2, Shield, AlertTriangle, FolderOpen } from 'lucide-react';

interface ShredFile {
  id: string;
  name: string;
  path: string;
  size: string;
  type: string;
  selected: boolean;
}

const FileShredder: React.FC = () => {
  const [files, setFiles] = useState<ShredFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [shredding, setShredding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [method, setMethod] = useState<'fast' | 'dod' | 'guttman'>('dod');

  const mockFiles: ShredFile[] = [
    {
      id: '1',
      name: '财务数据 2023.xlsx',
      path: 'C:\\Users\\Documents\\财务数据 2023.xlsx',
      size: '5.2 MB',
      type: 'Excel 文件',
      selected: true,
    },
    {
      id: '2',
      name: '合同扫描件.pdf',
      path: 'C:\\Users\\Documents\\合同扫描件.pdf',
      size: '12.8 MB',
      type: 'PDF 文件',
      selected: true,
    },
    {
      id: '3',
      name: '个人照片.jpg',
      path: 'C:\\Users\\Pictures\\个人照片.jpg',
      size: '3.5 MB',
      type: '图片',
      selected: false,
    },
    {
      id: '4',
      name: '密码记录.txt',
      path: 'C:\\Users\\Documents\\密码记录.txt',
      size: '12 KB',
      type: '文本文件',
      selected: true,
    },
  ];

  const addFiles = () => {
    setFiles(mockFiles);
    setSelectedFiles(mockFiles.map(f => f.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedFiles(files.map((f) => f.id));
  };

  const deselectAll = () => {
    setSelectedFiles([]);
  };

  const removeSelected = () => {
    setFiles(files.filter(f => !selectedFiles.includes(f.id)));
    setSelectedFiles([]);
  };

  const startShred = () => {
    if (!confirm('⚠️ 警告：文件粉碎后无法恢复！\n\n确定要永久删除选中的文件吗？')) {
      return;
    }

    setShredding(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setShredding(false);
          alert('✅ 文件已安全粉碎，无法恢复！');
          setFiles([]);
          setSelectedFiles([]);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const getMethodDesc = () => {
    switch (method) {
      case 'fast':
        return '快速覆盖 (1 次)';
      case 'dod':
        return 'DoD 5220.22-M (3 次)';
      case 'guttman':
        return 'Guttman (35 次)';
      default:
        return '';
    }
  };

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>文件粉碎机</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              <option value="fast">快速覆盖 (1 次)</option>
              <option value="dod">DoD 5220.22-M (3 次)</option>
              <option value="guttman">Guttman (35 次)</option>
            </select>
            <button className="secondary-button" onClick={addFiles}>
              <FolderOpen size={18} />
              添加文件
            </button>
          </div>
        </div>

        <div className="shred-method">
          <Shield size={20} color="#e74c3c" />
          <span>当前粉碎方式：<strong>{getMethodDesc()}</strong></span>
        </div>

        {files.length > 0 && (
          <>
            <div className="action-buttons">
              <button className="secondary-button" onClick={selectAll}>
                全选
              </button>
              <button className="secondary-button" onClick={deselectAll}>
                取消全选
              </button>
              <button className="secondary-button" onClick={removeSelected}>
                移除选中
              </button>
              <button
                className="primary-button"
                onClick={startShred}
                disabled={selectedFiles.length === 0 || shredding}
                style={{ backgroundColor: '#e74c3c' }}
              >
                <Scissors size={18} />
                {shredding ? '粉碎中...' : `开始粉碎 (${selectedFiles.length})`}
              </button>
            </div>

            {shredding && (
              <div className="scan-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%`, backgroundColor: '#e74c3c' }}
                  ></div>
                </div>
                <p className="progress-text">正在安全粉碎文件... {progress}%</p>
                <p className="scan-detail">正在覆盖数据 {Math.floor(progress / 3)} 次...</p>
              </div>
            )}

            <div className="driver-list">
              {files.map((file) => (
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
                      <span>大小：{file.size}</span>
                      <span>路径：{file.path}</span>
                    </div>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => toggleSelect(file.id)}
                  >
                    <Scissors size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {files.length === 0 && (
          <div className="empty-state">
            <Scissors size={64} color="#e74c3c" />
            <h3>文件粉碎机</h3>
            <p>永久删除敏感文件，覆盖后无法恢复</p>
            <button className="primary-button" onClick={addFiles}>
              添加文件
            </button>
          </div>
        )}
      </div>

      <div className="tips-section" style={{ backgroundColor: '#fdedec' }}>
        <h4>⚠️ 重要提示</h4>
        <ul>
          <li>文件粉碎后<strong>无法恢复</strong>，请谨慎操作！</li>
          <li>DoD 5220.22-M 标准：美国国防部标准，覆盖 3 次</li>
          <li>Guttman 算法：覆盖 35 次，最安全但速度最慢</li>
          <li>适用于删除敏感文件、财务数据、个人隐私等</li>
          <li>SSD 硬盘建议使用安全擦除工具而非文件粉碎</li>
        </ul>
      </div>
    </div>
  );
};

export default FileShredder;
