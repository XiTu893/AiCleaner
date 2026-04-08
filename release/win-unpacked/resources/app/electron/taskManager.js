const { ipcMain, BrowserWindow } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// 缓存目录
const CACHE_DIR = path.join(__dirname, '..', '..', 'cache');
// 缓存过期时间（毫秒）
const CACHE_EXPIRY = {
  junkScan: 30 * 60 * 1000,      // 垃圾扫描：30 分钟
  driverDetect: 60 * 60 * 1000,  // 驱动检测：1 小时
  benchmark: 24 * 60 * 60 * 1000, // 性能评测：24 小时
  softwareList: 5 * 60 * 1000,   // 软件列表：5 分钟
};

// 确保缓存目录存在
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('创建缓存目录失败:', error);
  }
}

// 缓存数据结构
class TaskCache {
  constructor() {
    this.cache = new Map();
    this.runningTasks = new Map();
    ensureCacheDir();
  }

  // 生成缓存键
  generateKey(taskType, params = {}) {
    return `${taskType}_${JSON.stringify(params)}`;
  }

  // 检查缓存是否有效
  isValidCache(cacheItem) {
    if (!cacheItem) return false;
    const now = Date.now();
    const expiry = CACHE_EXPIRY[cacheItem.taskType] || 60 * 60 * 1000;
    return (now - cacheItem.timestamp) < expiry;
  }

  // 获取缓存
  async get(taskType, params = {}) {
    const key = this.generateKey(taskType, params);
    
    // 先检查内存缓存
    if (this.cache.has(key)) {
      const cacheItem = this.cache.get(key);
      if (this.isValidCache(cacheItem)) {
        console.log(`[TaskCache] 命中内存缓存：${key}`);
        return cacheItem.data;
      }
      this.cache.delete(key);
    }

    // 检查文件缓存
    try {
      const cacheFile = path.join(CACHE_DIR, `${key}.json`);
      const data = await fs.readFile(cacheFile, 'utf-8');
      const cacheItem = JSON.parse(data);
      
      if (this.isValidCache(cacheItem)) {
        console.log(`[TaskCache] 命中文件缓存：${key}`);
        this.cache.set(key, cacheItem); // 加载到内存
        return cacheItem.data;
      }
      
      // 删除过期缓存
      await fs.unlink(cacheFile);
    } catch (error) {
      // 文件不存在或读取失败，忽略
    }

    return null;
  }

  // 设置缓存
  async set(taskType, params, data) {
    const key = this.generateKey(taskType, params);
    const cacheItem = {
      taskType,
      timestamp: Date.now(),
      data,
    };

    // 保存到内存缓存
    this.cache.set(key, cacheItem);

    // 保存到文件缓存
    try {
      const cacheFile = path.join(CACHE_DIR, `${key}.json`);
      await fs.writeFile(cacheFile, JSON.stringify(cacheItem, null, 2), 'utf-8');
      console.log(`[TaskCache] 已保存缓存：${key}`);
    } catch (error) {
      console.error('保存文件缓存失败:', error);
    }
  }

  // 清除缓存
  async clear(taskType) {
    const keysToDelete = [];
    
    // 清除内存缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith(taskType)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));

    // 清除文件缓存
    try {
      const files = await fs.readdir(CACHE_DIR);
      for (const file of files) {
        if (file.startsWith(taskType)) {
          await fs.unlink(path.join(CACHE_DIR, file));
        }
      }
    } catch (error) {
      console.error('清除文件缓存失败:', error);
    }

    console.log(`[TaskCache] 已清除 ${taskType} 缓存`);
  }

  // 检查任务是否正在运行
  isTaskRunning(taskId) {
    return this.runningTasks.has(taskId);
  }

  // 注册运行中的任务
  registerTask(taskId, taskPromise) {
    this.runningTasks.set(taskId, taskPromise);
    taskPromise.finally(() => {
      this.runningTasks.delete(taskId);
    });
  }

  // 获取运行中的任务
  getRunningTask(taskId) {
    return this.runningTasks.get(taskId);
  }
}

const taskCache = new TaskCache();

// 后台任务执行器
async function runBackgroundTask(taskId, taskFn, taskType, params = {}) {
  // 检查是否已有相同任务在运行
  if (taskCache.isTaskRunning(taskId)) {
    console.log(`[TaskManager] 任务已在运行：${taskId}`);
    return taskCache.getRunningTask(taskId);
  }

  // 检查是否有有效缓存
  const cachedResult = await taskCache.get(taskType, params);
  if (cachedResult) {
    console.log(`[TaskManager] 使用缓存结果：${taskId}`);
    return Promise.resolve(cachedResult);
  }

  // 执行任务
  console.log(`[TaskManager] 开始执行后台任务：${taskId}`);
  const taskPromise = taskFn();
  
  // 注册运行中的任务
  taskCache.registerTask(taskId, taskPromise);

  try {
    const result = await taskPromise;
    
    // 缓存结果
    await taskCache.set(taskType, params, result);
    
    console.log(`[TaskManager] 任务完成：${taskId}`);
    return result;
  } catch (error) {
    console.error(`[TaskManager] 任务失败：${taskId}`, error);
    throw error;
  }
}

// IPC 处理器
function setupTaskManagerIpc() {
  // 获取后台任务状态
  ipcMain.handle('get-task-status', async (event, taskId) => {
    return {
      running: taskCache.isTaskRunning(taskId),
    };
  });

  // 清除指定类型的缓存
  ipcMain.handle('clear-cache', async (event, taskType) => {
    await taskCache.clear(taskType);
    return { success: true };
  });

  // 清除所有缓存
  ipcMain.handle('clear-all-cache', async () => {
    for (const taskType of Object.keys(CACHE_EXPIRY)) {
      await taskCache.clear(taskType);
    }
    return { success: true };
  });

  // 获取缓存统计
  ipcMain.handle('get-cache-stats', async () => {
    try {
      const files = await fs.readdir(CACHE_DIR);
      let totalSize = 0;
      let fileCount = 0;

      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileCount++;
      }

      return {
        fileCount,
        totalSize,
        totalSizeFormatted: formatSize(totalSize),
      };
    } catch (error) {
      return { fileCount: 0, totalSize: 0, totalSizeFormatted: '0 B' };
    }
  });
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes >= 1073741824) {
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  } else if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

// 导出
module.exports = {
  taskCache,
  runBackgroundTask,
  setupTaskManagerIpc,
};
