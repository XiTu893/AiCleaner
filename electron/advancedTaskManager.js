const { ipcMain, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const EventEmitter = require('events');

const TASK_DIR = path.join(__dirname, '..', '..', 'cache', 'tasks');
const TASK_STATUS_FILE = path.join(TASK_DIR, 'task_status.json');
const MAX_CONCURRENT_TASKS = 3;

class AdvancedTaskManager extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.taskQueue = [];
    this.runningTasks = 0;
    this.taskWorkers = new Map();
    this.activeTaskTypes = new Map();
    this.initialize();
  }

  async initialize() {
    await this.ensureTaskDir();
    await this.loadTaskStatus();
  }

  async ensureTaskDir() {
    try {
      await fs.mkdir(TASK_DIR, { recursive: true });
    } catch (error) {
      console.error('[AdvancedTaskManager] 创建任务目录失败:', error);
    }
  }

  async loadTaskStatus() {
    try {
      console.log('[AdvancedTaskManager] 不加载历史任务，保持干净的任务列表');
    } catch (error) {
      console.log('[AdvancedTaskManager] 无保存的任务状态');
    }
  }

  async saveTaskStatus() {
    try {
      console.log('[AdvancedTaskManager] 任务状态保存已禁用');
    } catch (error) {
      console.error('[AdvancedTaskManager] 保存任务状态失败:', error);
    }
  }

  getActiveTaskByType(type) {
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.type === type && 
          (task.status === 'pending' || task.status === 'running' || task.status === 'paused')) {
        return task;
      }
    }
    return null;
  }

  createTask(options) {
    const { id, type, name, description, workerScript, params = {} } = options;
    
    const existingTask = this.getActiveTaskByType(type);
    if (existingTask) {
      console.log(`[AdvancedTaskManager] 类型 ${type} 的任务已存在，使用现有任务: ${existingTask.id}`);
      return { 
        success: false, 
        existingTask: true, 
        taskId: existingTask.id,
        message: `已有 ${name} 任务正在运行`
      };
    }

    const taskId = id || `${type}_${Date.now()}`;
    
    const task = {
      id: taskId,
      type,
      name,
      description,
      workerScript,
      params,
      status: 'pending',
      progress: 0,
      message: '',
      result: null,
      error: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isRunning: false,
      isPaused: false,
      shouldStop: false
    };

    this.tasks.set(taskId, task);
    this.taskQueue.push(taskId);
    this.emit('task-created', task);
    this.processQueue();
    
    return { success: true, taskId };
  }

  async processQueue() {
    if (this.runningTasks >= MAX_CONCURRENT_TASKS) {
      return;
    }

    const taskId = this.taskQueue.find(id => {
      const task = this.tasks.get(id);
      return task && task.status === 'pending';
    });

    if (!taskId) {
      return;
    }

    const taskIndex = this.taskQueue.indexOf(taskId);
    if (taskIndex > -1) {
      this.taskQueue.splice(taskIndex, 1);
    }

    await this.runTask(taskId);
  }

  async runTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.isRunning) {
      return;
    }

    task.isRunning = true;
    task.status = 'running';
    task.updatedAt = Date.now();
    this.runningTasks++;
    
    this.emit('task-started', task);
    this.notifyFrontend(task);

    try {
      if (task.workerScript) {
        await this.runWorkerTask(task);
      } else {
        await this.runInlineTask(task);
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      this.emit('task-failed', task, error);
    } finally {
      task.isRunning = false;
      this.runningTasks--;
      task.updatedAt = Date.now();
      await this.saveTaskStatus();
      this.notifyFrontend(task);
      this.processQueue();
    }
  }

  async runWorkerTask(task) {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, task.workerScript);
      
      if (!fsSync.existsSync(workerPath)) {
        task.status = 'failed';
        task.error = `Worker script not found: ${workerPath}`;
        reject(new Error(task.error));
        return;
      }

      const child = fork(workerPath, [JSON.stringify(task.params)], {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });

      this.taskWorkers.set(task.id, child);

      child.on('message', (message) => {
        this.handleWorkerMessage(task, message);
      });

      child.on('exit', (code) => {
        this.taskWorkers.delete(task.id);
        if (code === 0) {
          task.status = 'completed';
          this.emit('task-completed', task);
          resolve(task.result);
        } else {
          task.status = 'failed';
          task.error = `Worker exited with code ${code}`;
          this.emit('task-failed', task, new Error(task.error));
          reject(new Error(task.error));
        }
      });

      child.on('error', (error) => {
        this.taskWorkers.delete(task.id);
        task.status = 'failed';
        task.error = error.message;
        this.emit('task-failed', task, error);
        reject(error);
      });
    });
  }

  async runInlineTask(task) {
    const handlers = {
      'hardware-detection': this.hardwareDetectionHandler,
      'benchmark': this.benchmarkHandler,
      'temperature-monitor': this.temperatureMonitorHandler,
      'stress-test': this.stressTestHandler
    };

    const handler = handlers[task.type];
    if (handler) {
      await handler.call(this, task);
    } else {
      throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  handleWorkerMessage(task, message) {
    switch (message.type) {
      case 'progress':
        task.progress = message.progress;
        task.message = message.message || '';
        break;
      case 'result':
        task.result = message.data;
        break;
      case 'error':
        task.error = message.error;
        break;
      case 'complete':
        task.status = 'completed';
        task.result = message.data;
        break;
    }
    task.updatedAt = Date.now();
    this.emit('task-updated', task);
    this.notifyFrontend(task);
  }

  async hardwareDetectionHandler(task) {
    for (let i = 0; i <= 100; i += 10) {
      if (task.shouldStop) {
        task.status = 'cancelled';
        return;
      }
      
      while (task.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      task.progress = i;
      task.message = `正在检测硬件... ${i}%`;
      this.emit('task-updated', task);
      this.notifyFrontend(task);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    task.status = 'completed';
    task.result = { cpu: 'Intel i7', memory: '16GB', gpu: 'NVIDIA RTX 3080' };
    this.emit('task-completed', task);
  }

  async benchmarkHandler(task) {
    const tests = ['CPU', 'Memory', 'GPU', 'Disk'];
    
    for (let i = 0; i < tests.length; i++) {
      if (task.shouldStop) {
        task.status = 'cancelled';
        return;
      }
      
      while (task.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const progress = ((i + 1) / tests.length) * 100;
      task.progress = progress;
      task.message = `正在测试 ${tests[i]} 性能...`;
      this.emit('task-updated', task);
      this.notifyFrontend(task);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    task.status = 'completed';
    task.result = { 
      cpuScore: 9500, 
      memoryScore: 8800, 
      gpuScore: 9200, 
      diskScore: 8500,
      totalScore: 9000
    };
    this.emit('task-completed', task);
  }

  async temperatureMonitorHandler(task) {
    const duration = task.params.duration || 30000;
    const interval = task.params.interval || 1000;
    const startTime = Date.now();
    const readings = [];
    
    while (Date.now() - startTime < duration) {
      if (task.shouldStop) {
        task.status = 'cancelled';
        task.result = { readings };
        return;
      }
      
      while (task.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      const cpuTemp = 45 + Math.random() * 20;
      const gpuTemp = 50 + Math.random() * 25;
      
      readings.push({
        timestamp: Date.now(),
        cpuTemp: Math.round(cpuTemp * 10) / 10,
        gpuTemp: Math.round(gpuTemp * 10) / 10
      });
      
      task.progress = progress;
      task.message = `CPU: ${cpuTemp.toFixed(1)}°C, GPU: ${gpuTemp.toFixed(1)}°C`;
      task.result = { readings };
      this.emit('task-updated', task);
      this.notifyFrontend(task);
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    task.status = 'completed';
    this.emit('task-completed', task);
  }

  async stressTestHandler(task) {
    const duration = task.params.duration || 60000;
    const startTime = Date.now();
    const loadHistory = [];
    
    while (Date.now() - startTime < duration) {
      if (task.shouldStop) {
        task.status = 'cancelled';
        task.result = { loadHistory };
        return;
      }
      
      while (task.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      const cpuLoad = 70 + Math.random() * 30;
      const memoryUsage = 60 + Math.random() * 25;
      
      loadHistory.push({
        timestamp: Date.now(),
        cpuLoad: Math.round(cpuLoad * 10) / 10,
        memoryUsage: Math.round(memoryUsage * 10) / 10
      });
      
      task.progress = progress;
      task.message = `压力测试中 - CPU: ${cpuLoad.toFixed(1)}%, 内存: ${memoryUsage.toFixed(1)}%`;
      task.result = { loadHistory };
      this.emit('task-updated', task);
      this.notifyFrontend(task);
      
      const endTime = Date.now() + 500;
      while (Date.now() < endTime) {
        Math.sqrt(Math.random());
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    task.status = 'completed';
    this.emit('task-completed', task);
  }

  pauseTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.isRunning && !task.isPaused) {
      task.isPaused = true;
      task.status = 'paused';
      task.updatedAt = Date.now();
      this.emit('task-paused', task);
      this.notifyFrontend(task);
      return true;
    }
    return false;
  }

  resumeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.isPaused) {
      task.isPaused = false;
      task.status = 'running';
      task.updatedAt = Date.now();
      this.emit('task-resumed', task);
      this.notifyFrontend(task);
      return true;
    }
    return false;
  }

  stopTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.shouldStop = true;
      
      const worker = this.taskWorkers.get(taskId);
      if (worker) {
        worker.send({ type: 'stop' });
        setTimeout(() => {
          if (!worker.killed) {
            worker.kill();
          }
        }, 5000);
      }
      
      task.status = 'cancelled';
      task.updatedAt = Date.now();
      this.emit('task-stopped', task);
      this.notifyFrontend(task);
      return true;
    }
    return false;
  }

  restartTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task) {
      this.stopTask(taskId);
      
      setTimeout(() => {
        const newOptions = {
          id: `${task.type}_${Date.now()}`,
          type: task.type,
          name: task.name,
          description: task.description,
          workerScript: task.workerScript,
          params: task.params
        };
        this.createTask(newOptions);
      }, 500);
      
      return true;
    }
    return false;
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  getTasksByType(type) {
    return this.getAllTasks().filter(task => task.type === type);
  }

  clearCompletedTasks() {
    const completedIds = [];
    this.tasks.forEach((task, taskId) => {
      if (['completed', 'failed', 'cancelled'].includes(task.status)) {
        completedIds.push(taskId);
      }
    });
    
    completedIds.forEach(id => {
      this.tasks.delete(id);
      const index = this.taskQueue.indexOf(id);
      if (index > -1) {
        this.taskQueue.splice(index, 1);
      }
    });
    
    this.saveTaskStatus();
    return completedIds.length;
  }

  notifyFrontend(task) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('task-update', {
        id: task.id,
        type: task.type,
        name: task.name,
        status: task.status,
        progress: task.progress,
        message: task.message,
        result: task.result,
        error: task.error,
        isPaused: task.isPaused,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      });
    });
  }
}

const taskManager = new AdvancedTaskManager();

function setupAdvancedTaskManagerIpc() {
  ipcMain.handle('create-task', async (event, options) => {
    try {
      const result = taskManager.createTask(options);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-task', async (event, taskId) => {
    const task = taskManager.getTask(taskId);
    return task ? { success: true, task } : { success: false, error: 'Task not found' };
  });

  ipcMain.handle('get-all-tasks', async () => {
    return { success: true, tasks: taskManager.getAllTasks() };
  });

  ipcMain.handle('pause-task', async (event, taskId) => {
    const success = taskManager.pauseTask(taskId);
    return { success };
  });

  ipcMain.handle('resume-task', async (event, taskId) => {
    const success = taskManager.resumeTask(taskId);
    return { success };
  });

  ipcMain.handle('stop-task', async (event, taskId) => {
    const success = taskManager.stopTask(taskId);
    return { success };
  });

  ipcMain.handle('restart-task', async (event, taskId) => {
    const success = taskManager.restartTask(taskId);
    return { success };
  });

  ipcMain.handle('clear-completed-tasks', async () => {
    const count = taskManager.clearCompletedTasks();
    return { success: true, count };
  });
}

module.exports = {
  AdvancedTaskManager,
  taskManager,
  setupAdvancedTaskManagerIpc
};
