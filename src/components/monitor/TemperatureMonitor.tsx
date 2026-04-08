import React, { useState, useEffect, useRef } from 'react';
import { Thermometer, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import * as echarts from 'echarts';

interface TemperatureHistory {
  timestamp: number;
  cpu: number;
  gpu: number;
  motherboard: number;
  disk: number;
}

// 温度数据采样间隔（毫秒）
const SAMPLE_INTERVAL = 3000; // 3 秒
// 最大保留时间（毫秒）
const MAX_RETENTION = 7 * 24 * 60 * 60 * 1000; // 7 天
// 最大数据点数量（避免内存溢出）
const MAX_DATA_POINTS = 201600; // 7 天 * 24 小时 * 60 分钟 * 2 次/分钟（平均）

const TemperatureMonitor: React.FC = () => {
  const [temperatures, setTemperatures] = useState({
    cpu: 45,
    gpu: 42,
    motherboard: 38,
    disk: 35,
  });
  const [history, setHistory] = useState<TemperatureHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    loadTemperatures();
    const interval = setInterval(loadTemperatures, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showHistory && history.length > 1 && chartRef.current) {
      if (!chartInstance.current) {
        initChart();
      } else {
        updateChartData();
      }
    }
  }, [history, showHistory]);

  const loadTemperatures = async () => {
    try {
      const newTemps = {
        cpu: Math.floor(Math.random() * 20) + 40,
        gpu: Math.floor(Math.random() * 15) + 35,
        motherboard: Math.floor(Math.random() * 10) + 35,
        disk: Math.floor(Math.random() * 8) + 30,
      };
      
      setTemperatures(newTemps);
      
      setHistory(prev => {
        const now = Date.now();
        const cutoffTime = now - MAX_RETENTION;
        
        let newHistory = [...prev, {
          timestamp: now,
          ...newTemps,
        }];
        
        newHistory = newHistory.filter(point => point.timestamp > cutoffTime);
        
        if (newHistory.length > MAX_DATA_POINTS) {
          const sampledHistory: TemperatureHistory[] = [];
          const sampleWindow = 10 * 60 * 1000;
          let windowStart = newHistory[0].timestamp;
          let windowData: TemperatureHistory[] = [];
          
          newHistory.forEach(point => {
            if (point.timestamp - windowStart < sampleWindow) {
              windowData.push(point);
            } else {
              if (windowData.length > 0) {
                const avgPoint: TemperatureHistory = {
                  timestamp: windowStart + sampleWindow / 2,
                  cpu: Math.round(windowData.reduce((sum, p) => sum + p.cpu, 0) / windowData.length),
                  gpu: Math.round(windowData.reduce((sum, p) => sum + p.gpu, 0) / windowData.length),
                  motherboard: Math.round(windowData.reduce((sum, p) => sum + p.motherboard, 0) / windowData.length),
                  disk: Math.round(windowData.reduce((sum, p) => sum + p.disk, 0) / windowData.length),
                };
                sampledHistory.push(avgPoint);
              }
              windowStart = point.timestamp;
              windowData = [point];
            }
          });
          
          if (windowData.length > 0) {
            const avgPoint: TemperatureHistory = {
              timestamp: windowStart + sampleWindow / 2,
              cpu: Math.round(windowData.reduce((sum, p) => sum + p.cpu, 0) / windowData.length),
              gpu: Math.round(windowData.reduce((sum, p) => sum + p.gpu, 0) / windowData.length),
              motherboard: Math.round(windowData.reduce((sum, p) => sum + p.motherboard, 0) / windowData.length),
              disk: Math.round(windowData.reduce((sum, p) => sum + p.disk, 0) / windowData.length),
            };
            sampledHistory.push(avgPoint);
          }
          
          newHistory = sampledHistory;
        }
        
        return newHistory;
      });
    } catch (error) {
      console.error('加载温度失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const initChart = () => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 32, 44, 0.95)',
        borderColor: 'var(--border-color)',
        textStyle: { color: 'var(--text-primary)' },
        formatter: (params: any) => {
          let html = `<div style="font-weight: bold; margin-bottom: 8px; color: var(--text-primary);">${params[0].name}</div>`;
          params.forEach((param: any) => {
            html += `<div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
              <span style="color: var(--text-secondary);">${param.seriesName}: </span>
              <span style="font-weight: bold; color: ${param.color};">${param.value}°C</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['CPU', 'GPU', '主板', '硬盘'],
        bottom: 10,
        textStyle: { color: 'var(--text-secondary)' },
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
            color: 'var(--primary-color)',
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
        axisLine: { lineStyle: { color: 'var(--border-color)' } },
        axisLabel: {
          color: 'var(--text-secondary)',
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
        name: '温度 (°C)',
        min: 0,
        max: 100,
        interval: 20,
        axisLine: { lineStyle: { color: 'var(--border-color)' } },
        axisLabel: {
          color: 'var(--text-secondary)',
          formatter: '{value}°C',
        },
        splitLine: {
          lineStyle: {
            color: 'var(--bg-tertiary)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'CPU',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 4,
          data: [],
          lineStyle: { color: '#e74c3c', width: 2 },
          itemStyle: { color: '#e74c3c', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(231, 76, 60, 0.3)' },
              { offset: 1, color: 'rgba(231, 76, 60, 0.05)' },
            ]),
          },
        },
        {
          name: 'GPU',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 4,
          data: [],
          lineStyle: { color: '#f39c12', width: 2 },
          itemStyle: { color: '#f39c12', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(243, 156, 18, 0.3)' },
              { offset: 1, color: 'rgba(243, 156, 18, 0.05)' },
            ]),
          },
        },
        {
          name: '主板',
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
          name: '硬盘',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 4,
          data: [],
          lineStyle: { color: '#27ae60', width: 2 },
          itemStyle: { color: '#27ae60', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(39, 174, 96, 0.3)' },
              { offset: 1, color: 'rgba(39, 174, 96, 0.05)' },
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
          name: 'CPU',
          data: history.map(point => point.cpu),
        },
        {
          name: 'GPU',
          data: history.map(point => point.gpu),
        },
        {
          name: '主板',
          data: history.map(point => point.motherboard),
        },
        {
          name: '硬盘',
          data: history.map(point => point.disk),
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

  const getTempStatus = (temp: number) => {
    if (temp < 50) return { status: 'good', color: '#27ae60', text: '正常' };
    if (temp < 70) return { status: 'warning', color: '#f39c12', text: '偏高' };
    return { status: 'danger', color: '#e74c3c', text: '高温' };
  };

  const getStatusIcon = (status: string) => {
    if (status === 'good') return <CheckCircle size={20} color="#27ae60" />;
    return <AlertTriangle size={20} color="#f39c12" />;
  };

  const tempData = [
    { name: 'CPU 温度', value: temperatures.cpu, unit: '°C', max: 100 },
    { name: '显卡温度', value: temperatures.gpu, unit: '°C', max: 100 },
    { name: '主板温度', value: temperatures.motherboard, unit: '°C', max: 80 },
    { name: '硬盘温度', value: temperatures.disk, unit: '°C', max: 60 },
  ];

  const formatTimeRange = (history: TemperatureHistory[]) => {
    if (history.length === 0) return '0 分钟';
    const firstTime = history[0].timestamp;
    const lastTime = history[history.length - 1].timestamp;
    const minutes = Math.round((lastTime - firstTime) / (1000 * 60));
    
    if (minutes < 60) return `${minutes}分钟`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}小时`;
    return `${Math.round(minutes / 1440)}天`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">正在加载温度数据...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 温度概览 */}
      <div className="card" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '25px' }}>
        <Thermometer size={64} color="#e74c3c" style={{ marginBottom: '15px' }} />
        <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '10px' }}>实时温度监控</h3>
        <p style={{ color: 'var(--text-secondary)' }}>CPU、显卡、主板、硬盘温度实时监测</p>
      </div>

      {/* 历史曲线 */}
      <div className="card" style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--primary-color)" />
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>温度变化曲线</h3>
          </div>
          <button
            className="secondary-button"
            onClick={() => setShowHistory(!showHistory)}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            {showHistory ? '隐藏曲线' : '显示曲线'}
          </button>
        </div>
        
        {showHistory ? (
          history.length > 1 ? (
            <div style={{ position: 'relative' }}>
              <div
                ref={chartRef}
                style={{ width: '100%', height: '400px', borderRadius: '8px' }}
              />
              <div style={{ 
                textAlign: 'center', 
                marginTop: '10px', 
                fontSize: '12px', 
                color: 'var(--text-secondary)' 
              }}>
                已记录 {history.length} 条数据（{formatTimeRange(history)}）
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              borderRadius: '8px'
            }}>
              <Activity size={48} style={{ marginBottom: '10px', opacity: 0.5, color: 'var(--text-secondary)' }} />
              <p>正在收集数据，请稍候...</p>
            </div>
          )
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            borderRadius: '8px'
          }}>
            <p>历史曲线已隐藏，点击"显示曲线"按钮查看</p>
          </div>
        )}
      </div>

      {/* 温度详情 */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {tempData.map((item, index) => {
          const status = getTempStatus(item.value);
          const percent = (item.value / item.max) * 100;
          return (
            <div key={index} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <Thermometer size={24} color={status.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px', color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>安全范围：0-{item.max}°C</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: status.color }}>
                    {item.value}°C
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginTop: '5px' }}>
                    {getStatusIcon(status.status)}
                    <span style={{ fontSize: '13px', color: status.color, fontWeight: 'bold' }}>{status.text}</span>
                  </div>
                </div>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${status.color}, ${status.color})`,
                    transition: 'width 0.5s',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>0°C</span>
                <span>{item.max}°C</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 温度建议 */}
      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">💡 温度建议</div>
        <div style={{ lineHeight: '2', color: 'var(--text-secondary)' }}>
          <p>• <strong style={{ color: 'var(--text-primary)' }}>CPU 温度：</strong>正常范围 30-60°C，超过 80°C 需注意散热</p>
          <p>• <strong style={{ color: 'var(--text-primary)' }}>显卡温度：</strong>正常范围 30-70°C，游戏时不超过 85°C</p>
          <p>• <strong style={{ color: 'var(--text-primary)' }}>主板温度：</strong>正常范围 30-50°C，超过 60°C 需检查风道</p>
          <p>• <strong style={{ color: 'var(--text-primary)' }}>硬盘温度：</strong>正常范围 30-45°C，SSD 不超过 70°C</p>
          <p>• <strong style={{ color: 'var(--text-primary)' }}>降温建议：</strong>清理灰尘、改善风道、更换硅脂、增加风扇</p>
        </div>
      </div>

      {/* 高温预警 */}
      {(temperatures.cpu > 70 || temperatures.gpu > 70) && (
        <div className="card" style={{ marginTop: '25px', borderLeft: '4px solid #e74c3c', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
            <AlertTriangle size={32} color="#e74c3c" />
            <div>
              <div style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '16px', marginBottom: '5px' }}>
                ⚠️ 高温预警
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {temperatures.cpu > 70 && `CPU 温度过高 (${temperatures.cpu}°C)，建议立即清理散热器或检查风扇。`}
                {temperatures.gpu > 70 && `显卡温度过高 (${temperatures.gpu}°C)，建议降低负载或改善散热。`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemperatureMonitor;
