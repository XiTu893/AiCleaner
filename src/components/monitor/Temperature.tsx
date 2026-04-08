import React, { useState, useEffect } from 'react';
import { Thermometer } from 'lucide-react';

interface TemperatureData {
  cpu: number;
  gpu: number;
  available: boolean;
  error?: string;
}

const Temperature: React.FC = () => {
  const [temperature, setTemperature] = useState<TemperatureData>({ cpu: 0, gpu: 0, available: false });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadTemperature();
    const interval = setInterval(loadTemperature, 3000); // 每 3 秒更新一次
    return () => clearInterval(interval);
  }, []);

  const loadTemperature = async () => {
    try {
      const temp = await window.electronAPI.getTemperature();
      setTemperature({ ...temp, available: temp.available !== undefined ? temp.available : true });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load temperature:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTempStatus = (temp: number) => {
    if (temp <= 0) return '未检测到';
    if (temp >= 80) return '高温';
    if (temp >= 60) return '正常';
    return '良好';
  };

  const getTempColor = (temp: number) => {
    if (temp <= 0) return '#7f8c8d';
    if (temp >= 80) return '#e74c3c';
    if (temp >= 60) return '#f39c12';
    return '#27ae60';
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
        <h2>🌡️ 温度监控</h2>
      </div>

      <div className="card">
        <div className="card-title">
          <Thermometer size={24} />
          实时温度 {lastUpdate && <span style={{ fontSize: '12px', color: '#7f8c8d', marginLeft: '10px' }}>（最后更新：{lastUpdate.toLocaleTimeString()}）</span>}
        </div>

        {!temperature.available ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7f8c8d' }}>
            <Thermometer size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '10px', color: '#e74c3c' }}>温度数据不可用</h3>
            <p style={{ marginBottom: '20px' }}>
              当前系统无法提供温度数据<br/>
              这可能是因为硬件不支持或需要管理员权限
            </p>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'left', display: 'inline-block' }}>
              <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>💡 解决方案：</h4>
              <ul style={{ color: '#7f8c8d', lineHeight: '2', paddingLeft: '20px' }}>
                <li>✓ 尝试以<b>管理员身份运行</b>应用</li>
                <li>✓ 某些硬件可能不支持温度读取</li>
                <li>✓ BIOS 中可能禁用了温度传感器</li>
                <li>✓ 可能需要安装硬件监控驱动</li>
              </ul>
            </div>
            {temperature.error && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', color: '#856404', border: '1px solid #ffc107' }}>
                <strong>错误信息：</strong>{temperature.error}
              </div>
            )}
          </div>
        ) : (
          <div className="temperature-display">
            <div className="temp-item" style={{ border: `3px solid ${getTempColor(temperature.cpu)}` }}>
              <div className="temp-value" style={{ color: getTempColor(temperature.cpu) }}>
                {temperature.cpu > 0 ? `${temperature.cpu.toFixed(1)}°C` : '--'}
              </div>
              <div className="temp-label">CPU 温度</div>
              <div style={{ marginTop: '10px', fontSize: '14px', color: getTempColor(temperature.cpu) }}>
                状态：{getTempStatus(temperature.cpu)}
              </div>
            </div>

            <div className="temp-item" style={{ border: `3px solid ${getTempColor(temperature.gpu)}` }}>
              <div className="temp-value" style={{ color: getTempColor(temperature.gpu) }}>
                {temperature.gpu > 0 ? `${temperature.gpu.toFixed(1)}°C` : '--'}
              </div>
              <div className="temp-label">GPU 温度</div>
              <div style={{ marginTop: '10px', fontSize: '14px', color: getTempColor(temperature.gpu) }}>
                状态：{getTempStatus(temperature.gpu)}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>💡 温度建议</h3>
          <ul style={{ listStyle: 'none', color: '#7f8c8d', lineHeight: '2' }}>
            <li>• CPU 温度低于 60°C：散热良好，无需担心</li>
            <li>• CPU 温度 60-80°C：正常范围，注意通风</li>
            <li>• CPU 温度高于 80°C：温度过高，建议清理灰尘或改善散热</li>
            <li>• GPU 温度建议保持在 75°C 以下</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Temperature;
