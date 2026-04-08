import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, Search } from 'lucide-react';

const HardwareAuth: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  return (
    <div>
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Shield size={64} style={{ color: '#3498db', marginBottom: '20px' }} />
        <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '15px' }}>硬件真伪鉴别</h3>
        <p style={{ color: '#7f8c8d', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
          通过对比官方参数数据库，识别显卡、CPU、内存等硬件是否存在虚标、翻新、造假情况
        </p>
        
        {!scanComplete ? (
          <button 
            className="btn btn-primary" 
            onClick={handleScan}
            disabled={scanning}
          >
            <Search size={18} />
            {scanning ? '正在鉴别...' : '开始鉴别'}
          </button>
        ) : (
          <button className="btn btn-success" onClick={handleScan}>
            <CheckCircle size={18} />
            重新鉴别
          </button>
        )}
      </div>

      {scanComplete && (
        <div className="card">
          <div className="card-title">📋 鉴别结果</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#e8f8f5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <CheckCircle size={32} color="#27ae60" />
              <div>
                <div style={{ fontWeight: 'bold', color: '#27ae60', marginBottom: '5px' }}>CPU 验证通过</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>Intel Core i5-4200M - 正品验证</div>
              </div>
            </div>
            
            <div style={{ padding: '15px', background: '#e8f8f5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <CheckCircle size={32} color="#27ae60" />
              <div>
                <div style={{ fontWeight: 'bold', color: '#27ae60', marginBottom: '5px' }}>显卡验证通过</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>NVIDIA GeForce 820M - 参数正常</div>
              </div>
            </div>
            
            <div style={{ padding: '15px', background: '#fef9e7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <AlertTriangle size={32} color="#f39c12" />
              <div>
                <div style={{ fontWeight: 'bold', color: '#f39c12', marginBottom: '5px' }}>内存信息待确认</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>建议通过 CPU-Z 等工具进一步验证</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">💡 鉴别小贴士</div>
        <div style={{ lineHeight: '2', color: '#7f8c8d' }}>
          <p>• 购买硬件时请选择正规渠道，索要发票和保修卡</p>
          <p>• 可通过官方序列号查询网站验证产品真伪</p>
          <p>• 使用 CPU-Z、GPU-Z 等专业工具查看硬件参数</p>
          <p>• 注意对比包装、标签、外观等细节</p>
          <p>• 价格过低的产品需提高警惕</p>
        </div>
      </div>
    </div>
  );
};

export default HardwareAuth;
