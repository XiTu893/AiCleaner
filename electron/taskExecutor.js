const { fork } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const TASK_DIR = path.join(__dirname, '..', '..', 'cache', 'tasks');
const TASK_STATUS_FILE = path.join(TASK_DIR, 'task_status.json');

// 任务状态
const taskStatus = {
  junkScan: {
    isRunning: false,
    taskId: null,
    startTime: null,
    lastUpdateTime: null,
  },
  cdriveScan: {
    isRunning: false,
    taskId: null,
    startTime: null,
    lastUpdateTime: null,
  }
};

// 确保任务目录存在
async function ensureTaskDir() {
  try {
    await fs.mkdir(TASK_DIR, { recursive: true });
  } catch (error) {
    console.error('[TaskExecutor] 创建任务目录失败:', error);
  }
}

// 加载任务状态
async function loadTaskStatus() {
  try {
    await ensureTaskDir();
    const data = await fs.readFile(TASK_STATUS_FILE, 'utf-8');
    const savedStatus = JSON.parse(data);
    Object.assign(taskStatus, savedStatus);
  } catch (error) {
    console.log('[TaskExecutor] 无保存的任务状态');
  }
}

// 保存任务状态
async function saveTaskStatus() {
  try {
    await ensureTaskDir();
    await fs.writeFile(TASK_STATUS_FILE, JSON.stringify(taskStatus, null, 2), 'utf-8');
  } catch (error) {
    console.error('[TaskExecutor] 保存任务状态失败:', error);
  }
}

// 启动垃圾扫描任务
async function startJunkScanTask() {
  if (taskStatus.junkScan.isRunning) {
    console.log('[TaskExecutor] 垃圾扫描任务已在运行');
    return { success: false, message: '任务已在运行', taskId: taskStatus.junkScan.taskId };
  }

  // 生成任务ID
  const taskId = `junk_scan_${Date.now()}`;
  taskStatus.junkScan.isRunning = true;
  taskStatus.junkScan.taskId = taskId;
  taskStatus.junkScan.startTime = Date.now();
  taskStatus.junkScan.lastUpdateTime = Date.now();
  
  await saveTaskStatus();

  console.log('[TaskExecutor] 启动垃圾扫描子进程');

  // 创建子进程执行扫描
  const scanScript = path.join(__dirname, 'junkScanWorker.js');
  const child = fork(scanScript, [taskId], {
    detached: false,
    stdio: 'inherit'
  });

  child.on('exit', async (code) => {
    console.log(`[TaskExecutor] 垃圾扫描子进程退出，代码: ${code}`);
    taskStatus.junkScan.isRunning = false;
    await saveTaskStatus();
  });

  child.on('error', async (error) => {
    console.error('[TaskExecutor] 垃圾扫描子进程错误:', error);
    taskStatus.junkScan.isRunning = false;
    await saveTaskStatus();
  });

  return { success: true, message: '任务已启动', taskId };
}

// 暂停垃圾扫描任务
async function pauseJunkScanTask() {
  if (!taskStatus.junkScan.isRunning) {
    return { success: false, message: '没有正在运行的任务' };
  }

  const stateFile = path.join(TASK_DIR, 'junk_scan_state.json');
  try {
    let state = {};
    try {
      const data = await fs.readFile(stateFile, 'utf-8');
      state = JSON.parse(data);
    } catch (e) {}
    
    state.isPaused = true;
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
    return { success: true, message: '已暂停' };
  } catch (error) {
    console.error('[TaskExecutor] 暂停任务失败:', error);
    return { success: false, message: '暂停失败' };
  }
}

// 继续垃圾扫描任务
async function resumeJunkScanTask() {
  if (!taskStatus.junkScan.isRunning) {
    return { success: false, message: '没有正在运行的任务' };
  }

  const stateFile = path.join(TASK_DIR, 'junk_scan_state.json');
  try {
    let state = {};
    try {
      const data = await fs.readFile(stateFile, 'utf-8');
      state = JSON.parse(data);
    } catch (e) {}
    
    state.isPaused = false;
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
    return { success: true, message: '已继续' };
  } catch (error) {
    console.error('[TaskExecutor] 继续任务失败:', error);
    return { success: false, message: '继续失败' };
  }
}

// 停止垃圾扫描任务
async function stopJunkScanTask() {
  const stateFile = path.join(TASK_DIR, 'junk_scan_state.json');
  try {
    let state = {};
    try {
      const data = await fs.readFile(stateFile, 'utf-8');
      state = JSON.parse(data);
    } catch (e) {}
    
    state.shouldStop = true;
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
    return { success: true, message: '停止命令已发送' };
  } catch (error) {
    console.error('[TaskExecutor] 停止任务失败:', error);
    return { success: false, message: '停止失败' };
  }
}

// 启动 C 盘扫描任务
async function startCDriveScanTask() {
  if (taskStatus.cdriveScan.isRunning) {
    console.log('[TaskExecutor] C 盘扫描任务已在运行');
    return { success: false, message: '任务已在运行', taskId: taskStatus.cdriveScan.taskId };
  }

  const taskId = `cdrive_scan_${Date.now()}`;
  taskStatus.cdriveScan.isRunning = true;
  taskStatus.cdriveScan.taskId = taskId;
  taskStatus.cdriveScan.startTime = Date.now();
  taskStatus.cdriveScan.lastUpdateTime = Date.now();
  
  await saveTaskStatus();

  console.log('[TaskExecutor] 启动 C 盘扫描子进程');

  const scanScript = path.join(__dirname, 'cdriveScanWorker.js');
  const child = fork(scanScript, [taskId], {
    detached: false,
    stdio: 'inherit'
  });

  child.on('exit', async (code) => {
    console.log(`[TaskExecutor] C 盘扫描子进程退出，代码: ${code}`);
    taskStatus.cdriveScan.isRunning = false;
    await saveTaskStatus();
  });

  child.on('error', async (error) => {
    console.error('[TaskExecutor] C 盘扫描子进程错误:', error);
    taskStatus.cdriveScan.isRunning = false;
    await saveTaskStatus();
  });

  return { success: true, message: '任务已启动', taskId };
}

// 获取任务状态
async function getTaskStatus(taskType) {
  if (taskType === 'junkScan') {
    const stateFile = path.join(TASK_DIR, 'junk_scan_state.json');
    let scanState = null;
    
    try {
      const data = await fs.readFile(stateFile, 'utf-8');
      scanState = JSON.parse(data);
    } catch (error) {
      scanState = {
        isScanning: taskStatus.junkScan.isRunning,
        isPaused: false,
        scanProgress: 0,
        scanStatus: '',
        currentCategoryIndex: -1,
        categories: [
          { id: 'system_temp', name: '系统临时文件', description: 'Windows 系统临时文件、更新残留、Prefetch 缓存', items: [], scanned: false, scanning: false },
          { id: 'app_cache', name: '应用缓存', description: '浏览器缓存、微信、QQ 等应用缓存文件', items: [], scanned: false, scanning: false },
          { id: 'registry', name: '注册表冗余', description: '无效注册表项、残留注册表', items: [], scanned: false, scanning: false },
          { id: 'large_files', name: '大文件', description: '超过 100MB 的大文件', items: [], scanned: false, scanning: false },
        ],
      };
    }

    scanState.isScanning = taskStatus.junkScan.isRunning;
    
    return scanState;
  } else if (taskType === 'cdriveScan') {
    const stateFile = path.join(TASK_DIR, 'cdrive_scan_state.json');
    let scanState = null;
    
    try {
      const data = await fs.readFile(stateFile, 'utf-8');
      scanState = JSON.parse(data);
    } catch (error) {
      scanState = {
        isScanning: taskStatus.cdriveScan.isRunning,
        scanProgress: 0,
        scanStatus: '',
        currentScanItem: '',
        totalSpace: 500 * 1024 * 1024 * 1024, // 500GB
        usedSpace: 350 * 1024 * 1024 * 1024, // 350GB
        freeSpace: 150 * 1024 * 1024 * 1024, // 150GB
        folders: [],
        largeFiles: [],
        cleanupItems: [],
        migratableSoftware: [],
      };
    }

    scanState.isScanning = taskStatus.cdriveScan.isRunning;
    
    return scanState;
  }

  return taskStatus[taskType] || null;
}

// 初始化
loadTaskStatus();

module.exports = {
  startJunkScanTask,
  pauseJunkScanTask,
  resumeJunkScanTask,
  stopJunkScanTask,
  startCDriveScanTask,
  getTaskStatus,
  taskStatus,
};
