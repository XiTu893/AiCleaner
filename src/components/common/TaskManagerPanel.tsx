import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Trash2, CheckCircle, XCircle, Clock, RefreshCw, Activity, RotateCcw } from 'lucide-react';

interface Task {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  result?: any;
  error?: string;
  isPaused: boolean;
  createdAt: number;
  updatedAt: number;
}

const TaskManagerPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const mountedRef = useRef(true);

  const loadTasks = useCallback(async () => {
    try {
      const result = await window.electronAPI.getAllTasks();
      if (result.success && mountedRef.current) {
        setTasks(result.tasks || []);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  }, []);

  const handleTaskUpdate = useCallback((task: Task) => {
    if (mountedRef.current) {
      setTasks(prev => {
        const index = prev.findIndex(t => t.id === task.id);
        if (index >= 0) {
          const newTasks = [...prev];
          newTasks[index] = task;
          return newTasks;
        }
        return [...prev, task];
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadTasks();

    window.electronAPI.onTaskUpdate(handleTaskUpdate);

    return () => {
      mountedRef.current = false;
      window.electronAPI.removeTaskUpdateListener();
    };
  }, [loadTasks, handleTaskUpdate]);

  const handlePause = async (taskId: string) => {
    await window.electronAPI.pauseTask(taskId);
  };

  const handleResume = async (taskId: string) => {
    await window.electronAPI.resumeTask(taskId);
  };

  const handleStop = async (taskId: string) => {
    await window.electronAPI.stopTask(taskId);
  };

  const handleRestart = async (taskId: string) => {
    await window.electronAPI.restartTask(taskId);
  };

  const handleClearCompleted = async () => {
    await window.electronAPI.clearCompletedTasks();
    await loadTasks();
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#27ae60" />;
      case 'failed':
        return <XCircle size={16} color="#e74c3c" />;
      case 'cancelled':
        return <Square size={16} color="#95a5a6" />;
      case 'running':
        return <Activity size={16} color="#3498db" />;
      case 'paused':
        return <Pause size={16} color="#f39c12" />;
      default:
        return <Clock size={16} color="#7f8c8d" />;
    }
  };

  const getStatusText = (status: Task['status']) => {
    const map: Record<string, string> = {
      pending: '等待中',
      running: '运行中',
      paused: '已暂停',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: Task['status']) => {
    const map: Record<string, string> = {
      pending: '#7f8c8d',
      running: '#3498db',
      paused: '#f39c12',
      completed: '#27ae60',
      failed: '#e74c3c',
      cancelled: '#95a5a6'
    };
    return map[status] || '#7f8c8d';
  };

  const formatDuration = (start: number, end: number) => {
    const duration = end - start;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  };

  const activeTasks = tasks.filter(t => ['pending', 'running', 'paused'].includes(t.status));
  const completedTasks = tasks.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status));

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: '15px' }}>
        <Activity size={20} />
        任务管理
        {completedTasks.length > 0 && (
          <button
            className="secondary-button"
            onClick={handleClearCompleted}
            style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '12px' }}
          >
            <Trash2 size={14} />
            清除已完成
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} color="#95a5a6" />
          <h3>暂无任务</h3>
          <p>后台任务将在此显示</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeTasks.length > 0 && (
            <div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#34495e',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e0e0e0'
              }}>
                进行中 ({activeTasks.length})
              </div>
              {activeTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    borderLeft: `4px solid ${getStatusColor(task.status)}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    {getStatusIcon(task.status)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#2c3e50' }}>
                        {task.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {task.type}
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      background: `${getStatusColor(task.status)}20`,
                      color: getStatusColor(task.status),
                      fontWeight: '500'
                    }}>
                      {getStatusText(task.status)}
                    </span>
                  </div>

                  {task.status === 'running' && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                        fontSize: '12px'
                      }}>
                        <span style={{ color: '#7f8c8d' }}>{task.message || '处理中...'}</span>
                        <span style={{ fontWeight: '600', color: '#3498db' }}>{task.progress}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: '6px' }}>
                        <div 
                          className="progress-fill" 
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {task.status === 'running' && (
                      <button
                        className="secondary-button"
                        onClick={() => handlePause(task.id)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Pause size={14} />
                        暂停
                      </button>
                    )}
                    {task.status === 'paused' && (
                      <button
                        className="secondary-button"
                        onClick={() => handleResume(task.id)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Play size={14} />
                        继续
                      </button>
                    )}
                    {(task.status === 'running' || task.status === 'paused') && (
                      <button
                        className="secondary-button"
                        onClick={() => handleStop(task.id)}
                        style={{ padding: '6px 12px', fontSize: '12px', color: '#e74c3c' }}
                      >
                        <Square size={14} />
                        停止
                      </button>
                    )}
                    {['completed', 'failed', 'cancelled'].includes(task.status) && (
                      <button
                        className="secondary-button"
                        onClick={() => handleRestart(task.id)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <RotateCcw size={14} />
                        重启
                      </button>
                    )}
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#95a5a6', 
                      marginLeft: 'auto' 
                    }}>
                      {formatDuration(task.createdAt, Date.now())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#34495e',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e0e0e0',
                marginTop: '20px'
              }}>
                历史记录 ({completedTasks.length})
              </div>
              {completedTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px 15px',
                    background: '#fff',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    border: '1px solid #e8e8e8',
                    opacity: 0.8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusIcon(task.status)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '13px', color: '#2c3e50' }}>
                        {task.name}
                      </div>
                      {task.error && (
                        <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>
                          {task.error}
                        </div>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      background: `${getStatusColor(task.status)}20`,
                      color: getStatusColor(task.status),
                      fontWeight: '500'
                    }}>
                      {getStatusText(task.status)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#95a5a6' }}>
                      {formatDuration(task.createdAt, task.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskManagerPanel;
