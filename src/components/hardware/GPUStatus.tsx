import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle, AlertTriangle } from 'lucide-react';

interface GPUInfo {
  name: string;
  adapterRAM: number;
  driverVersion: string;
  status: string;
}

const GPUStatus: React.FC = () => {
  const [gpus, setGPUs] = useState<GPUInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadGPUInfo();
    const interval = setInterval(loadGPUInfo, 10000); // 每 10 秒更新一次
    return () => clearInterval(interval);
  }, []);

  const loadGPUInfo = async () => {
    try {
      const gpuData = await window.electronAPI.getGPUInfo();
      setGPUs(gpuData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load GPU info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatVRAM = (bytes: number) => {
    if (!bytes || bytes === 0) return '未知';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'OK' || status === '正常') {
      return <CheckCircle size={20} color="#27ae60" />;
    }
    return <AlertTriangle size={20} color="#e74c3c" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'OK' || status === '正常') {
      return { text: '正常', color: '#27ae60' };
    }
    return { text: status || '未知', color: '#e74c3c' };
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
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🎮 显卡信息</h2>
        <span style={{ fontSize: '13px', color: '#7f8c8d' }}>
          最后更新：{lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {gpus.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7f8c8d' }}>
            <Cpu size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
            <p>未检测到显卡信息</p>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <Cpu size={40} color="#9b59b6" style={{ marginBottom: '15px' }} />
              <div className="stat-value">{gpus.length}</div>
              <div className="stat-label">显卡数量</div>
            </div>
          </div>

          {gpus.map((gpu, index) => {
            const statusInfo = getStatusText(gpu.status);
            return (
              <div key={index} className="card">
                <div className="card-title">
                  <Cpu size={24} />
                  显卡 {index + 1}
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(gpu.status)}
                    <span style={{ color: statusInfo.color, fontSize: '14px', fontWeight: 'bold' }}>
                      {statusInfo.text}
                    </span>
                  </span>
                </div>

                <div className="info-grid">
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="info-label">显卡名称</div>
                    <div className="info-value" style={{ fontSize: '16px' }}>{gpu.name}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">显存容量</div>
                    <div className="info-value">{formatVRAM(gpu.adapterRAM)}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">驱动版本</div>
                    <div className="info-value" style={{ fontSize: '14px' }}>{gpu.driverVersion}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">状态</div>
                    <div className="info-value" style={{ color: statusInfo.color }}>
                      {statusInfo.text}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#2c3e50', fontSize: '14px' }}>💡 显卡信息</h4>
                  <ul style={{ listStyle: 'none', color: '#7f8c8d', lineHeight: '2', fontSize: '13px' }}>
                    <li>• 显卡型号：{gpu.name}</li>
                    <li>• 显存大小：{formatVRAM(gpu.adapterRAM)}</li>
                    <li>• 驱动版本：{gpu.driverVersion}</li>
                    <li>• 运行状态：{statusInfo.text}</li>
                  </ul>
                </div>
              </div>
            );
          })}

          <div className="card">
            <div className="card-title">📊 显卡使用建议</div>
            <ul style={{ listStyle: 'none', padding: '20px', color: '#7f8c8d', lineHeight: '2.5' }}>
              <li>✅ 定期更新显卡驱动，获得最佳性能</li>
              <li>✅ 监控显卡温度，避免过热损坏</li>
              <li>✅ 游戏或渲染时确保良好散热</li>
              <li>✅ 如发现异常，及时检查显卡状态</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default GPUStatus;
