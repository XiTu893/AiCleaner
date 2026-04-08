import React, { useState } from 'react';
import { Monitor, CheckCircle } from 'lucide-react';

const ScreenTest: React.FC = () => {
  const [testMode, setTestMode] = useState<string | null>(null);
  const [testColor, setTestColor] = useState('#FFFFFF');

  const colors = [
    { name: '白色', value: '#FFFFFF' },
    { name: '黑色', value: '#000000' },
    { name: '红色', value: '#FF0000' },
    { name: '绿色', value: '#00FF00' },
    { name: '蓝色', value: '#0000FF' },
  ];

  const startTest = (color: string) => {
    setTestMode('color');
    setTestColor(color);
  };

  const exitTest = () => {
    setTestMode(null);
    setTestColor('#FFFFFF');
  };

  if (testMode) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: testColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={exitTest}
      >
        <div
          style={{
            padding: '20px 40px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          点击任意位置退出测试
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Monitor size={64} style={{ color: '#3498db', marginBottom: '20px' }} />
        <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '15px' }}>屏幕检测工具</h3>
        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
          通过显示不同颜色的纯色画面，检测屏幕坏点、亮点、漏光等问题
        </p>
      </div>

      <div className="card">
        <div className="card-title">🎨 纯色测试</div>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
          点击下方按钮切换不同颜色，仔细观察屏幕是否有坏点、亮点或颜色异常
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
          {colors.map((color) => (
            <button
              key={color.value}
              className="btn"
              onClick={() => startTest(color.value)}
              style={{
                background: color.value,
                color: color.value === '#FFFFFF' || color.value === '#000000' ? '#000000' : '#FFFFFF',
                border: '2px solid #dfe6e9',
                fontWeight: 'bold',
              }}
            >
              {color.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">📋 检测说明</div>
        <div style={{ lineHeight: '2.2', color: '#7f8c8d' }}>
          <p><strong style={{ color: '#2c3e50' }}>坏点检测：</strong>在黑色背景下，如果某个点始终不亮，则为坏点</p>
          <p><strong style={{ color: '#2c3e50' }}>亮点检测：</strong>在黑色背景下，如果某个点始终发光，则为亮点</p>
          <p><strong style={{ color: '#2c3e50' }}>漏光检测：</strong>在黑色背景下，从侧面观察屏幕边缘是否有光线泄漏</p>
          <p><strong style={{ color: '#2c3e50' }}>色彩均匀性：</strong>在纯色背景下，观察屏幕颜色是否均匀一致</p>
          <p><strong style={{ color: '#2c3e50' }}>操作提示：</strong>点击色块进入全屏测试模式，再次点击退出</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💡 专业建议</div>
        <div style={{ lineHeight: '2', color: '#7f8c8d' }}>
          <p>• 建议在较暗的环境中进行屏幕检测，效果更佳</p>
          <p>• 每个颜色模式观察 1-2 分钟，仔细检查整个屏幕</p>
          <p>• 可以使用放大镜工具辅助观察微小瑕疵</p>
          <p>• 新显示器如有问题，建议在退换货期内及时处理</p>
          <p>• 少量坏点（1-3 个）属于行业正常范围</p>
        </div>
      </div>
    </div>
  );
};

export default ScreenTest;
