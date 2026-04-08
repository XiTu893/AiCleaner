import React, { useState } from 'react';
import { Calculator, Cpu, Zap, HardDrive, Monitor, Save } from 'lucide-react';

interface Component {
  name: string;
  type: string;
  tdp: number;
  count: number;
}

const PowerCalculator: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([
    { name: 'Intel Core i7-13700K', type: 'CPU', tdp: 125, count: 1 },
    { name: 'NVIDIA RTX 3060', type: 'GPU', tdp: 170, count: 1 },
    { name: 'DDR4 32GB', type: '内存', tdp: 5, count: 2 },
    { name: 'NVMe SSD 1TB', type: '硬盘', tdp: 8, count: 1 },
  ]);
  const [result, setResult] = useState<{
    total: number;
    recommended: number;
    efficiency: string;
  } | null>(null);

  const calculate = () => {
    const total = components.reduce((sum, c) => sum + c.tdp * c.count, 0);
    const recommended = Math.ceil(total * 1.5 / 100) * 100; // 50% 余量，向上取整到百位
    let efficiency = '';
    if (recommended <= 450) efficiency = '铜牌';
    else if (recommended <= 550) efficiency = '银牌';
    else if (recommended <= 650) efficiency = '金牌';
    else efficiency = '白金牌';

    setResult({ total, recommended, efficiency });
  };

  const addComponent = () => {
    setComponents([...components, { name: '', type: '其他', tdp: 0, count: 1 }]);
  };

  const updateComponent = (index: number, field: string, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>电脑功耗计算器</h3>
          <button className="primary-button" onClick={calculate}>
            <Calculator size={18} />
            计算功耗
          </button>
        </div>

        <div className="component-list">
          <div className="component-header">
            <span>组件名称</span>
            <span>TDP (W)</span>
            <span>数量</span>
            <span>操作</span>
          </div>
          {components.map((component, index) => (
            <div key={index} className="component-item">
              <input
                type="text"
                value={component.name}
                onChange={(e) => updateComponent(index, 'name', e.target.value)}
                placeholder="组件名称"
                className="component-input"
              />
              <input
                type="number"
                value={component.tdp}
                onChange={(e) => updateComponent(index, 'tdp', parseInt(e.target.value) || 0)}
                placeholder="TDP"
                className="component-input-small"
              />
              <input
                type="number"
                value={component.count}
                onChange={(e) => updateComponent(index, 'count', parseInt(e.target.value) || 1)}
                min="1"
                className="component-input-small"
              />
              <button
                className="icon-button"
                onClick={() => removeComponent(index)}
              >
                删除
              </button>
            </div>
          ))}
        </div>

        <button className="secondary-button" onClick={addComponent} style={{ marginTop: '15px' }}>
          + 添加组件
        </button>

        {result && (
          <div className="result-section" style={{ marginTop: '25px' }}>
            <h4>计算结果</h4>
            <div className="result-grid">
              <div className="result-card">
                <Zap size={32} color="#f39c12" />
                <div className="result-value">{result.total} W</div>
                <div className="result-label">系统总功耗</div>
              </div>
              <div className="result-card">
                <Cpu size={32} color="#3498db" />
                <div className="result-value">{result.recommended} W</div>
                <div className="result-label">推荐电源功率</div>
              </div>
              <div className="result-card">
                <Monitor size={32} color="#27ae60" />
                <div className="result-value">{result.efficiency}</div>
                <div className="result-label">建议认证等级</div>
              </div>
            </div>
            <div className="power-tips">
              <p>💡 建议电源功率 = 系统总功耗 × 1.5（保留 50% 余量）</p>
              <p>💡 高负载应用（如游戏、渲染）建议选择更高功率电源</p>
            </div>
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>💡 功耗计算提示</h4>
        <ul>
          <li>TDP (Thermal Design Power) 表示热设计功耗</li>
          <li>建议保留 50% 余量以确保系统稳定运行</li>
          <li>超频用户建议选择更高功率的电源</li>
          <li>80 PLUS 认证等级越高，转换效率越好</li>
        </ul>
      </div>
    </div>
  );
};

export default PowerCalculator;
