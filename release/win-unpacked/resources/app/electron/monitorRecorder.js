const { ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// 监控数据目录
const MONITOR_DATA_DIR = path.join(__dirname, '..', '..', 'monitor-data');

// 确保目录存在
async function ensureDataDir() {
  try {
    await fs.mkdir(MONITOR_DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('创建监控数据目录失败:', error);
  }
}

// 监控数据记录器
class MonitorDataRecorder {
  constructor() {
    this.recording = false;
    this.interval = null;
    this.dataBuffer = [];
    this.maxBufferSize = 1000; // 内存中最多保留 1000 条记录
    ensureDataDir();
  }

  // 开始记录
  start(intervalMs = 10000) {
    if (this.recording) {
      console.log('[MonitorRecorder] 已在记录中');
      return;
    }

    this.recording = true;
    console.log(`[MonitorRecorder] 开始记录，间隔：${intervalMs}ms`);

    this.interval = setInterval(async () => {
      try {
        // 获取系统使用率
        const usage = await this.getSystemUsage();
        
        // 添加到缓冲区
        this.dataBuffer.push({
          timestamp: Date.now(),
          ...usage,
        });

        // 如果缓冲区满了，写入文件
        if (this.dataBuffer.length >= this.maxBufferSize) {
          await this.flushToFile();
        }

        // 通知渲染进程（可选）
        this.notifyRenderer(usage);
      } catch (error) {
        console.error('[MonitorRecorder] 记录失败:', error);
      }
    }, intervalMs);
  }

  // 停止记录
  stop() {
    if (!this.recording) return;

    this.recording = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // 保存剩余数据
    if (this.dataBuffer.length > 0) {
      this.flushToFile();
    }

    console.log('[MonitorRecorder] 停止记录');
  }

  // 获取系统使用率
  async getSystemUsage() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      const os = require('os');

      if (process.platform !== 'win32') {
        resolve({ cpu: 0, memory: 0, freeMemory: 0, totalMemory: 0 });
        return;
      }

      exec('wmic cpu get loadpercentage', (error, stdout) => {
        let cpuUsage = 0;
        if (!error && stdout) {
          const match = stdout.match(/(\d+)/);
          if (match) {
            cpuUsage = parseInt(match[1]);
          }
        }

        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

        resolve({
          cpu: cpuUsage,
          memory: memoryUsage,
          freeMemory: freeMemory,
          totalMemory: totalMemory,
        });
      });
    });
  }

  // 刷新到文件
  async flushToFile() {
    if (this.dataBuffer.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const dataFile = path.join(MONITOR_DATA_DIR, `${today}.json`);

      // 读取现有数据
      let existingData = [];
      try {
        const data = await fs.readFile(dataFile, 'utf-8');
        existingData = JSON.parse(data);
      } catch (error) {
        // 文件不存在或解析失败，使用空数组
      }

      // 合并数据
      const newData = [...existingData, ...this.dataBuffer];

      // 保留最近 7 天的数据
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const filteredData = newData.filter(item => item.timestamp > sevenDaysAgo);

      // 写入文件
      await fs.writeFile(dataFile, JSON.stringify(filteredData, null, 2), 'utf-8');

      console.log(`[MonitorRecorder] 已保存 ${this.dataBuffer.length} 条记录到 ${dataFile}`);

      // 清空缓冲区
      this.dataBuffer = [];
    } catch (error) {
      console.error('[MonitorRecorder] 保存到文件失败:', error);
    }
  }

  // 通知渲染进程
  notifyRenderer(data) {
    const { BrowserWindow } = require('electron');
    const windows = BrowserWindow.getAllWindows();
    
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('monitor-data', data);
      }
    });
  }

  // 获取历史数据
  async getHistory(days = 7) {
    try {
      const files = await fs.readdir(MONITOR_DATA_DIR);
      const allData = [];

      const daysAgo = Date.now() - (days * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(MONITOR_DATA_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);

        // 过滤出指定天数的数据
        const filtered = parsed.filter(item => item.timestamp > daysAgo);
        allData.push(...filtered);
      }

      // 按时间排序
      allData.sort((a, b) => a.timestamp - b.timestamp);

      return allData;
    } catch (error) {
      console.error('[MonitorRecorder] 获取历史数据失败:', error);
      return [];
    }
  }

  // 清除历史数据
  async clearHistory(days = 7) {
    try {
      const files = await fs.readdir(MONITOR_DATA_DIR);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(MONITOR_DATA_DIR, file);
        
        if (days === 0) {
          // 清除所有
          await fs.unlink(filePath);
        } else {
          const daysAgo = Date.now() - (days * 24 * 60 * 60 * 1000);
          const data = await fs.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(data);
          const filtered = parsed.filter(item => item.timestamp > daysAgo);
          
          if (filtered.length === 0) {
            await fs.unlink(filePath);
          } else {
            await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
          }
        }
      }

      console.log(`[MonitorRecorder] 已清除${days === 0 ? '所有' : days + '天前的'}历史数据`);
    } catch (error) {
      console.error('[MonitorRecorder] 清除历史数据失败:', error);
    }
  }
}

const monitorRecorder = new MonitorDataRecorder();

// 设置 IPC 处理器
function setupMonitorRecorderIpc() {
  // 开始记录
  ipcMain.handle('start-monitor-recording', async (event, intervalMs = 10000) => {
    monitorRecorder.start(intervalMs);
    return { success: true };
  });

  // 停止记录
  ipcMain.handle('stop-monitor-recording', async () => {
    monitorRecorder.stop();
    return { success: true };
  });

  // 获取记录状态
  ipcMain.handle('get-recording-status', async () => {
    return { recording: monitorRecorder.recording };
  });

  // 获取历史数据
  ipcMain.handle('get-monitor-history', async (event, days = 7) => {
    const data = await monitorRecorder.getHistory(days);
    return data;
  });

  // 清除历史数据
  ipcMain.handle('clear-monitor-history', async (event, days = 0) => {
    await monitorRecorder.clearHistory(days);
    return { success: true };
  });

  // 获取当前缓冲数据
  ipcMain.handle('get-monitor-buffer', async () => {
    return monitorRecorder.dataBuffer;
  });
}

module.exports = {
  monitorRecorder,
  setupMonitorRecorderIpc,
};
