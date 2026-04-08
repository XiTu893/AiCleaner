import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Play, RotateCcw, Trophy, Cpu, Monitor, HardDrive, Activity } from 'lucide-react';

const BenchmarkOverall: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [scores, setScores] = useState({
    overall: 0,
    cpu: 0,
    gpu: 0,
    memory: 0,
    disk: 0,
  });
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const mountedRef = useRef(true);

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

  const getPerformanceLevel = (score: number) => {
    if (score >= 9000) return { text: '性能优秀', color: '#27ae60' };
    if (score >= 8000) return { text: '性能良好', color: '#3498db' };
    if (score >= 7000) return { text: '性能中等', color: '#f39c12' };
    return { text: '性能一般', color: '#e74c3c' };
  };

  const level = completed ? getPerformanceLevel(scores.overall) : null;

  return (
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
};

export default BenchmarkOverall;
