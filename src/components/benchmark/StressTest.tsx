import React, { useState } from 'react';
import { Gauge, Play, Square, AlertTriangle, CheckCircle } from 'lucide-react';

const StressTest: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testType, setTestType] = useState<string | null>(null);
  const [results, setResults] = useState<{ type: string; stable: boolean; maxTemp: number } | null>(null);

  const startTest = (type: string) => {
    setRunning(true);
    setTestType(type);
    setProgress(0);
    setResults(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRunning(false);
          setResults({
            type,
            stable: Math.random() > 0.2,
            maxTemp: Math.floor(Math.random() * 20) + 65,
          });
          return 100;
        }
        return prev + 1;
      });
    }, 100);
  };

  const stopTest = () => {
    setRunning(false);
    setTestType(null);
    setProgress(0);
  };

  const tests = [
    { id: 'cpu', name: 'CPU 压力测试', description: '满载 CPU 所有核心，测试散热稳定性', duration: '5-10 分钟' },
    { id: 'gpu', name: '显卡压力测试', description: '3D 渲染负载测试，检验显卡稳定性', duration: '10-15 分钟' },
    { id: 'memory', name: '内存压力测试', description: '内存读写压力测试，检测稳定性', duration: '5-8 分钟' },
    { id: 'system', name: '系统综合测试', description: 'CPU+ 显卡 + 内存同时满载', duration: '15-20 分钟' },
  ];

  return (
    <div>
      {/* 测试状态 */}
      {running && (
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px', borderLeft: '4px solid #f39c12' }}>
          <Gauge size={48} color="#f39c12" style={{ marginBottom: '15px' }} />
          <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '10px' }}>
            正在进行{tests.find(t => t.id === testType)?.name}
          </h3>
          <div style={{ maxWidth: '500px', margin: '20px auto' }}>
            <div style={{ height: '12px', background: '#ecf0f1', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f39c12, #e74c3c)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <p style={{ marginTop: '10px', color: '#7f8c8d' }}>{progress}%</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <div style={{ padding: '10px 20px', background: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', color: '#7f8c8d' }}>当前负载</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>100%</div>
            </div>
            <div style={{ padding: '10px 20px', background: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', color: '#7f8c8d' }}>预计剩余</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3498db' }}>{Math.round((100 - progress) / 10)}分钟</div>
            </div>
          </div>
          <button className="btn btn-danger" onClick={stopTest} style={{ marginTop: '20px' }}>
            <Square size={18} />
            停止测试
          </button>
        </div>
      )}

      {/* 测试结果 */}
      {results && !running && (
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px', borderLeft: `4px solid ${results.stable ? '#27ae60' : '#e74c3c'}` }}>
          {results.stable ? (
            <CheckCircle size={48} color="#27ae60" style={{ marginBottom: '15px' }} />
          ) : (
            <AlertTriangle size={48} color="#e74c3c" style={{ marginBottom: '15px' }} />
          )}
          <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '10px' }}>测试完成</h3>
          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginTop: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#7f8c8d' }}>稳定性</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: results.stable ? '#27ae60' : '#e74c3c' }}>
                {results.stable ? '通过 ✓' : '未通过 ✗'}
              </div>
            </div>
            <div style={{ borderLeft: '2px solid #ecf0f1', paddingLeft: '30px' }}>
              <div style={{ fontSize: '13px', color: '#7f8c8d' }}>最高温度</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>{results.maxTemp}°C</div>
            </div>
          </div>
        </div>
      )}

      {/* 测试选项 */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {tests.map((test) => (
          <div key={test.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{test.name}</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>{test.description}</div>
                <div style={{ fontSize: '12px', color: '#95a5a6' }}>预计耗时：{test.duration}</div>
              </div>
              {!running || testType === test.id ? (
                <button
                  className={running ? 'btn btn-danger' : 'btn btn-primary'}
                  onClick={() => running ? stopTest() : startTest(test.id)}
                  style={{ padding: '12px 24px' }}
                >
                  {running ? (
                    <>
                      <Square size={18} />
                      停止
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      开始测试
                    </>
                  )}
                </button>
              ) : (
                <button className="btn" disabled style={{ padding: '12px 24px', opacity: 0.5 }}>
                  测试中...
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 测试说明 */}
      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">⚠️ 测试注意事项</div>
        <div style={{ lineHeight: '2', color: '#7f8c8d' }}>
          <p>• 压力测试会使硬件满载运行，产生较高热量，请确保散热正常</p>
          <p>• 测试过程中电脑可能会变慢，属于正常现象</p>
          <p>• 如出现蓝屏、死机等情况，说明系统稳定性存在问题</p>
          <p>• 建议在新电脑组装完成后或更换散热器后进行测试</p>
          <p>• 测试过程中请密切关注温度变化，超过 90°C 应立即停止</p>
        </div>
      </div>
    </div>
  );
};

export default StressTest;
