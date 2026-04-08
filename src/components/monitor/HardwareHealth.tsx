import React, { useState } from 'react';
import { Heart, CheckCircle, AlertTriangle, XCircle, HardDrive, Battery } from 'lucide-react';

const HardwareHealth: React.FC = () => {
  const [healthData] = useState({
    disk: {
      status: 'good',
      health: 95,
      powerOnHours: 2580,
      powerOnCount: 856,
      temperature: 35,
      badSectors: 0,
    },
    battery: {
      status: 'warning',
      health: 78,
      designCapacity: 50000,
      fullChargeCapacity: 39000,
      cycleCount: 356,
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle size={24} color="#27ae60" />;
      case 'warning':
        return <AlertTriangle size={24} color="#f39c12" />;
      case 'error':
        return <XCircle size={24} color="#e74c3c" />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* 硬盘健康 */}
      <div className="card">
        <div className="card-title">
          <HardDrive size={20} />
          硬盘健康状态
        </div>
        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '10px', background: 'white', borderRadius: '8px' }}>
                {getStatusIcon(healthData.disk.status)}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>系统硬盘</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                  状态：{healthData.disk.status === 'good' ? '良好' : healthData.disk.status === 'warning' ? '注意' : '警告'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>{healthData.disk.health}%</div>
              <div style={{ fontSize: '13px', color: '#7f8c8d' }}>健康度</div>
            </div>
          </div>
          <div style={{ height: '10px', background: '#ecf0f1', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${healthData.disk.health}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">通电时间</div>
            <div className="info-value">{healthData.disk.powerOnHours} 小时</div>
          </div>
          <div className="info-item">
            <div className="info-label">通电次数</div>
            <div className="info-value">{healthData.disk.powerOnCount} 次</div>
          </div>
          <div className="info-item">
            <div className="info-label">当前温度</div>
            <div className="info-value">{healthData.disk.temperature}°C</div>
          </div>
          <div className="info-item">
            <div className="info-label">坏道数量</div>
            <div className="info-value" style={{ color: healthData.disk.badSectors > 0 ? '#e74c3c' : '#27ae60' }}>
              {healthData.disk.badSectors} 个
            </div>
          </div>
        </div>
      </div>

      {/* 电池健康 */}
      <div className="card">
        <div className="card-title">
          <Battery size={20} />
          电池健康状态
        </div>
        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '10px', background: 'white', borderRadius: '8px' }}>
                {getStatusIcon(healthData.battery.status)}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>笔记本电池</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                  状态：{healthData.battery.status === 'good' ? '良好' : '需关注'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f39c12' }}>{healthData.battery.health}%</div>
              <div style={{ fontSize: '13px', color: '#7f8c8d' }}>健康度</div>
            </div>
          </div>
          <div style={{ height: '10px', background: '#ecf0f1', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${healthData.battery.health}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f39c12, #f1c40f)',
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">设计容量</div>
            <div className="info-value">{healthData.battery.designCapacity} mAh</div>
          </div>
          <div className="info-item">
            <div className="info-label">充满容量</div>
            <div className="info-value">{healthData.battery.fullChargeCapacity} mAh</div>
          </div>
          <div className="info-item">
            <div className="info-label">循环次数</div>
            <div className="info-value">{healthData.battery.cycleCount} 次</div>
          </div>
          <div className="info-item">
            <div className="info-label">损耗程度</div>
            <div className="info-value" style={{ color: '#f39c12' }}>{100 - healthData.battery.health}%</div>
          </div>
        </div>
      </div>

      {/* 健康建议 */}
      <div className="card">
        <div className="card-title">💡 健康建议</div>
        <div style={{ lineHeight: '2', color: '#7f8c8d' }}>
          <p>• <strong style={{ color: '#2c3e50' }}>硬盘保养：</strong>避免频繁读写，定期整理碎片，保持良好散热</p>
          <p>• <strong style={{ color: '#2c3e50' }}>电池保养：</strong>避免过度充放电，保持 20%-80% 电量区间</p>
          <p>• <strong style={{ color: '#2c3e50' }}>定期检查：</strong>建议每月检查一次硬件健康状态</p>
          <p>• <strong style={{ color: '#2c3e50' }}>数据备份：</strong>硬盘健康度低于 80% 时请及时备份重要数据</p>
          <p>• <strong style={{ color: '#2c3e50' }}>电池更换：</strong>电池健康度低于 60% 时建议更换新电池</p>
        </div>
      </div>
    </div>
  );
};

export default HardwareHealth;
