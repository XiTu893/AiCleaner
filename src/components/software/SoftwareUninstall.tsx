import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

interface Software {
  name: string;
  publisher: string;
  version: string;
  uninstallString: string;
  installDate: string;
  location: string;
}

const SoftwareUninstall: React.FC = () => {
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadSoftwareList();
  }, []);

  const loadSoftwareList = async () => {
    setLoading(true);
    try {
      const software = await window.electronAPI.getInstalledSoftware();
      setSoftwareList(software);
      setTotalCount(software.length);
    } catch (error) {
      console.error('Failed to load software list:', error);
      alert('加载软件列表失败：' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (software: Software) => {
    if (!confirm(`确定要卸载 "${software.name}" 吗？\n\n厂商：${software.publisher}\n版本：${software.version}\n\n注意：某些软件可能需要管理员权限才能卸载。`)) {
      return;
    }

    setUninstalling(software.name);
    try {
      const result = await window.electronAPI.uninstallSoftware(software);
      if (result.success) {
        alert(`✅ "${software.name}" 卸载完成！`);
        loadSoftwareList();
      } else {
        alert(`⚠️ "${software.name}" 卸载失败：\n\n${result.error}\n\n建议：\n1. 以管理员身份运行应用后重试\n2. 或手动在控制面板中卸载该软件`);
      }
    } catch (error) {
      console.error('Failed to uninstall software:', error);
      alert(`❌ "${software.name}" 卸载失败：${error}\n\n请尝试手动卸载该软件。`);
    } finally {
      setUninstalling(null);
    }
  };

  const filteredSoftware = softwareList.filter(software =>
    software.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    software.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="sub-feature-container">
      <div className="scan-header">
        <h3>已安装的软件 ({totalCount} 个)</h3>
        <button className="primary-button" onClick={loadSoftwareList} disabled={loading}>
          刷新列表
        </button>
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

      {filteredSoftware.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={64} color="#bdc3c7" />
          <h3>未找到匹配的软件</h3>
          <p>请尝试其他关键词或确认软件已安装</p>
        </div>
      ) : (
        <div className="driver-list">
          {filteredSoftware.map((software, index) => (
            <div key={index} className="driver-item">
              <div className="driver-info">
                <div className="driver-header">
                  <span className="driver-name">{software.name}</span>
                </div>
                <div className="driver-details">
                  <span>厂商：{software.publisher}</span>
                  <span>版本：{software.version}</span>
                  {software.installDate && <span>安装日期：{software.installDate}</span>}
                </div>
              </div>
              <button
                className="primary-button"
                onClick={() => handleUninstall(software)}
                disabled={uninstalling === software.name}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {uninstalling === software.name ? (
                  <>
                    <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
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
          ))}
        </div>
      )}

      <div className="tips-section">
        <h4>💡 卸载提示</h4>
        <ul>
          <li>某些软件可能需要管理员权限才能卸载</li>
          <li>卸载大型软件前建议保存正在进行的工作</li>
          <li>如卸载失败，可尝试在控制面板中手动卸载</li>
          <li>卸载后可使用"安装包清理"功能清理残留文件</li>
        </ul>
      </div>
    </div>
  );
};

export default SoftwareUninstall;
