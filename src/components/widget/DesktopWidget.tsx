import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cpu, HardDrive, X } from 'lucide-react';

interface WidgetData {
  cpu: number;
  memory: number;
  timestamp: number;
}

const DesktopWidget: React.FC = () => {
  const [data, setData] = useState<WidgetData>({ cpu: 0, memory: 0, timestamp: Date.now() });
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleWidgetData = (widgetData: WidgetData) => {
      setData(widgetData);
    };

    window.electronAPI.onWidgetData(handleWidgetData);

    return () => {
      window.electronAPI.removeWidgetDataListener();
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getUsageColor = (percent: number) => {
    if (percent < 50) return '#27ae60';
    if (percent < 80) return '#f39c12';
    return '#e74c3c';
  };

  const handleClose = async () => {
    try {
      await window.electronAPI.closeWidget();
    } catch (error) {
      console.error('关闭 widget 失败:', error);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '380px',
        height: '48px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: 'white',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 99999,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <Cpu size={16} style={{ color: getUsageColor(data.cpu) }} />
        <span style={{ fontSize: '11px', opacity: 0.7 }}>CPU</span>
        <span style={{
          fontSize: '15px',
          fontWeight: 'bold',
          color: getUsageColor(data.cpu)
        }}>
          {data.cpu}%
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <HardDrive size={16} style={{ color: getUsageColor(data.memory) }} />
        <span style={{ fontSize: '11px', opacity: 0.7 }}>内存</span>
        <span style={{
          fontSize: '15px',
          fontWeight: 'bold',
          color: getUsageColor(data.memory)
        }}>
          {data.memory}%
        </span>
      </div>

      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.5)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '4px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default DesktopWidget;
