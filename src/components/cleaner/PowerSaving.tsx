import React, { useState } from 'react';
import { Power, Zap, Leaf, TrendingDown } from 'lucide-react';

const PowerSaving: React.FC = () => {
  const [powerPlan, setPowerPlan] = useState('balanced');
  const [optimizations, setOptimizations] = useState({
    brightness: 70,
    sleepTime: 10,
    backgroundApps: true,
    startupApps: 8,
  });

  const powerPlans = [
    { id: 'power-saver', name: '节能模式', icon: <Leaf size={24} />, description: '最大限度节省电力，性能略有降低', color: '#27ae60' },
    { id: 'balanced', name: '平衡模式', icon: <Zap size={24} />, description: '平衡性能和功耗，推荐使用', color: '#3498db' },
    { id: 'performance', name: '高性能模式', icon: <Power size={24} />, description: '最佳性能，功耗较高', color: '#e74c3c' },
  ];

  const tips = [
    { title: '降低屏幕亮度', saving: '5-10%', icon: <TrendingDown size={16} /> },
    { title: '缩短睡眠等待时间', saving: '3-5%', icon: <TrendingDown size={16} /> },
    { title: '禁用后台应用', saving: '8-12%', icon: <TrendingDown size={16} /> },
    { title: '减少开机启动项', saving: '5-8%', icon: <TrendingDown size={16} /> },
  ];

  return (
    <div>
      {/* 电源计划 */}
      <div className="card">
        <div className="card-title">
          <Power size={20} />
          电源计划
        </div>
        <div style={{ display: 'grid', gap: '15px' }}>
          {powerPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setPowerPlan(plan.id)}
              style={{
                padding: '16px',
                background: powerPlan === plan.id ? 'var(--bg-card)' : 'var(--bg-secondary)',
                border: `2px solid ${powerPlan === plan.id ? plan.color : 'var(--border-color)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ color: plan.color, padding: '10px', background: `${plan.color}20`, borderRadius: '8px' }}>
                  {plan.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>{plan.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{plan.description}</div>
                </div>
                {powerPlan === plan.id && (
                  <div style={{ color: plan.color, fontWeight: '600' }}>✓ 已选择</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 优化选项 */}
      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">
          <Zap size={20} />
          节能优化
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>屏幕亮度</span>
              <span style={{ color: '#7f8c8d' }}>{optimizations.brightness}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={optimizations.brightness}
              onChange={(e) => setOptimizations({ ...optimizations, brightness: parseInt(e.target.value) })}
              style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', outline: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '12px', color: '#95a5a6' }}>
              <span>20%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>自动睡眠时间</span>
              <span style={{ color: '#7f8c8d' }}>{optimizations.sleepTime} 分钟</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[5, 10, 15, 30].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setOptimizations({ ...optimizations, sleepTime: minutes })}
                  style={{
                    padding: '10px',
                    background: optimizations.sleepTime === minutes ? 'var(--primary-color)' : 'var(--bg-secondary)',
                    color: optimizations.sleepTime === minutes ? 'var(--text-light)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {minutes}分钟
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-primary)' }}>后台应用</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>允许后台应用运行</div>
            </div>
            <button
              onClick={() => setOptimizations({ ...optimizations, backgroundApps: !optimizations.backgroundApps })}
              style={{
                width: '50px',
                height: '26px',
                background: optimizations.backgroundApps ? 'var(--success-color)' : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '13px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.3s',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  background: 'var(--text-light)',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: optimizations.backgroundApps ? '26px' : '2px',
                  transition: 'left 0.3s',
                }}
              />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-primary)' }}>开机启动项</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>当前有 {optimizations.startupApps} 个启动项</div>
            </div>
            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              管理启动项
            </button>
          </div>
        </div>
      </div>

      {/* 节能效果 */}
      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">
          <Leaf size={20} />
          节能效果
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          {tips.map((tip, index) => (
            <div key={index} style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', borderLeft: '3px solid var(--success-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '8px', color: 'var(--success-color)' }}>
                {tip.icon}
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>{tip.saving}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tip.title}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>预计总节能效果</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success-color)' }}>21-35%</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>延长续航时间约 1-2 小时</div>
        </div>
      </div>

      {/* 降温建议 */}
      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">❄️ 降温建议</div>
        <div style={{ lineHeight: '2', color: 'var(--text-secondary)' }}>
          <p>• 使用节能模式可降低 CPU 功耗，减少发热</p>
          <p>• 降低屏幕亮度既能节能又能减少热量产生</p>
          <p>• 禁用不必要的后台应用，减轻系统负载</p>
          <p>• 使用笔记本散热垫或支架改善散热</p>
          <p>• 定期清理风扇和散热口灰尘</p>
          <p>• 避免在柔软表面（如床上）使用笔记本</p>
        </div>
      </div>
    </div>
  );
};

export default PowerSaving;
