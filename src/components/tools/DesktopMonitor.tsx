import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Activity, Cpu, HardDrive, Radio } from 'lucide-react';
import * as echarts from 'echarts';

interface MonitorDataPoint {
  timestamp: number;
  cpu: number;
  memory: number;
}

const DesktopMonitor: React.FC = () => {
  const [monitoring, setMonitoring] = useState(true); // 默认开启监控
  const [stats, setStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    fps: 60,
  });
  const [history, setHistory] = useState<MonitorDataPoint[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    let interval: any;
    if (monitoring) {
      // 使用真实的系统使用率数据
      const updateStats = async () => {
        try {
          const usage = await window.electronAPI.getSystemUsage();
          setStats(prev => ({
            ...prev,
            cpu: usage.cpu,
            memory: usage.memory,
          }));

          // 添加到历史记录
          setHistory(prev => {
            const newHistory = [...prev, {
              timestamp: Date.now(),
              cpu: usage.cpu,
              memory: usage.memory,
            }];
            // 保留最近 10 分钟的数据
            const cutoffTime = Date.now() - 10 * 60 * 1000;
            return newHistory.filter(point => point.timestamp > cutoffTime);
          });
        } catch (error) {
          console.error('获取系统使用率失败:', error);
        }
      };

      updateStats();
      interval = setInterval(updateStats, 2000);

      // 监听实时数据流
      window.electronAPI.onMonitorData((data) => {
        setStats(prev => ({
          ...prev,
          cpu: data.cpu,
          memory: data.memory,
        }));

        // 添加到历史记录
        setHistory(prev => {
          const newHistory = [...prev, {
            timestamp: Date.now(),
            cpu: data.cpu,
            memory: data.memory,
          }];
          // 保留最近 10 分钟的数据
          const cutoffTime = Date.now() - 10 * 60 * 1000;
          return newHistory.filter(point => point.timestamp > cutoffTime);
        });
      });
    }
    return () => clearInterval(interval);
  }, [monitoring]);

  useEffect(() => {
    if (monitoring && history.length > 1 && chartRef.current) {
      if (!chartInstance.current) {
        initChart();
      } else {
        updateChartData();
      }
    }
  }, [history, monitoring]);

  const startMonitoring = () => {
    setMonitoring(true);
    setHistory([]);
  };

  const stopMonitoring = () => {
    setMonitoring(false);
    setStats({ cpu: 0, memory: 0, disk: 0, network: 0, fps: 0 });
    setHistory([]);
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }
  };

  // 组件卸载时停止监控
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  const initChart = () => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e0e0e0',
        textStyle: { color: '#2c3e50' },
        formatter: (params: any) => {
          let html = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].name}</div>`;
          params.forEach((param: any) => {
            html += `<div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
              <span>${param.seriesName}: </span>
              <span style="font-weight: bold; color: ${param.color};">${param.value}%</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['CPU 使用率', '内存使用率'],
        bottom: 10,
        textStyle: { color: '#7f8c8d' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          bottom: 0,
          height: 30,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fillerColor: 'rgba(52, 152, 219, 0.2)',
          handleIcon: 'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.4c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6v1.2z M13.3,22.2H6.7v-1.2h6.6v1.2z M13.3,20H6.7v-1.2h6.6V20z',
          handleSize: '100%',
          handleStyle: {
            color: '#3498db',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
      ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: {
          color: '#95a5a6',
          fontSize: 11,
          rotate: 0,
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '使用率 (%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: {
          color: '#95a5a6',
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'CPU 使用率',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 4,
          data: [],
          lineStyle: { color: '#3498db', width: 2 },
          itemStyle: { color: '#3498db', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(52, 152, 219, 0.3)' },
              { offset: 1, color: 'rgba(52, 152, 219, 0.05)' },
            ]),
          },
        },
        {
          name: '内存使用率',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 4,
          data: [],
          lineStyle: { color: '#9b59b6', width: 2 },
          itemStyle: { color: '#9b59b6', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(155, 89, 182, 0.3)' },
              { offset: 1, color: 'rgba(155, 89, 182, 0.05)' },
            ]),
          },
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const updateChartData = () => {
    if (!chartInstance.current) return;

    const times = history.map(point => new Date(point.timestamp).toISOString());

    const option = {
      xAxis: {
        data: times,
      },
      series: [
        {
          name: 'CPU 使用率',
          data: history.map(point => point.cpu),
        },
        {
          name: '内存使用率',
          data: history.map(point => point.memory),
        },
      ],
    };

    chartInstance.current.setOption(option, { notMerge: false });
    
    // 自动滚动到最新数据
    chartInstance.current.dispatchAction({
      type: 'dataZoom',
      start: Math.max(0, 100 - (200 / history.length) * 100),
      end: 100,
    });
  };

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <div className="scan-header">
          <h3>桌面性能监控</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#27ae60' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#27ae60', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>运行中</span>
            </div>
          </div>
        </div>

        {monitoring && (
          <div>
            {/* 上下布局：曲线模式在上，数值模式在下 */}
            {/* ECharts 曲线模式 */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <Activity size={20} color="#3498db" />
                <h3 style={{ margin: 0, fontSize: '16px' }}>实时性能曲线</h3>
              </div>
              <div
                ref={chartRef}
                style={{ width: '100%', height: '300px', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
              <div style={{ 
                textAlign: 'center', 
                marginTop: '10px', 
                fontSize: '12px', 
                color: '#95a5a6' 
              }}>
                已记录 {history.length} 条数据（最近 10 分钟）
              </div>
            </div>

            {/* 数值模式 */}
            <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <Monitor size={20} color="#2c3e50" />
                <h3 style={{ margin: 0, fontSize: '16px' }}>实时数据</h3>
              </div>
              <div className="monitor-grid">
                <div className="monitor-card">
                  <div className="monitor-icon">
                    <Cpu size={40} color="#3498db" />
                  </div>
                  <div className="monitor-value">{stats.cpu}%</div>
                  <div className="monitor-label">CPU 使用率</div>
                  <div className="monitor-bar">
                    <div
                      className="monitor-bar-fill"
                      style={{ width: `${stats.cpu}%`, backgroundColor: '#3498db' }}
                    ></div>
                  </div>
                </div>

                <div className="monitor-card">
                  <div className="monitor-icon">
                    <HardDrive size={40} color="#9b59b6" />
                  </div>
                  <div className="monitor-value">{stats.memory}%</div>
                  <div className="monitor-label">内存使用率</div>
                  <div className="monitor-bar">
                    <div
                      className="monitor-bar-fill"
                      style={{ width: `${stats.memory}%`, backgroundColor: '#9b59b6' }}
                    ></div>
                  </div>
                </div>

                <div className="monitor-card">
                  <div className="monitor-icon">
                    <HardDrive size={40} color="#e67e22" />
                  </div>
                  <div className="monitor-value">{stats.disk}%</div>
                  <div className="monitor-label">磁盘活动</div>
                  <div className="monitor-bar">
                    <div
                      className="monitor-bar-fill"
                      style={{ width: `${stats.disk}%`, backgroundColor: '#e67e22' }}
                    ></div>
                  </div>
                </div>

                <div className="monitor-card">
                  <div className="monitor-icon">
                    <Radio size={40} color="#1abc9c" />
                  </div>
                  <div className="monitor-value">{stats.network} KB/s</div>
                  <div className="monitor-label">网络速度</div>
                </div>

                <div className="monitor-card">
                  <div className="monitor-icon">
                    <Monitor size={40} color="#e74c3c" />
                  </div>
                  <div className="monitor-value">{stats.fps} FPS</div>
                  <div className="monitor-label">桌面帧率</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {monitoring && (
          <div className="monitor-log">
            <h4>实时监控日志</h4>
            <div className="log-entry">
              <span className="log-time">{new Date().toLocaleTimeString()}</span>
              <span className="log-text">系统监控运行正常</span>
            </div>
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>💡 桌面监控提示</h4>
        <ul>
          <li>实时监控可以帮助发现性能瓶颈</li>
          <li>CPU 使用率持续过高可能需要检查后台进程</li>
          <li>内存使用率过高建议关闭不用的程序</li>
          <li>网络速度异常可能表示有程序在后台上传/下载</li>
        </ul>
      </div>
    </div>
  );
};

export default DesktopMonitor;
