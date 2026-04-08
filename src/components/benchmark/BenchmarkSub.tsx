import React, { useState } from 'react';
import { Cpu, Zap, Activity, HardDrive, Play } from 'lucide-react';

interface SubBenchmark {
  name: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const BenchmarkSub: React.FC = () => {
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number>>({});

  const subBenchmarks: SubBenchmark[] = [
    {
      name: 'CPU 运算',
      score: results['cpu'] || 0,
      icon: <Cpu size={32} />,
      color: '#3498db',
      description: '测试处理器整数、浮点运算能力',
    },
    {
      name: '显卡渲染',
      score: results['gpu'] || 0,
      icon: <Zap size={32} />,
      color: '#9b59b6',
      description: '测试 3D 图形渲染和 GPU 计算能力',
    },
    {
      name: '内存带宽',
      score: results['memory'] || 0,
      icon: <Activity size={32} />,
      color: '#e74c3c',
      description: '测试内存读写速度和带宽',
    },
    {
      name: '硬盘读写',
      score: results['disk'] || 0,
      icon: <HardDrive size={32} />,
      color: '#1abc9c',
      description: '测试磁盘顺序和随机读写速度',
    },
  ];

  const runSubTest = (id: string) => {
    setTesting(id);
    setTimeout(() => {
      const mockScores: Record<string, number> = {
        cpu: Math.floor(Math.random() * 2000) + 8000,
        gpu: Math.floor(Math.random() * 3000) + 12000,
        memory: Math.floor(Math.random() * 1000) + 5000,
        disk: Math.floor(Math.random() * 2000) + 3000,
      };
      setResults({ ...results, [id]: mockScores[id] });
      setTesting(null);
    }, 2000);
  };

  return (
    <div>
      <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px' }}>
        <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '10px' }}>分项性能测试</h3>
        <p style={{ color: '#7f8c8d' }}>分别测试 CPU、显卡、内存、硬盘的单项性能</p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {subBenchmarks.map((benchmark, index) => {
          const hasScore = results[index.toString()] || benchmark.score > 0;
          return (
            <div key={index} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                <div style={{ color: benchmark.color, padding: '10px' }}>{benchmark.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>{benchmark.name}</div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{benchmark.description}</div>
                </div>
                {testing === index.toString() ? (
                  <div style={{ padding: '10px 20px', background: '#ecf0f1', borderRadius: '6px' }}>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  </div>
                ) : hasScore ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: benchmark.color }}>
                      {benchmark.score.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>分</div>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => runSubTest(index.toString())}
                    style={{ padding: '10px 20px' }}
                  >
                    <Play size={18} />
                    开始测试
                  </button>
                )}
              </div>
              
              {hasScore && (
                <div style={{ height: '8px', background: '#ecf0f1', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min((benchmark.score / 15000) * 100, 100)}%`,
                      height: '100%',
                      background: benchmark.color,
                      transition: 'width 0.5s',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">📈 测试建议</div>
        <div style={{ lineHeight: '2', color: '#7f8c8d' }}>
          <p>• 建议逐项测试以获得准确的单项性能数据</p>
          <p>• 每项测试约需 30 秒 -1 分钟</p>
          <p>• 测试时请关闭其他程序以避免干扰</p>
          <p>• 可多次测试取平均值提高准确性</p>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkSub;
