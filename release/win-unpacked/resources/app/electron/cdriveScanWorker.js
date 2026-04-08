const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const softwareMigration = require('./softwareMigration');

const execAsync = promisify(exec);

const TASK_DIR = path.join(__dirname, '..', '..', 'cache', 'tasks');
const STATE_FILE = path.join(TASK_DIR, 'cdrive_scan_state.json');

let scanState = {
  isScanning: true,
  scanProgress: 0,
  scanStatus: '',
  currentScanItem: '',
  totalSpace: 0,
  usedSpace: 0,
  freeSpace: 0,
  folders: [],
  largeFiles: [],
  cleanupItems: [],
  migratableSoftware: [],
  lastUpdateTime: Date.now(),
};

async function ensureTaskDir() {
  try {
    await fs.mkdir(TASK_DIR, { recursive: true });
  } catch (error) {
    console.error('[CDriveScanWorker] 创建任务目录失败:', error);
  }
}

async function saveState() {
  try {
    await ensureTaskDir();
    scanState.lastUpdateTime = Date.now();
    await fs.writeFile(STATE_FILE, JSON.stringify(scanState, null, 2), 'utf-8');
  } catch (error) {
    console.error('[CDriveScanWorker] 保存状态失败:', error);
  }
}

function updateCurrentScanItem(itemPath) {
  let displayPath = itemPath;
  if (displayPath.length > 60) {
    const halfLength = 25;
    displayPath = displayPath.substring(0, halfLength) + '...' + displayPath.substring(displayPath.length - halfLength);
  }
  scanState.currentScanItem = displayPath;
}

async function getFolderSize(folderPath) {
  let totalSize = 0;
  
  try {
    if (!fsSync.existsSync(folderPath)) {
      return 0;
    }
    
    const entries = fsSync.readdirSync(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          updateCurrentScanItem(fullPath);
          await saveState();
          await new Promise(resolve => setTimeout(resolve, 0.5));
          totalSize += await getFolderSize(fullPath);
        } else {
          const stats = fsSync.statSync(fullPath);
          totalSize += stats.size;
        }
      } catch (error) {
      }
    }
  } catch (error) {
    console.error(`[CDriveScanWorker] 获取文件夹大小失败 ${folderPath}:`, error);
  }
  
  return totalSize;
}

async function scanLargeFiles(folderPath, minSizeMB = 100) {
  const largeFiles = [];
  const minSizeBytes = minSizeMB * 1024 * 1024;
  
  async function scanFolder(currentPath) {
    try {
      if (!fsSync.existsSync(currentPath)) {
        return;
      }
      
      const entries = fsSync.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            updateCurrentScanItem(fullPath);
            await saveState();
            await new Promise(resolve => setTimeout(resolve, 0.5));
            await scanFolder(fullPath);
          } else {
            const stats = fsSync.statSync(fullPath);
            if (stats.size >= minSizeBytes) {
              largeFiles.push({
                name: entry.name,
                sizeMB: (stats.size / 1024 / 1024).toFixed(2),
                size: stats.size,
                path: fullPath,
                type: path.extname(entry.name).slice(1) || 'unknown',
                selected: false,
                description: '大文件',
                modifiedTime: stats.mtime.toISOString(),
              });
            }
          }
        } catch (error) {
        }
      }
    } catch (error) {
      console.error(`[CDriveScanWorker] 扫描文件夹失败 ${currentPath}:`, error);
    }
  }
  
  await scanFolder(folderPath);
  return largeFiles.sort((a, b) => b.size - a.size);
}

async function addCleanupItem(name, path, type, description, safe = true) {
  let size = 0;
  try {
    if (fsSync.existsSync(path)) {
      const stats = fsSync.statSync(path);
      if (stats.isDirectory()) {
        size = await getFolderSize(path);
      } else {
        size = stats.size;
      }
    }
  } catch (error) {
    console.error(`[CDriveScanWorker] 获取 ${name} 大小失败:`, error);
  }
  
  if (size > 0 || safe) {
    scanState.cleanupItems.push({
      name,
      path,
      type,
      description,
      size,
      sizeMB: (size / 1024 / 1024).toFixed(2),
      sizeGB: (size / 1024 / 1024 / 1024).toFixed(2),
      selected: safe,
    });
  }
}

async function main() {
  console.log('[CDriveScanWorker] C盘扫描工作进程启动');
  await ensureTaskDir();
  
  scanState.scanProgress = 0;
  scanState.scanStatus = '正在获取磁盘信息...';
  scanState.cleanupItems = [];
  await saveState();
  
  try {
    console.log('[CDriveScanWorker] 正在获取C盘信息...');
    const { stdout } = await execAsync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace');
    console.log('[CDriveScanWorker] WMIC输出:', stdout);
    
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    console.log('[CDriveScanWorker] 处理后的行:', lines);
    
    let totalSpace = 0;
    let freeSpace = 0;
    
    if (lines.length > 1) {
      const dataLine = lines[1].trim();
      const parts = dataLine.split(/\s+/).filter(part => part);
      console.log('[CDriveScanWorker] 数据部分:', parts);
      
      if (parts.length >= 2) {
        freeSpace = parseInt(parts[0]) || 0;
        totalSpace = parseInt(parts[1]) || 0;
      }
    }
    
    console.log('[CDriveScanWorker] 总容量:', totalSpace, '字节, 可用:', freeSpace, '字节');
    
    scanState.totalSpace = totalSpace;
    scanState.freeSpace = freeSpace;
    scanState.usedSpace = totalSpace - freeSpace;
    scanState.scanProgress = 3;
    scanState.scanStatus = '正在扫描可清理内容...';
    await saveState();
    
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\' + (process.env.USERNAME || '');
    const localAppData = process.env.LOCALAPPDATA || path.join(userProfile, 'AppData', 'Local');
    const appData = process.env.APPDATA || path.join(userProfile, 'AppData', 'Roaming');
    const publicDir = process.env.PUBLIC || 'C:\\Users\\Public';
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    
    const cleanupTasks = [
      { name: '回收站', path: 'C:\\$Recycle.Bin', type: 'recycle', description: '回收站中的所有文件', safe: true },
      { name: 'Windows临时文件', path: 'C:\\Windows\\Temp', type: 'temp', description: 'Windows系统临时文件', safe: true },
      { name: '用户临时文件', path: path.join(localAppData, 'Temp'), type: 'temp', description: '用户临时文件', safe: true },
      { name: 'Windows更新下载', path: 'C:\\Windows\\SoftwareDistribution\\Download', type: 'update', description: 'Windows更新下载缓存', safe: true },
      { name: '预读文件', path: 'C:\\Windows\\Prefetch', type: 'prefetch', description: 'Windows预读文件', safe: true },
      { name: '缩略图缓存', path: path.join(localAppData, 'Microsoft', 'Windows', 'Explorer'), type: 'thumbnails', description: 'Windows缩略图缓存', safe: true },
      { name: '浏览器缓存 - Chrome', path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'), type: 'browser', description: 'Chrome浏览器缓存', safe: true },
      { name: '浏览器缓存 - Edge', path: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'), type: 'browser', description: 'Edge浏览器缓存', safe: true },
      { name: '浏览器缓存 - Firefox', path: path.join(localAppData, 'Mozilla', 'Firefox', 'Profiles'), type: 'browser', description: 'Firefox浏览器缓存', safe: true },
      { name: '系统错误报告', path: 'C:\\ProgramData\\Microsoft\\Windows\\WER', type: 'error', description: 'Windows错误报告', safe: true },
      { name: '系统日志', path: 'C:\\Windows\\Logs', type: 'logs', description: 'Windows系统日志', safe: true },
      { name: 'Windows更新备份', path: 'C:\\Windows\\SoftwareDistribution', type: 'update', description: 'Windows更新相关文件', safe: false },
      { name: 'Windows升级日志', path: 'C:\\Windows\\Panther', type: 'logs', description: 'Windows安装和升级日志', safe: true },
      { name: 'Windows组件存储', path: 'C:\\Windows\\WinSxS\\Temp', type: 'temp', description: 'Windows组件存储临时文件', safe: true },
      { name: 'Windows诊断日志', path: path.join(programData, 'Microsoft', 'Diagnostics'), type: 'logs', description: 'Windows诊断日志', safe: true },
      { name: '下载文件夹临时文件', path: path.join(userProfile, 'Downloads'), type: 'temp', description: '下载文件夹（谨慎清理）', safe: false },
      { name: 'IE缓存', path: path.join(localAppData, 'Microsoft', 'Windows', 'INetCache'), type: 'browser', description: 'Internet Explorer缓存', safe: true },
      { name: 'IE历史记录', path: path.join(localAppData, 'Microsoft', 'Windows', 'History'), type: 'browser', description: 'Internet Explorer历史记录', safe: true },
      { name: 'IE Cookie', path: path.join(appData, 'Microsoft', 'Windows', 'Cookies'), type: 'browser', description: 'Internet Explorer Cookie', safe: true },
      { name: 'NVIDIA缓存', path: path.join(localAppData, 'NVIDIA', 'GLCache'), type: 'cache', description: 'NVIDIA显卡缓存', safe: true },
      { name: 'AMD缓存', path: path.join(localAppData, 'AMD', 'GLCache'), type: 'cache', description: 'AMD显卡缓存', safe: true },
      { name: 'DirectX缓存', path: path.join(localAppData, 'Microsoft', 'DirectX'), type: 'cache', description: 'DirectX缓存', safe: true },
      { name: 'CrashDumps', path: path.join(localAppData, 'CrashDumps'), type: 'logs', description: '应用程序崩溃转储', safe: true },
      { name: '程序数据缓存', path: path.join(programData, 'Microsoft', 'Windows', 'WER'), type: 'logs', description: '系统错误报告数据', safe: true },
    ];
    
    const winDir = 'C:\\Windows';
    if (fsSync.existsSync(winDir)) {
      const entries = fsSync.readdirSync(winDir);
      for (const entry of entries) {
        if (entry.startsWith('Windows.old')) {
          cleanupTasks.push({
            name: entry,
            path: path.join(winDir, entry),
            type: 'windows_old',
            description: '旧版Windows备份（可恢复旧系统）',
            safe: false
          });
        }
      }
    }
    
    const totalTasks = cleanupTasks.length;
    for (let i = 0; i < cleanupTasks.length; i++) {
      const task = cleanupTasks[i];
      scanState.scanProgress = 3 + (i / totalTasks) * 42;
      scanState.scanStatus = `正在扫描 ${task.name}...`;
      scanState.currentScanItem = task.path;
      await saveState();
      await addCleanupItem(task.name, task.path, task.type, task.description, task.safe);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    scanState.scanProgress = 45;
    scanState.scanStatus = '正在分析主要文件夹...';
    await saveState();
    
    const foldersToAnalyze = [
      { name: 'Windows', path: 'C:\\Windows' },
      { name: 'Program Files', path: 'C:\\Program Files' },
      { name: 'Program Files (x86)', path: 'C:\\Program Files (x86)' },
      { name: 'Users', path: 'C:\\Users' },
      { name: 'ProgramData', path: 'C:\\ProgramData' },
    ];
    
    const folders = [];
    const totalFolders = foldersToAnalyze.length;
    
    for (let i = 0; i < foldersToAnalyze.length; i++) {
      const folder = foldersToAnalyze[i];
      
      scanState.scanProgress = 45 + (i / totalFolders) * 30;
      scanState.scanStatus = `正在分析 ${folder.name}...`;
      scanState.currentScanItem = folder.path;
      await saveState();
      
      if (fsSync.existsSync(folder.path)) {
        const size = await getFolderSize(folder.path);
        folders.push({
          name: folder.name,
          path: folder.path,
          size: size,
          sizeGB: (size / 1024 / 1024 / 1024).toFixed(2),
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    folders.sort((a, b) => b.size - a.size);
    scanState.folders = folders;
    scanState.scanProgress = 75;
    scanState.scanStatus = '正在扫描大文件...';
    await saveState();
    
    const userPath = path.join('C:\\Users');
    const largeFiles = await scanLargeFiles(userPath, 100);
    
    scanState.largeFiles = largeFiles;
    scanState.scanProgress = 90;
    scanState.scanStatus = '正在扫描可迁移软件...';
    await saveState();
    
    const migratableSoftware = await softwareMigration.getMigratableSoftware();
    scanState.migratableSoftware = migratableSoftware;
    
    scanState.isScanning = false;
    scanState.scanProgress = 100;
    scanState.scanStatus = '分析完成';
    scanState.currentScanItem = '';
    await saveState();
    
    console.log('[CDriveScanWorker] 扫描完成');
    console.log('[CDriveScanWorker] 发现可清理项:', scanState.cleanupItems.length);
    console.log('[CDriveScanWorker] 发现大文件:', largeFiles.length);
    console.log('[CDriveScanWorker] 发现可迁移软件:', migratableSoftware.length);
    
  } catch (error) {
    console.error('[CDriveScanWorker] C 盘分析失败:', error);
    scanState.isScanning = false;
    scanState.scanStatus = '分析失败：' + error.message;
    await saveState();
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('[CDriveScanWorker] 工作进程错误:', error);
  scanState.isScanning = false;
  saveState().then(() => {
    process.exit(1);
  });
});
