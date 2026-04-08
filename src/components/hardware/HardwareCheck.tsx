import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Activity, Cpu, HardDrive, Zap, Monitor, RefreshCw } from 'lucide-react';

interface HealthStatus {
  component: string;
  status: 'good' | 'warning' | 'error';
  score: number;
  message: string;
  icon: React.ReactNode;
}

const HardwareCheck: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#27ae60';
      case 'warning':
        return '#f39c12';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const handleTaskUpdate = useCallback((task: any) => {
    if (task.id === currentTaskId && mountedRef.current) {
      if (task.status === 'completed' && task.result) {
        setHealthStatus(task.result.healthStatus);
        setOverallScore(task.result.overallScore);
        setLoading(false);
      } else if (task.status === 'failed' || task.status === 'cancelled') {
        setLoading(false);
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

  const checkHardwareHealth = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.createTask({
        type: 'hardware-detection',
        name: '硬件体检',
        description: '全面检测电脑硬件健康状态'
      });
      
      if (result.existingTask) {
        setCurrentTaskId(result.taskId);
        setLoading(false);
      } else if (result.success) {
        setCurrentTaskId(result.taskId);
        
        setTimeout(async () => {
          const mockStatus: HealthStatus[] = [
            {
              component: 'CPU',
              status: 'good',
              score: 95,
              message: 'CPU 运行正常，温度在安全范围内',
              icon: <Cpu size={20} />,
            },
            {
              component: '内存',
              status: 'good',
              score: 92,
              message: '内存使用正常，无异常占用',
              icon: <Activity size={20} />,
            },
            {
              component: '硬盘',
              status: 'warning',
              score: 75,
              message: 'C 盘剩余空间不足，建议清理',
              icon: <HardDrive size={20} />,
            },
            {
              component: '显卡',
              status: 'good',
              score: 90,
              message: '显卡驱动正常，性能良好',
              icon: <Monitor size={20} />,
            },
          ];

          if (mountedRef.current) {
            setHealthStatus(mockStatus);
            const avgScore = Math.round(mockStatus.reduce((sum, s) => sum + s.score, 0) / mockStatus.length);
            setOverallScore(avgScore);
            setLoading(false);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('硬件体检失败:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 总体评分 */}
      <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            fontSize: '42px', 
            fontWeight: 'bold', 
            color: overallScore >= 90 ? '#27ae60' : overallScore >= 70 ? '#f39c12' : '#e74c3c',
            marginBottom: '8px'
          }}>
            {overallScore}分
          </div>
          <p style={{ color: '#7f8c8d', fontSize: '14px', margin: 0 }}>
            {overallScore >= 90 ? '电脑状态优秀' : overallScore >= 70 ? '电脑状态良好' : '电脑状态一般'}
          </p>
        </div>
        <button 
          className="primary-button" 
          onClick={checkHardwareHealth}
          disabled={loading}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? '体检中...' : '重新体检'}
        </button>
      </div>

      {/* 各组件状态 */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '12px', paddingBottom: '10px' }}>
          <Activity size={18} />
          硬件健康状态
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {healthStatus.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: `3px solid ${getStatusColor(item.status)}`,
              }}
            >
              <div style={{ color: getStatusColor(item.status) }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.component}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(item.status)}
                    <span style={{ fontWeight: 'bold', color: getStatusColor(item.status), fontSize: '13px' }}>{item.score}%</span>
                  </div>
                </div>
                <div style={{ 
                  height: '6px', 
                  background: '#ecf0f1', 
                  borderRadius: '3px', 
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div
                    style={{
                      width: `${item.score}%`,
                      height: '100%',
                      background: getStatusColor(item.status),
                      transition: 'width 0.5s',
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#7f8c8d', margin: 0 }}>{item.message}</p>
              </div>
            </div>
          ))}
          {healthStatus.length === 0 && !loading && (
            <div style={{ padding: '30px', textAlign: 'center', color: '#95a5a6' }}>
              <Activity size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>点击"重新体检"开始检测</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HardwareCheck;
