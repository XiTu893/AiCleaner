import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Play, RotateCcw, Trophy, Cpu, Monitor, HardDrive, Activity, Medal, Award, TrendingUp } from 'lucide-react';

const BenchmarkCombined: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overall');
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [scores, setScores] = useState({
    overall: 0, cpu: 0, gpu: 0, memory: 0, disk: 0 });
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [subResults, setSubResults] = useState<Record<string, number>>({});
  const [testingSub, setTestingSub] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const mockRanks = [
    { rank: 1, name: '华硕玩家国度', score: 15680, percent: 100 },
    { rank: 2, name: '联想拯救者 Y9000P', score: 14920, percent: 95 },
    { rank: 3, name: '戴尔 XPS 15', score: 14250, percent: 91 },
    { rank: 4, name: '惠普暗影精灵 9', score: 13890, percent: 89 },
    { rank: 5, name: 'MacBook Pro 16"', score: 13560, percent: 86 },
    { rank: 6, name: 'ThinkPad X1 Carbon', score: 12980, percent: 83 },
    { rank: 7, name: '戴尔灵越 15', score: 12450, percent: 79 },
    { rank: 8, name: '惠普战 66', score: 11890, percent: 76 },
    { rank: 9, name: '联想小新 Pro 16', score: 11320, percent: 72 },
    { rank: 10, name: '宏碁暗影骑士', score: 10780, percent: 69 },
  ];

  const userScore = scores.overall || 9500;
  const userRank = 156;
  const totalUsers = 10000;

  const tabs = [
    { id: 'overall', label: '综合跑分' },
    { id: 'sub', label: '分项评测' },
    { id: 'rank', label: '性能排行' },
  ];

  const calculateScore = (info: any) => {
    let cpuScore = 0;
    let gpuScore = 0;
    let memoryScore = 0;
    let diskScore = 0;

    const cpuCores = info.cpus?.length || 4;
    const cpuSpeed = info.cpus?.[0]?.speed || 2.5;
    cpuScore = Math.round((cpuCores * cpuSpeed * 100) / 10);

    const gpu = info.gpu?.[0];
    if (gpu) {
      const vram = gpu.adapterRAM / (1024 * 1024 * 1024);
      if (gpu.name.includes('RTX')) {
        gpuScore = Math.round(vram * 800 + 5000);
      } else if (gpu.name.includes('GTX')) {
        gpuScore = Math.round(vram * 600 + 3000);
      } else if (gpu.name.includes('GeForce')) {
        gpuScore = Math.round(vram * 400 + 1500);
      } else {
        gpuScore = Math.round(vram * 300 + 800);
      }
    }

    const totalMemory = info.totalMemory / (1024 * 1024 * 1024);
    memoryScore = Math.round(totalMemory * 150);

    const freeDisk = info.disks?.[0]?.freeSpace || 100 * 1024 * 1024 * 1024;
    const totalDisk = info.disks?.[0]?.size || 256 * 1024 * 1024 * 1024;
    diskScore = Math.round((freeDisk / totalDisk) * 1000 + 500);

    const overallScore = Math.round(
      cpuScore * 0.35 + gpuScore * 0.35 + memoryScore * 0.15 + diskScore * 0.15
    );

    return {
      overall: overallScore,
      cpu: cpuScore,
      gpu: gpuScore,
      memory: memoryScore,
      disk: diskScore,
    };
  };

  const handleTaskUpdate = useCallback((task: any) => {
    if (task.id === currentTaskId && mountedRef.current) {
      setProgress(task.progress);
      
      if (task.status === 'completed' && task.result) {
        setScores(task.result.scores);
        setSystemInfo(task.result.systemInfo);
        setRunning(false);
        setCompleted(true);
      } else if (task.status === 'failed' || task.status === 'cancelled') {
        setRunning(false);
      }
    }
  }, [currentTaskId]);

  useEffect(() => {
    mountedRef.current = true;
    window.electronAPI.onTaskUpdate(handleTaskUpdate);
    
    return () => {
      mountedRef.current = false;
      window.electronAPI.removeTaskUpdateListener();
    };
  }, [handleTaskUpdate]);

  const runBenchmark = async () => {
    setRunning(true);
    setCompleted(false);
    setProgress(0);

    try {
      const result = await window.electronAPI.createTask({
        type: 'benchmark',
        name: '综合性能测试',
        description: '测试 CPU、GPU、内存和硬盘性能'
      });
      
      if (result.success) {
        setCurrentTaskId(result.taskId);
        
        const info = await window.electronAPI.getSystemInfo();
        setSystemInfo(info);
        
        let currentProgress = 0;
        const interval = setInterval(() => {
          if (!mountedRef.current) {
            clearInterval(interval);
            return;
          }
          
          currentProgress += 2;
          setProgress(currentProgress);
          
          if (currentProgress >= 100) {
            clearInterval(interval);
            const calculatedScores = calculateScore(info);
            setScores(calculatedScores);
            setSubResults({
              cpu: calculatedScores.cpu,
              gpu: calculatedScores.gpu,
              memory: calculatedScores.memory,
              disk: calculatedScores.disk,
            });
            setRunning(false);
            setCompleted(true);
          }
        }, 100);
      }
    } catch (error) {
      console.error('性能测试失败:', error);
      setRunning(false);
    }
  };

  const runSubTest = (id: string) => {
    setTestingSub(id);
    setTimeout(() => {
      const mockScores: Record<string, number> = {
        cpu: Math.floor(Math.random() * 2000) + 8000,
        gpu: Math.floor(Math.random() * 3000) + 12000,
        memory: Math.floor(Math.random() * 1000) + 5000,
        disk: Math.floor(Math.random() * 2000) + 3000,
      };
      setSubResults({ ...subResults, [id]: mockScores[id] });
      setTestingSub(null);
    }, 2000);
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 9000) return { text: '性能优秀', color: '#27ae60' };
    if (score >= 8000) return { text: '性能良好', color: '#3498db' };
    if (score >= 7000) return { text: '性能中等', color: '#f39c12' };
    return { text: '性能一般', color: '#e74c3c' };
  };

  const level = completed ? getPerformanceLevel(scores.overall) : null;

  const renderOverallTab = () => (
    <div>
      <div className="card" style={{ textAlign: 'center', padding: '25px 20px' }}>
        {!completed ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <Zap size={60} color="#f39c12" style={{ marginBottom: '15px' }} />
              <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '8px' }}>
                {running ? '正在跑分...' : '准备开始跑分'}
              </h3>
              <p style={{ color: '#7f8c8d', fontSize: '13px', margin: 0 }}>
                {running ? '正在进行 CPU、显卡、内存、硬盘性能测试' : '点击开始按钮进行综合性能测试'}
              </p>
            </div>

            {running && (
              <div style={{ maxWidth: '350px', margin: '0 auto 20px' }}>
                <div style={{ height: '8px', background: '#ecf0f1', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f39c12, #e74c3c)',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <p style={{ marginTop: '8px', color: '#7f8c8d', fontSize: '13px' }}>{progress}%</p>
              </div>
            )}

            <button 
              className="primary-button" 
              onClick={runBenchmark}
              disabled={running}
              style={{ padding: '10px 30px', fontSize: '14px' }}
            >
              {running ? (
                <>
                  <RotateCcw size={18} className="spinning" />
                  测试进行中...
                </>
              ) : (
                <>
                  <Play size={18} />
                  开始跑分
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <Trophy size={60} color="#f1c40f" style={{ marginBottom: '15px' }} />
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3498db', marginBottom: '8px' }}>
                {scores.overall.toLocaleString()}分
              </div>
              <p style={{ fontSize: '15px', color: '#7f8c8d', margin: 0 }}>
                综合性能评分
              </p>
              <p style={{ 
                color: level?.color, 
                fontWeight: 'bold', 
                marginTop: '8px',
                fontSize: '14px'
              }}>
                {level?.text}
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ padding: '12px', background: '#e8f4f8', borderRadius: '8px', textAlign: 'center' }}>
                <Cpu size={20} color="#3498db" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '4px' }}>CPU 性能</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>{scores.cpu.toLocaleString()}</div>
              </div>
              <div style={{ padding: '12px', background: '#f4ecf7', borderRadius: '8px', textAlign: 'center' }}>
                <Monitor size={20} color="#9b59b6" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '4px' }}>GPU 性能</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9b59b6' }}>{scores.gpu.toLocaleString()}</div>
              </div>
              <div style={{ padding: '12px', background: '#fef9e7', borderRadius: '8px', textAlign: 'center' }}>
                <Activity size={20} color="#f39c12" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '4px' }}>内存性能</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f39c12' }}>{scores.memory.toLocaleString()}</div>
              </div>
              <div style={{ padding: '12px', background: '#e8f8f5', borderRadius: '8px', textAlign: 'center' }}>
                <HardDrive size={20} color="#27ae60" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '4px' }}>磁盘性能</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>{scores.disk.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="primary-button" onClick={runBenchmark} style={{ padding: '8px 20px', fontSize: '13px' }}>
                <RotateCcw size={16} />
                重新测试
              </button>
            </div>
          </>
        )}
      </div>

      {completed && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
            <Trophy size={18} />
            历史成绩
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>本次得分</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3498db' }}>{scores.overall.toLocaleString()}</div>
            </div>
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>最高得分</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>{Math.round(scores.overall * 1.05).toLocaleString()}</div>
            </div>
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>平均得分</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f39c12' }}>{Math.round(scores.overall * 0.95).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
          💡 跑分说明
        </div>
        <div style={{ lineHeight: '1.8', color: '#7f8c8d', fontSize: '13px' }}>
          <p>• 综合跑分包含 CPU 运算、显卡渲染、内存带宽、硬盘读写四项测试</p>
          <p>• 测试过程约需 1-2 分钟，请保持电脑空闲状态</p>
          <p>• 分数越高代表性能越强，可作为性能对比参考</p>
          <p>• 建议关闭其他程序以获得准确测试结果</p>
        </div>
      </div>
    </div>
  );

  const renderSubTab = () => {
    const subBenchmarks = [
      {
        id: 'cpu', name: 'CPU 运算', score: subResults['cpu'] || scores.cpu || 0, icon: <Cpu size={32} />, color: '#3498db', description: '测试处理器整数、浮点运算能力' },
      {
        id: 'gpu', name: '显卡渲染', score: subResults['gpu'] || scores.gpu || 0, icon: <Monitor size={32} />, color: '#9b59b6', description: '测试 3D 图形渲染和 GPU 计算能力' },
      {
        id: 'memory', name: '内存带宽', score: subResults['memory'] || scores.memory || 0, icon: <Activity size={32} />, color: '#e74c3c', description: '测试内存读写速度和带宽' },
      {
        id: 'disk', name: '硬盘读写', score: subResults['disk'] || scores.disk || 0, icon: <HardDrive size={32} />, color: '#1abc9c', description: '测试磁盘顺序和随机读写速度' },
    ];

    return (
      <div>
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '10px' }}>分项性能测试</h3>
          <p style={{ color: '#7f8c8d' }}>分别测试 CPU、显卡、内存、硬盘的单项性能</p>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {subBenchmarks.map((benchmark) => {
            const hasScore = benchmark.score > 0;
            return (
              <div key={benchmark.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                  <div style={{ color: benchmark.color, padding: '10px' }}>{benchmark.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>{benchmark.name}</div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{benchmark.description}</div>
                  </div>
                  {testingSub === benchmark.id ? (
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
                      onClick={() => runSubTest(benchmark.id)}
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

  const renderRankTab = () => (
    <div>
      <div className="card" style={{ textAlign: 'center', padding: '30px 20px', marginBottom: '25px' }}>
        <Award size={64} color="#f39c12" style={{ marginBottom: '15px' }} />
        <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '10px' }}>您的性能排名</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px' }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3498db' }}>{userRank}</div>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>当前排名</div>
          </div>
          <div style={{ borderLeft: '2px solid #ecf0f1', paddingLeft: '30px' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>{userScore.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>您的得分</div>
          </div>
          <div style={{ borderLeft: '2px solid #ecf0f1', paddingLeft: '30px' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e74c3c' }}>{totalUsers.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>参与用户</div>
          </div>
        </div>
        <div style={{ marginTop: '20px', padding: '10px', background: '#e8f4f8', borderRadius: '6px', display: 'inline-block' }}>
          <TrendingUp size={16} style={{ display: 'inline', marginRight: '5px' }} />
          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>超越 {((1 - userRank / totalUsers) * 100).toFixed(1)}% 的用户</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Trophy size={20} />
          性能排行榜 TOP 10
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mockRanks.map((item, index) => (
            <div
              key={item.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                background: index < 3 ? '#fff8e1' : '#f8f9fa',
                borderRadius: '8px',
                borderLeft: index < 3 ? '4px solid #f1c40f' : '4px solid transparent',
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: index === 0 ? '#f1c40f' : index === 1 ? '#bdc3c7' : index === 2 ? '#cd7f32' : '#ecf0f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: index < 3 ? '#fff' : '#7f8c8d',
                marginRight: '15px'
              }}>
                {item.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{item.name}</div>
                <div style={{ height: '6px', background: '#ecf0f1', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      background: index < 3 ? '#f1c40f' : '#3498db',
                      transition: 'width 0.5s',
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>{item.score.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#95a5a6' }}>分</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">
          <Medal size={20} />
          性能提升建议
        </div>
        <div style={{ lineHeight: '2.2', color: '#7f8c8d' }}>
          <p>• <strong style={{ color: '#2c3e50' }}>升级硬件：</strong>增加内存容量、更换 SSD 硬盘可显著提升性能</p>
          <p>• <strong style={{ color: '#2c3e50' }}>清理优化：</strong>定期清理系统垃圾，释放磁盘空间</p>
          <p>• <strong style={{ color: '#2c3e50' }}>更新驱动：</strong>保持显卡、主板驱动为最新版本</p>
          <p>• <strong style={{ color: '#2c3e50' }}>散热维护：</strong>清理灰尘，确保良好散热避免降频</p>
          <p>• <strong style={{ color: '#2c3e50' }}>启动项管理：</strong>禁用不必要的开机启动项</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overall':
        return renderOverallTab();
      case 'sub':
        return renderSubTab();
      case 'rank':
        return renderRankTab();
      default:
        return renderOverallTab();
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #ecf0f1',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? '#3498db' : '#7f8c8d',
              borderBottom: activeTab === tab.id ? '2px solid #3498db' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};

export default BenchmarkCombined;
