const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const { setupTaskManagerIpc, runBackgroundTask, taskCache } = require('./taskManager');
const { setupJunkScannerIpc } = require('./junkScanner');
const { setupAdvancedTaskManagerIpc } = require('./advancedTaskManager');
const { setupDesktopWidgetIpc } = require('./desktopWidget');
const systemCleaner = require('./systemCleaner');
const systemOptimizer = require('./systemOptimizer');
const desktopOrganizer = require('./desktopOrganizer');
const cdriveScanner = require('./cdriveScanner');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // 最大化窗口以确保内容可见
  mainWindow.maximize();

  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // 先测试简单页面
    // mainWindow.loadFile(path.join(__dirname, '../test.html'));
    // 加载 React 开发服务器（Vite 默认端口 5173）
    mainWindow.loadURL('http://localhost:5173');
    // 默认不显示 DevTools，需要时手动打开（F12 或 Ctrl+Shift+I）
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupTaskManagerIpc();
  setupJunkScannerIpc();
  setupAdvancedTaskManagerIpc();
  setupDesktopWidgetIpc();
  cdriveScanner.setupCDriveScannerIpc();
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 硬件信息获取
ipcMain.handle('get-system-info', async () => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const gpuInfo = await getGPUInfo();
  console.log('[get-system-info] CPUs:', cpus.length, 'Total Memory:', (totalMemory / (1024 * 1024 * 1024)).toFixed(2), 'GB');
  return {
    platform: process.platform,
    arch: process.arch,
    cpus: cpus,
    totalMemory: totalMemory,
    freeMemory: os.freemem(),
    hostname: os.hostname(),
    release: os.release(),
    uptime: os.uptime(),
    gpu: gpuInfo
  };
});

// 获取 GPU 信息
async function getGPUInfo() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('wmic path win32_VideoController get name,AdapterRAM,DriverVersion,Status', { maxBuffer: 1024 * 1024 }, (error, stdout) => {
        if (error) {
          console.error('[getGPUInfo] Error:', error);
          resolve([]);
          return;
        }
        
        // 处理 WMIC 输出中的 \r 字符
        const cleanOutput = stdout.replace(/\r/g, '');
        const lines = cleanOutput.trim().split('\n');
        const gpus = [];
        
        // 第一行是标题，从第二行开始解析
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith('AdapterRAM')) continue;
          
          // 使用正则表达式匹配
          const match = line.match(/^(\d+)\s+([\d.]+)\s+(.+)\s+(OK|Error)$/);
          if (match) {
            const adapterRAM = parseInt(match[1]);
            const driverVersion = match[2];
            const name = match[3].trim();
            const status = match[4];
            
            gpus.push({
              name: name,
              adapterRAM: adapterRAM || 0,
              driverVersion: driverVersion || 'Unknown',
              status: status || 'OK'
            });
          }
        }
        
        console.log('[getGPUInfo] Found GPUs:', gpus);
        resolve(gpus);
      });
    } else {
      resolve([]);
    }
  });
}

// 获取 GPU 信息（独立接口）
ipcMain.handle('get-gpu-info', async () => {
  return getGPUInfo();
});

// 磁盘信息
ipcMain.handle('get-disk-info', async () => {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const lines = stdout.trim().split('\n').slice(1);
        const disks = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            name: parts[0],
            freeSpace: parseInt(parts[1]) || 0,
            size: parseInt(parts[2]) || 0
          };
        });
        resolve(disks);
      });
    } else {
      exec('df -h', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    }
  });
});

// 获取已安装的软件列表（Windows 注册表）
ipcMain.handle('get-installed-software', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve([]);
      return;
    }

    const softwareList = [];
    
    try {
      // 使用 reg 命令读取注册表（不需要编译）
      const readRegistryKey = (hive, key) => {
        return new Promise((resolve) => {
          exec(`reg query "${hive}\\${key}" /s /f "" /k`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
            if (error) {
              resolve([]);
              return;
            }
            
            const subKeys = [];
            const lines = stdout.split('\n');
            for (const line of lines) {
              if (line.startsWith(hive) && line.includes(key)) {
                subKeys.push(line.trim());
              }
            }
            resolve(subKeys);
          });
        });
      };
      
      const getSoftwareFromRegistry = async (hive, keyPath) => {
        return new Promise((resolve) => {
          // 使用 chcp 65001 切换到 UTF-8 编码，避免中文乱码
          exec(`chcp 65001 >nul 2>&1 && reg query "${hive}\\${keyPath}" /s`, { 
            maxBuffer: 1024 * 1024 * 10,
            encoding: 'buffer'
          }, (error, stdoutBuffer) => {
            if (error) {
              resolve([]);
              return;
            }
            
            // 尝试多种编码转换
            let stdout = '';
            try {
              // 首先尝试 UTF-8
              stdout = stdoutBuffer.toString('utf8');
              // 如果包含乱码字符，尝试 GBK
              if (stdout.includes('ï¿½') || /[\uFFFD]/.test(stdout)) {
                const iconv = require('iconv-lite');
                stdout = iconv.decode(stdoutBuffer, 'gbk');
              }
            } catch (e) {
              stdout = stdoutBuffer.toString('utf8');
            }
            
            const software = [];
            const lines = stdout.split('\n');
            let currentKey = '';
            let currentData = {};
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              
              // 检测新的子键
              if (line.startsWith('HKEY')) {
                if (currentKey && currentData.DisplayName) {
                  software.push({
                    name: currentData.DisplayName,
                    publisher: currentData.Publisher || 'Unknown',
                    version: currentData.DisplayVersion || 'Unknown',
                    uninstallString: currentData.UninstallString || '',
                    installDate: currentData.InstallDate || '',
                    registryPath: currentKey,
                    location: hive === 'HKLM' ? 'HKLM' : 'HKCU'
                  });
                }
                currentKey = line;
                currentData = {};
              } else if (currentKey) {
                // 解析键值
                const match = line.match(/(\w+)\s+REG_SZ\s+(.+)/);
                if (match) {
                  currentData[match[1]] = match[2].trim();
                }
              }
            }
            
            // 添加最后一个
            if (currentKey && currentData.DisplayName) {
              software.push({
                name: currentData.DisplayName,
                publisher: currentData.Publisher || 'Unknown',
                version: currentData.DisplayVersion || 'Unknown',
                uninstallString: currentData.UninstallString || '',
                installDate: currentData.InstallDate || '',
                registryPath: currentKey,
                location: hive === 'HKLM' ? 'HKLM' : 'HKCU'
              });
            }
            
            resolve(software);
          });
        });
      };
      
      // 并行读取 HKLM 和 HKCU
      Promise.all([
        getSoftwareFromRegistry('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'),
        getSoftwareFromRegistry('HKEY_CURRENT_USER', 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall')
      ]).then(([hklmSoftware, hkcuSoftware]) => {
        const allSoftware = [...hklmSoftware, ...hkcuSoftware];
        console.log('[Software] Total software found:', allSoftware.length);
        resolve(allSoftware);
      }).catch(error => {
        console.error('[Software] Error:', error);
        resolve([]);
      });
      
    } catch (error) {
      console.error('[Software] Error:', error);
      resolve([]);
    }
  });
});

// 卸载软件
ipcMain.handle('uninstall-software', async (event, software, forceUninstall = false) => {
  return new Promise(async (resolve) => {
    // 如果没有卸载字符串，直接强制卸载
    if (!software.uninstallString || forceUninstall) {
      console.log(`[Uninstall] 执行强制卸载: ${software.name}`);
      resolve(await forceUninstallSoftware(software));
      return;
    }

    let uninstallCommand = software.uninstallString;
    
    console.log(`[Uninstall] Original command: ${uninstallCommand}`);
    
    // 清理和格式化卸载命令
    if (uninstallCommand.includes('MsiExec.exe') || uninstallCommand.includes('{')) {
      // MSI 安装包
      if (!uninstallCommand.includes('/x') && !uninstallCommand.includes('/uninstall')) {
        uninstallCommand = `${uninstallCommand} /x`;
      }
      uninstallCommand = `${uninstallCommand} /quiet /norestart`;
    } else if (uninstallCommand.startsWith('"')) {
      // EXE 卸载程序
      const parts = uninstallCommand.split('"');
      if (parts.length >= 2) {
        uninstallCommand = `"${parts[1]}" /SILENT /SUPPRESSMSGBOXES /NORESTART`;
      }
    } else {
      uninstallCommand = `${uninstallCommand} /SILENT /SUPPRESSMSGBOXES /NORESTART`;
    }

    console.log(`[Uninstall] Executing: ${uninstallCommand}`);

    // 使用 cmd.exe 执行，以便更好地处理权限
    exec(`cmd.exe /c "${uninstallCommand}"`, { 
      timeout: 300000, // 5 分钟超时
      windowsHide: true
    }, async (error, stdout, stderr) => {
      if (error) {
        console.error(`[Uninstall] Error: ${error.message}`);
        console.error(`[Uninstall] stderr: ${stderr}`);
        // 正常卸载失败，自动执行强制卸载
        console.log(`[Uninstall] 正常卸载失败，执行强制卸载: ${software.name}`);
        resolve(await forceUninstallSoftware(software));
        return;
      }
      console.log(`[Uninstall] stdout: ${stdout}`);
      resolve({ success: true, message: '软件卸载成功' });
    });
  });
});

// 强制卸载软件
function forceUninstallSoftware(software) {
  return new Promise((resolve) => {
    let cleanedCount = 0;
    let errors = [];

    try {
      console.log(`[ForceUninstall] 开始强制卸载: ${software.name}`);
      
      // 1. 删除注册表项（使用保存的精确路径）
      if (software.registryPath) {
        try {
          console.log(`[ForceUninstall] 删除注册表: ${software.registryPath}`);
          execSync(`reg delete "${software.registryPath}" /f 2>nul`, { stdio: 'ignore' });
          cleanedCount++;
          console.log(`[ForceUninstall] 已删除注册表: ${software.registryPath}`);
        } catch (error) {
          errors.push(`删除注册表失败: ${error.message}`);
        }
      }
      
      // 2. 尝试从卸载字符串中提取安装路径
      let installPaths = [];
      if (software.uninstallString) {
        const pathMatch = software.uninstallString.match(/"([^"]+)"/);
        if (pathMatch) {
          const uninstallerPath = pathMatch[1];
          const dir = path.dirname(uninstallerPath);
          if (dir && dir !== '.' && dir !== '..') {
            installPaths.push(dir);
          }
        }
      }
      
      // 3. 尝试常见的安装目录
      const commonPaths = [
        path.join('C:\\Program Files', software.name),
        path.join('C:\\Program Files (x86)', software.name),
        path.join(process.env.LOCALAPPDATA || 'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local', software.name),
        path.join(process.env.APPDATA || 'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Roaming', software.name),
      ];
      
      installPaths = [...new Set([...installPaths, ...commonPaths])];
      
      // 4. 删除找到的安装目录
      for (const installPath of installPaths) {
        if (installPath && fs.existsSync(installPath)) {
          try {
            fs.rmSync(installPath, { recursive: true, force: true });
            cleanedCount++;
            console.log(`[ForceUninstall] 已删除目录: ${installPath}`);
          } catch (error) {
            errors.push(`删除程序目录失败: ${error.message}`);
          }
        }
      }

      // 5. 删除开始菜单项
      const startMenuPaths = [
        path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
        path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
      ];

      for (const startMenuPath of startMenuPaths) {
        if (fs.existsSync(startMenuPath)) {
          try {
            const entries = fs.readdirSync(startMenuPath);
            for (const entry of entries) {
              const fullPath = path.join(startMenuPath, entry);
              if (entry.toLowerCase().includes(software.name.toLowerCase())) {
                try {
                  if (fs.statSync(fullPath).isDirectory()) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                  } else {
                    fs.unlinkSync(fullPath);
                  }
                  cleanedCount++;
                  console.log(`[ForceUninstall] 已删除开始菜单: ${fullPath}`);
                } catch (error) {
                }
              }
            }
          } catch (error) {
          }
        }
      }

      // 6. 删除桌面快捷方式
      const desktopPaths = [
        path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop'),
        path.join(process.env.USERPROFILE || '', 'Desktop'),
      ];

      for (const desktopPath of desktopPaths) {
        if (fs.existsSync(desktopPath)) {
          try {
            const entries = fs.readdirSync(desktopPath);
            for (const entry of entries) {
              const fullPath = path.join(desktopPath, entry);
              if (entry.toLowerCase().includes(software.name.toLowerCase()) && entry.endsWith('.lnk')) {
                try {
                  fs.unlinkSync(fullPath);
                  cleanedCount++;
                  console.log(`[ForceUninstall] 已删除桌面快捷方式: ${fullPath}`);
                } catch (error) {
                }
              }
            }
          } catch (error) {
          }
        }
      }

      resolve({ 
        success: true, 
        message: `强制卸载完成！已清理 ${cleanedCount} 项。\n注意：某些文件可能需要重启后才能完全删除。`,
        warnings: errors
      });

    } catch (error) {
      console.error('[ForceUninstall] Error:', error);
      resolve({ 
        success: false, 
        error: `强制卸载过程中发生错误：${error.message}` 
      });
    }
  });
}

// 获取温度信息
ipcMain.handle('get-temperature', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ cpu: 0, gpu: 0, available: false, error: '不支持的平台' });
      return;
    }

    // 使用 WMIC 获取 CPU 温度（需要管理员权限）
    exec('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature', (error, stdout, stderr) => {
      if (error || stderr) {
        console.error('[get-temperature] WMIC error:', error?.message || stderr);
        resolve({ 
          cpu: 0, 
          gpu: 0, 
          available: false,
          error: '需要管理员权限才能读取温度数据'
        });
        return;
      }

      let cpuTemp = 0;
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      // 解析 WMIC 输出
      for (let i = 1; i < lines.length; i++) {
        const temp = lines[i].trim();
        if (temp && !isNaN(parseInt(temp))) {
          // WMIC 返回的是开尔文温度 * 10
          const kelvin = parseInt(temp) / 10;
          const celsius = kelvin - 273.15;
          if (celsius > 0 && celsius < 150) { // 合理的温度范围
            cpuTemp = Math.round(celsius * 10) / 10;
            break;
          }
        }
      }

      console.log('[get-temperature] CPU Temperature:', cpuTemp);
      resolve({ 
        cpu: cpuTemp, 
        gpu: 0, // GPU 温度需要 Open Hardware Monitor 支持
        available: cpuTemp > 0,
        error: cpuTemp === 0 ? '未检测到温度传感器或需要管理员权限' : null
      });
    });
  });
});

// 性能测试
ipcMain.handle('run-benchmark', async () => {
  return new Promise((resolve) => {
    const cpuCount = os.cpus().length;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    // 简化的性能评分
    const cpuScore = Math.round(cpuCount * 1000 + (os.cpus()[0].speed * 100));
    const memoryScore = Math.round((totalMemory / (1024 * 1024 * 1024)) * 500);
    const totalScore = cpuScore + memoryScore;

    setTimeout(() => {
      resolve({
        cpu: cpuScore,
        memory: memoryScore,
        total: totalScore,
        timestamp: Date.now()
      });
    }, 3000); // 模拟 3 秒测试时间
  });
});

// 扫描系统垃圾
ipcMain.handle('scan-system', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ success: true, items: [], totalSize: 0 });
      return;
    }

    const scanItems = [];
    let totalSize = 0;

    // 获取所有磁盘
    exec('wmic logicaldisk get caption', (error, stdout) => {
      if (error) {
        resolve({ success: false, error: error.message, items: [], totalSize: 0 });
        return;
      }
      
      const lines = stdout.trim().split('\n').slice(1);
      const drives = lines.map(line => line.trim()).filter(d => d);
      
      // 扫描每个磁盘
      drives.forEach(drive => {
        const paths = [
          { path: `${drive}:\\$Recycle.Bin`, name: '回收站', type: 'recycle' },
          { path: `${drive}:\\Windows\\Temp`, name: '系统临时文件', type: 'system_temp' },
        ];

        paths.forEach(item => {
          exec(`dir "${item.path}" /s`, { maxBuffer: 1024 * 1024 }, (error, stdout) => {
            if (!error) {
              // 解析目录大小
              const sizeMatch = stdout.match(/(\d+)\s+个文件/);
              const fileCount = sizeMatch ? parseInt(sizeMatch[1]) : 0;
              
              const sizeBytesMatch = stdout.match(/(\d+)\s+字节/);
              const sizeBytes = sizeBytesMatch ? parseInt(sizeBytesMatch[1]) : 0;
              
              if (fileCount > 0 || sizeBytes > 0) {
                scanItems.push({
                  drive: drive,
                  path: item.path,
                  name: item.name,
                  type: item.type,
                  fileCount: fileCount,
                  sizeBytes: sizeBytes,
                  sizeMB: (sizeBytes / (1024 * 1024)).toFixed(2),
                  selected: true // 默认选中
                });
              }
            }
            
            // 当所有路径扫描完成后返回结果
            if (scanItems.length >= drives.length * paths.length) {
              totalSize = scanItems.reduce((sum, item) => sum + item.sizeBytes, 0);
              resolve({ 
                success: true, 
                items: scanItems,
                totalSize: totalSize,
                totalMB: (totalSize / (1024 * 1024)).toFixed(2),
                message: `扫描完成，发现 ${scanItems.length} 项可清理内容`
              });
            }
          });
        });
      });
    });
  });
});

// 执行清理
ipcMain.handle('clean-system', async (event, selectedItems) => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ success: true, cleaned: false, drives: [] });
      return;
    }

    const driveResults = [];
    
    if (!selectedItems || selectedItems.length === 0) {
      resolve({ success: true, message: '未选择要清理的项目', drives: [] });
      return;
    }

    // 按磁盘分组
    const itemsByDrive = {};
    selectedItems.forEach(item => {
      if (!itemsByDrive[item.drive]) {
        itemsByDrive[item.drive] = [];
      }
      itemsByDrive[item.drive].push(item);
    });

    // 清理每个磁盘的选中项目
    const cleanPromises = Object.keys(itemsByDrive).map(drive => {
      return new Promise((resolveDrive) => {
        const items = itemsByDrive[drive];
        let completed = 0;
        
        items.forEach(item => {
          exec(`del /s /q "${item.path}\\*" 2>nul`, { maxBuffer: 1024 * 1024 }, (error) => {
            completed++;
            if (completed === items.length) {
              resolveDrive({
                drive: drive,
                success: true,
                message: `清理完成`,
                itemsCleaned: items.length
              });
            }
          });
        });
      });
    });
    
    Promise.all(cleanPromises).then(results => {
      resolve({ 
        success: true, 
        cleaned: true,
        drives: results,
        message: `已清理 ${results.length} 个磁盘`
      });
    });
  });
});

// 获取 CPU 和内存使用率
ipcMain.handle('get-system-usage', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ cpu: 0, memory: 0, freeMemory: 0, totalMemory: 0 });
      return;
    }

    // 获取 CPU 使用率
    exec('wmic cpu get loadpercentage', (error, stdout) => {
      let cpuUsage = 0;
      if (!error && stdout) {
        const match = stdout.match(/(\d+)/);
        if (match) {
          cpuUsage = parseInt(match[1]);
        }
      }

      // 获取内存使用率
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

      resolve({
        cpu: cpuUsage,
        memory: memoryUsage,
        freeMemory: freeMemory,
        totalMemory: totalMemory
      });
    });
  });
});

// 获取进程列表
ipcMain.handle('get-process-list', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve([]);
      return;
    }

    exec('wmic process get name,processid,parentprocessid,workingsetsize,kernelmodetime,usermodetime /format:csv', (error, stdout) => {
      const processes = [];
      if (!error && stdout) {
        const lines = stdout.trim().split('\n').slice(1);
        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 7 && parts[1]) {
            processes.push({
              name: parts[1] || 'Unknown',
              pid: parseInt(parts[2]) || 0,
              ppid: parseInt(parts[3]) || 0,
              memory: parseInt(parts[4]) || 0,
              kernelTime: parseInt(parts[5]) || 0,
              userTime: parseInt(parts[6]) || 0,
            });
          }
        }
      }
      resolve(processes);
    });
  });
});

// ==================== 系统清理功能 ====================

// 扫描系统垃圾（带进度）
ipcMain.handle('scan-junk', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
    // 发送开始扫描事件
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'start',
        message: '开始扫描系统垃圾...',
        progress: 0,
      });
    }

    const [tempItems, browserItems, appItems] = await Promise.all([
      systemCleaner.scanSystemTemp(),
      systemCleaner.scanBrowserCache(),
      systemCleaner.scanAppCache(),
    ]);

    // 发送进度更新
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'scanning',
        message: '正在扫描浏览器缓存...',
        progress: 33,
        category: 'browser',
      });
    }

    const items = [...tempItems, ...browserItems, ...appItems];
    const totalSize = items.reduce((sum, item) => sum + parseFloat(item.sizeMB), 0);

    // 发送完成事件
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'complete',
        message: `扫描完成！发现 ${items.length} 项垃圾，共 ${totalSize.toFixed(2)} MB`,
        progress: 100,
        itemsCount: items.length,
        totalSize: totalSize.toFixed(2),
      });
    }

    return {
      success: true,
      items,
      totalSize: totalSize.toFixed(2),
    };
  } catch (error) {
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'error',
        message: `扫描失败：${error.message}`,
        progress: 0,
      });
    }
    
    return {
      success: false,
      error: error.message,
      items: [],
      totalSize: 0,
    };
  }
});

// 扫描大文件（带进度）
ipcMain.handle('scan-large-files', async (event, drive = 'C:') => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'start',
        message: `开始扫描 ${drive} 盘大文件...`,
        progress: 0,
      });
    }

    const files = await systemCleaner.scanLargeFiles(drive);
    const totalSize = files.reduce((sum, file) => sum + parseFloat(file.sizeMB), 0);

    if (win) {
      win.webContents.send('scan-progress', {
        type: 'complete',
        message: `发现 ${files.length} 个大文件，共 ${totalSize.toFixed(2)} MB`,
        progress: 100,
        filesCount: files.length,
        totalSize: totalSize.toFixed(2),
      });
    }

    return {
      success: true,
      files,
      totalSize: totalSize.toFixed(2),
    };
  } catch (error) {
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'error',
        message: `扫描失败：${error.message}`,
        progress: 0,
      });
    }
    
    return {
      success: false,
      error: error.message,
      files: [],
      totalSize: 0,
    };
  }
});

// 扫描注册表（带进度）
ipcMain.handle('scan-registry', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'start',
        message: '开始扫描注册表冗余...',
        progress: 0,
      });
    }

    const items = await systemCleaner.scanRegistry();
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);

    if (win) {
      win.webContents.send('scan-progress', {
        type: 'complete',
        message: `发现 ${items.length} 项注册表冗余`,
        progress: 100,
        itemsCount: items.length,
        totalSize: (totalSize / 1024).toFixed(2),
      });
    }

    return {
      success: true,
      items,
      totalSize: (totalSize / 1024).toFixed(2),
    };
  } catch (error) {
    if (win) {
      win.webContents.send('scan-progress', {
        type: 'error',
        message: `扫描失败：${error.message}`,
        progress: 0,
      });
    }
    
    return {
      success: false,
      error: error.message,
      items: [],
      totalSize: 0,
    };
  }
});

// 清理文件（带进度）
ipcMain.handle('clean-files', async (event, filePaths) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
    const totalFiles = filePaths.length;
    let cleanedCount = 0;
    const results = {
      success: 0,
      failed: 0,
      totalSize: 0,
      errors: [],
    };

    if (win) {
      win.webContents.send('clean-progress', {
        type: 'start',
        message: `开始清理 ${totalFiles} 个文件...`,
        progress: 0,
      });
    }

    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          
          results.success++;
          results.totalSize += stats.size;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          path: filePath,
          error: error.message,
        });
      }
      
      cleanedCount++;
      
      // 发送进度更新
      if (win) {
        const progress = Math.round((cleanedCount / totalFiles) * 100);
        win.webContents.send('clean-progress', {
          type: 'cleaning',
          message: `正在清理：${path.basename(filePath)}`,
          progress: progress,
          cleanedCount: results.success,
          failedCount: results.failed,
          totalFiles: totalFiles,
        });
      }
    }

    // 发送完成事件
    if (win) {
      win.webContents.send('clean-progress', {
        type: 'complete',
        message: `清理完成！已清理 ${results.success} 个文件，释放 ${(results.totalSize / 1024 / 1024).toFixed(2)} MB 空间`,
        progress: 100,
        cleanedSize: (results.totalSize / 1024 / 1024).toFixed(2),
        successCount: results.success,
        failedCount: results.failed,
      });
    }

    return {
      success: results.success > 0,
      cleanedSize: (results.totalSize / 1024 / 1024).toFixed(2),
      successCount: results.success,
      failedCount: results.failed,
      errors: results.errors,
    };
  } catch (error) {
    if (win) {
      win.webContents.send('clean-progress', {
        type: 'error',
        message: `清理失败：${error.message}`,
        progress: 0,
      });
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
});

// ==================== 系统优化功能 ====================

// 获取启动项
ipcMain.handle('get-startup-items', async () => {
  try {
    const items = await systemOptimizer.getStartupItems();
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message, items: [] };
  }
});

// 切换启动项状态
ipcMain.handle('toggle-startup-item', async (event, item, enable) => {
  try {
    const result = await systemOptimizer.toggleStartupItem(item, enable);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 获取系统服务
ipcMain.handle('get-system-services', async () => {
  try {
    const services = await systemOptimizer.getSystemServices();
    return { success: true, services };
  } catch (error) {
    return { success: false, error: error.message, services: [] };
  }
});

// 优化服务
ipcMain.handle('optimize-service', async (event, serviceName, mode) => {
  try {
    const result = await systemOptimizer.optimizeService(serviceName, mode);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 释放内存
ipcMain.handle('release-memory', async () => {
  try {
    const result = await systemOptimizer.releaseMemory();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 切换游戏模式
ipcMain.handle('toggle-game-mode', async (event, enable) => {
  try {
    const result = await systemOptimizer.toggleGameMode(enable);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 获取游戏模式状态
ipcMain.handle('get-game-mode-status', async () => {
  try {
    const enabled = await systemOptimizer.getGameModeStatus();
    return { success: true, enabled };
  } catch (error) {
    return { success: false, error: error.message, enabled: false };
  }
});

// 分析 C 盘
ipcMain.handle('analyze-c-drive', async () => {
  try {
    const result = await systemOptimizer.analyzeCDrive();
    return {
      success: true,
      totalSpace: (result.totalSpace / 1024 / 1024 / 1024).toFixed(2),
      usedSpace: (result.usedSpace / 1024 / 1024 / 1024).toFixed(2),
      freeSpace: (result.freeSpace / 1024 / 1024 / 1024).toFixed(2),
      folders: result.folders,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 迁移大文件
ipcMain.handle('move-large-files', async (event, files, targetDrive) => {
  try {
    const result = await systemOptimizer.moveLargeFiles(files, targetDrive);
    return {
      success: result.success > 0,
      movedSize: (result.totalSize / 1024 / 1024).toFixed(2),
      successCount: result.success,
      failedCount: result.failed,
      errors: result.errors,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== 桌面整理功能 ====================

// 整理桌面
ipcMain.handle('organize-desktop', async () => {
  try {
    const result = await desktopOrganizer.organizeDesktop();
    return {
      success: result.success > 0,
      organizedCount: result.success,
      failedCount: result.failed,
      organized: result.organized,
      errors: result.errors,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 快速归类（预览）
ipcMain.handle('quick-organize-desktop', async () => {
  try {
    const result = await desktopOrganizer.quickOrganizeDesktop();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 清理失效快捷方式
ipcMain.handle('clean-broken-shortcuts', async () => {
  try {
    const result = await desktopOrganizer.cleanBrokenShortcuts();
    return {
      success: true,
      cleanedCount: result.success,
      cleaned: result.cleaned,
      errors: result.errors,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 启动自动整理
ipcMain.handle('start-auto-organize', async () => {
  try {
    const organizer = new desktopOrganizer.DesktopOrganizer();
    const result = organizer.start();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 停止自动整理
ipcMain.handle('stop-auto-organize', async () => {
  try {
    const organizer = new desktopOrganizer.DesktopOrganizer();
    const result = organizer.stop();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 获取进程列表已经在 591 行定义过了

// 终止进程
ipcMain.handle('kill-process', async (event, pid) => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ success: false, error: '仅支持 Windows 系统' });
      return;
    }

    exec(`taskkill /PID ${pid} /F`, (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
        return;
      }
      resolve({ success: true, message: `进程 ${pid} 已终止` });
    });
  });
});
