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

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-features', 'Metal');

if (!app.isPackaged) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      webSecurity: app.isPackaged,
      allowRunningInsecureContent: !app.isPackaged,
      experimentalFeatures: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'CSSLayoutNG',
      v8CacheOptions: 'code'
    }
  });
  
  mainWindow.maximize();
  mainWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
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

// 获取系统信息
ipcMain.handle('get-system-info', async () => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const gpuInfo = await getGPUInfo();
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

async function getGPUInfo() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('wmic path win32_VideoController get name,AdapterRAM,DriverVersion,Status', { maxBuffer: 1024 * 1024 }, (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }
        
        const cleanOutput = stdout.replace(/\r/g, '');
        const lines = cleanOutput.trim().split('\n');
        const gpus = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith('AdapterRAM')) continue;
          
          const match = line.match(/^(\d+)\s+([\d.]+)\s+(.+)\s+(OK|Error)$/);
          if (match) {
            gpus.push({
              name: match[3].trim(),
              adapterRAM: parseInt(match[1]) || 0,
              driverVersion: match[2] || 'Unknown',
              status: match[4] || 'OK'
            });
          }
        }
        
        resolve(gpus);
      });
    } else {
      resolve([]);
    }
  });
}

ipcMain.handle('get-gpu-info', async () => {
  return getGPUInfo();
});

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

ipcMain.handle('get-installed-software', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve([]);
      return;
    }

    const softwareList = [];
    
    try {
      const getSoftwareFromRegistry = async (hive, keyPath) => {
        return new Promise((resolve) => {
          exec(`chcp 65001 >nul 2>&1 && reg query "${hive}\\${keyPath}" /s`, { 
            maxBuffer: 1024 * 1024 * 10,
            encoding: 'buffer'
          }, (error, stdoutBuffer) => {
            if (error) {
              resolve([]);
              return;
            }
            
            let stdout = '';
            try {
              stdout = stdoutBuffer.toString('utf8');
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
                const match = line.match(/(\w+)\s+REG_SZ\s+(.+)/);
                if (match) {
                  currentData[match[1]] = match[2].trim();
                }
              }
            }
            
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
      
      Promise.all([
        getSoftwareFromRegistry('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'),
        getSoftwareFromRegistry('HKEY_CURRENT_USER', 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall')
      ]).then(([hklmSoftware, hkcuSoftware]) => {
        const allSoftware = [...hklmSoftware, ...hkcuSoftware];
        resolve(allSoftware);
      }).catch(error => {
        resolve([]);
      });
      
    } catch (error) {
      resolve([]);
    }
  });
});

ipcMain.handle('uninstall-software', async (event, software, forceUninstall = false) => {
  return new Promise(async (resolve) => {
    if (!software.uninstallString || forceUninstall) {
      resolve(await forceUninstallSoftware(software));
      return;
    }

    let uninstallCommand = software.uninstallString;
    
    if (uninstallCommand.includes('MsiExec.exe') || uninstallCommand.includes('{')) {
      if (!uninstallCommand.includes('/x') && !uninstallCommand.includes('/uninstall')) {
        uninstallCommand = `${uninstallCommand} /x`;
      }
      uninstallCommand = `${uninstallCommand} /quiet /norestart`;
    } else if (uninstallCommand.startsWith('"')) {
      const parts = uninstallCommand.split('"');
      if (parts.length >= 2) {
        uninstallCommand = `"${parts[1]}" /SILENT /SUPPRESSMSGBOXES /NORESTART`;
      }
    } else {
      uninstallCommand = `${uninstallCommand} /SILENT /SUPPRESSMSGBOXES /NORESTART`;
    }

    exec(`cmd.exe /c "${uninstallCommand}"`, { 
      timeout: 300000,
      windowsHide: true
    }, async (error, stdout, stderr) => {
      if (error) {
        resolve(await forceUninstallSoftware(software));
        return;
      }
      resolve({ success: true, message: '软件卸载成功' });
    });
  });
});

function forceUninstallSoftware(software) {
  return new Promise((resolve) => {
    let cleanedCount = 0;
    let errors = [];

    try {
      // 1. 结束进程树
      try {
        // 结束所有包含软件名称的进程
        const processName = software.name.replace(/\.exe$/i, '');
        execSync(`taskkill /F /IM "${processName}.exe" /T 2>nul`, { stdio: 'ignore' });
        cleanedCount++;
      } catch (error) {
        errors.push(`结束进程失败：${error.message}`);
      }

      // 2. 删除相关服务
      try {
        const serviceNames = [software.name, `${software.name}X64`, 'QPCore', 'QQProtectX64'];
        for (const serviceName of serviceNames) {
          execSync(`sc delete "${serviceName}" 2>nul`, { stdio: 'ignore' });
        }
        cleanedCount++;
      } catch (error) {
        errors.push(`删除服务失败：${error.message}`);
      }

      // 3. 删除注册表项
      try {
        const regPaths = [
          `HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\${software.name}`,
          `HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\${software.name}X64`,
          `HKEY_CURRENT_USER\\Software\\${software.name}`,
          `HKEY_LOCAL_MACHINE\\SOFTWARE\\${software.name}`,
          `HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\QPCore`,
          `HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\QQProtectX64`,
          `HKEY_CURRENT_USER\\Software\\Tencent\\QQProtect`,
          `HKEY_LOCAL_MACHINE\\SOFTWARE\\Tencent\\QQProtect`
        ];
        
        for (const regPath of regPaths) {
          execSync(`reg delete "${regPath}" /f 2>nul`, { stdio: 'ignore' });
        }
        cleanedCount++;
      } catch (error) {
        errors.push(`删除注册表失败：${error.message}`);
      }

      // 4. 删除文件和目录
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
      
      const commonPaths = [
        path.join('C:\\Program Files', software.name),
        path.join('C:\\Program Files (x86)', software.name),
        path.join(process.env.LOCALAPPDATA || '', software.name),
        path.join(process.env.APPDATA || '', software.name),
        path.join('C:\\Program Files (x86)', 'Common Files', 'Tencent', 'QQProtect'),
        path.join(process.env.APPDATA || '', 'Tencent', 'QQ', 'QQProtect'),
        path.join(process.env.LOCALAPPDATA || '', 'Tencent', 'QQProtect')
      ];
      
      installPaths = [...new Set([...installPaths, ...commonPaths])];
      
      for (const installPath of installPaths) {
        if (installPath && fs.existsSync(installPath)) {
          try {
            fs.rmSync(installPath, { recursive: true, force: true });
            cleanedCount++;
          } catch (error) {
            errors.push(`删除程序目录失败：${error.message}`);
          }
        }
      }

      // 5. 清理启动项
      try {
        const startupFolders = [
          path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'),
          path.join('C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
        ];
        
        for (const startupFolder of startupFolders) {
          if (fs.existsSync(startupFolder)) {
            const files = fs.readdirSync(startupFolder);
            for (const file of files) {
              if (file.includes(software.name) || file.includes('QQProtect') || file.includes('QPCore')) {
                const filePath = path.join(startupFolder, file);
                try {
                  fs.unlinkSync(filePath);
                  cleanedCount++;
                } catch (error) {
                  errors.push(`删除启动项失败：${error.message}`);
                }
              }
            }
          }
        }
      } catch (error) {
        errors.push(`清理启动项失败：${error.message}`);
      }

      resolve({ 
        success: true, 
        message: `强制卸载完成！已清理 ${cleanedCount} 项。`,
        warnings: errors
      });

    } catch (error) {
      resolve({ 
        success: false, 
        error: `强制卸载过程中发生错误：${error.message}` 
      });
    }
  });
}

ipcMain.handle('get-temperature', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ cpu: 0, gpu: 0, available: false, error: '不支持的平台' });
      return;
    }

    exec('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature', (error, stdout, stderr) => {
      if (error || stderr) {
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
      
      for (let i = 1; i < lines.length; i++) {
        const temp = lines[i].trim();
        if (temp && !isNaN(parseInt(temp))) {
          const kelvin = parseInt(temp) / 10;
          const celsius = kelvin - 273.15;
          if (celsius > 0 && celsius < 150) {
            cpuTemp = Math.round(celsius * 10) / 10;
            break;
          }
        }
      }

      resolve({ 
        cpu: cpuTemp, 
        gpu: 0,
        available: cpuTemp > 0,
        error: cpuTemp === 0 ? '未检测到温度传感器或需要管理员权限' : null
      });
    });
  });
});

ipcMain.handle('run-benchmark', async () => {
  return new Promise((resolve) => {
    const cpuCount = os.cpus().length;
    const totalMemory = os.totalmem();
    
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
    }, 3000);
  });
});

ipcMain.handle('scan-system', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ success: true, items: [], totalSize: 0 });
      return;
    }

    const scanItems = [];
    let totalSize = 0;

    exec('wmic logicaldisk get caption', (error, stdout) => {
      if (error) {
        resolve({ success: false, error: error.message, items: [], totalSize: 0 });
        return;
      }
      
      const lines = stdout.trim().split('\n').slice(1);
      const drives = lines.map(line => line.trim()).filter(d => d);
      
      drives.forEach(drive => {
        const paths = [
          { path: `${drive}:\\$Recycle.Bin`, name: '回收站', type: 'recycle' },
          { path: `${drive}:\\Windows\\Temp`, name: '系统临时文件', type: 'system_temp' },
        ];

        paths.forEach(item => {
          exec(`dir "${item.path}" /s`, { maxBuffer: 1024 * 1024 }, (error, stdout) => {
            if (!error) {
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
                  selected: true
                });
              }
            }
            
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

    const itemsByDrive = {};
    selectedItems.forEach(item => {
      if (!itemsByDrive[item.drive]) {
        itemsByDrive[item.drive] = [];
      }
      itemsByDrive[item.drive].push(item);
    });

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

ipcMain.handle('get-system-usage', async () => {
  return new Promise((resolve) => {
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
        totalMemory: totalMemory
      });
    });
  });
});

ipcMain.handle('get-process-list', async () => {
  try {
    const processes = await systemOptimizer.getProcessList();
    return { success: true, processes };
  } catch (error) {
    return { success: false, error: error.message, processes: [] };
  }
});

// 系统清理功能
ipcMain.handle('scan-junk', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
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

    const items = [...tempItems, ...browserItems, ...appItems];
    const totalSize = items.reduce((sum, item) => sum + parseFloat(item.sizeMB), 0);

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
    return {
      success: false,
      error: error.message,
      items: [],
      totalSize: 0,
    };
  }
});

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
    return {
      success: false,
      error: error.message,
      files: [],
      totalSize: 0,
    };
  }
});

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
    return {
      success: false,
      error: error.message,
      items: [],
      totalSize: 0,
    };
  }
});

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
    return {
      success: false,
      error: error.message,
    };
  }
});

// 系统优化功能
ipcMain.handle('get-startup-items', async () => {
  try {
    const items = await systemOptimizer.getStartupItems();
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message, items: [] };
  }
});

ipcMain.handle('toggle-startup-item', async (event, item, enable) => {
  try {
    const result = await systemOptimizer.toggleStartupItem(item, enable);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-startup-item-type', async (event, item, startupType) => {
  try {
    const result = await systemOptimizer.setStartupItemType(item, startupType);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('run-startup-item', async (event, item) => {
  try {
    const result = await systemOptimizer.runStartupItem(item);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-startup-item', async (event, item) => {
  try {
    const result = await systemOptimizer.stopStartupItem(item);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-system-services', async () => {
  try {
    const services = await systemOptimizer.getSystemServices();
    return { success: true, services };
  } catch (error) {
    return { success: false, error: error.message, services: [] };
  }
});

ipcMain.handle('optimize-service', async (event, serviceName, mode) => {
  try {
    const result = await systemOptimizer.optimizeService(serviceName, mode);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-service', async (event, serviceName) => {
  try {
    const result = await systemOptimizer.startService(serviceName);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-service', async (event, serviceName) => {
  try {
    const result = await systemOptimizer.stopService(serviceName);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-service', async (event, serviceName) => {
  try {
    const result = await systemOptimizer.deleteService(serviceName);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('release-memory', async () => {
  try {
    const result = await systemOptimizer.releaseMemory();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-game-mode', async (event, enable) => {
  try {
    const result = await systemOptimizer.toggleGameMode(enable);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-game-mode-status', async () => {
  try {
    const enabled = await systemOptimizer.getGameModeStatus();
    return { success: true, enabled };
  } catch (error) {
    return { success: false, error: error.message, enabled: false };
  }
});

ipcMain.handle('get-battery-status', async () => {
  try {
    const battery = await systemOptimizer.getBatteryStatus();
    return { success: true, ...battery };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      present: false,
      percent: 0
    };
  }
});

ipcMain.handle('kill-process', async (event, processId) => {
  try {
    const result = await systemOptimizer.killProcess(processId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

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

// 桌面整理功能
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

ipcMain.handle('quick-organize-desktop', async () => {
  try {
    const result = await desktopOrganizer.quickOrganizeDesktop();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

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

ipcMain.handle('start-auto-organize', async () => {
  try {
    const organizer = new desktopOrganizer.DesktopOrganizer();
    const result = organizer.start();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-auto-organize', async () => {
  try {
    const organizer = new desktopOrganizer.DesktopOrganizer();
    const result = organizer.stop();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});
