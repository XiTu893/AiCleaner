const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 系统临时文件夹路径
const TEMP_PATHS = {
  system: path.join(process.env.WINDIR || 'C:\\Windows', 'Temp'),
  user: process.env.TEMP || path.join(process.env.USERPROFILE || 'C:\\Users', 'AppData', 'Local', 'Temp'),
  prefetch: path.join(process.env.WINDIR || 'C:\\Windows', 'Prefetch'),
};

// 浏览器缓存路径
const BROWSER_CACHE_PATHS = [
  {
    name: 'Chrome',
    path: path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
  },
  {
    name: 'Edge',
    path: path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
  },
  {
    name: 'Firefox',
    path: path.join(process.env.APPDATA || '', 'Mozilla', 'Firefox', 'Profiles'),
  },
];

// 常见应用缓存
const APP_CACHE_PATHS = [
  {
    name: '微信缓存',
    path: path.join(process.env.USERPROFILE || '', 'Documents', 'WeChat Files'),
  },
  {
    name: 'QQ 缓存',
    path: path.join(process.env.USERPROFILE || '', 'Documents', 'Tencent Files'),
  },
  {
    name: '迅雷缓存',
    path: path.join(process.env.USERPROFILE || '', 'Downloads', 'ThunderDownload'),
  },
  {
    name: 'Steam 缓存',
    path: path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Steam', 'steamapps', 'downloading'),
  },
  {
    name: 'Discord 缓存',
    path: path.join(process.env.APPDATA || '', 'discord', 'Cache'),
  },
  {
    name: 'Spotify 缓存',
    path: path.join(process.env.LOCALAPPDATA || '', 'Spotify', 'Storage'),
  },
  {
    name: 'VSCode 缓存',
    path: path.join(process.env.APPDATA || '', 'Code', 'CachedData'),
  },
  {
    name: 'Postman 缓存',
    path: path.join(process.env.APPDATA || '', 'Postman', 'Cache'),
  },
  {
    name: 'Telegram 缓存',
    path: path.join(process.env.USERPROFILE || '', 'Documents', 'Telegram Desktop'),
  },
  {
    name: 'Skype 缓存',
    path: path.join(process.env.APPDATA || '', 'Skype', 'My Skype Received Files'),
  },
  {
    name: 'Zoom 缓存',
    path: path.join(process.env.APPDATA || '', 'Zoom', 'data'),
  },
  {
    name: 'Adobe 缓存',
    path: path.join(process.env.COMMONPROGRAMFILES || 'C:\\Program Files\\Common Files', 'Adobe', 'Adobe PCD', 'cache'),
  },
  {
    name: 'Google 更新缓存',
    path: path.join(process.env.LOCALAPPDATA || '', 'Google', 'Update', 'Download'),
  },
  {
    name: 'Windows 更新缓存',
    path: path.join(process.env.WINDIR || 'C:\\Windows', 'SoftwareDistribution', 'Download'),
  },
  {
    name: 'Windows 预读文件',
    path: path.join(process.env.WINDIR || 'C:\\Windows', 'Prefetch'),
  },
];

// 扫描已卸载应用的残留缓存
async function scanUninstalledAppCache(progressCallback = null) {
  const items = [];
  
  try {
    const appDataLocal = process.env.LOCALAPPDATA || '';
    const appDataRoaming = process.env.APPDATA || '';
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    
    const cacheFolders = [
      { base: appDataLocal, name: 'Local AppData' },
      { base: appDataRoaming, name: 'Roaming AppData' },
      { base: programData, name: 'ProgramData' },
    ];
    
    for (const folder of cacheFolders) {
      if (!fs.existsSync(folder.base)) continue;
      
      const entries = fs.readdirSync(folder.base, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const fullPath = path.join(folder.base, entry.name);
        
        try {
          if (progressCallback) progressCallback(fullPath);
          
          const cacheResult = await getFolderSize(fullPath, progressCallback);
          
          if (cacheResult.size > 0 && cacheResult.size > 10 * 1024 * 1024) {
            items.push({
              name: `${folder.name} 残留：${entry.name}`,
              sizeMB: (cacheResult.size / 1024 / 1024).toFixed(2),
              size: cacheResult.size,
              path: fullPath,
              type: 'uninstalled_app_cache',
              selected: true,
              description: `可能是已卸载应用的残留缓存 (${cacheResult.fileCount} 个文件)`,
            });
          }
        } catch (error) {
        }
      }
    }
    
    items.sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB));
    
  } catch (error) {
    console.error('扫描已卸载应用缓存失败:', error);
  }
  
  return items.slice(0, 50);
}

/**
 * 获取文件夹大小（字节）
 */
async function getFolderSize(folderPath, progressCallback = null) {
  let totalSize = 0;
  let fileCount = 0;
  
  try {
    if (!fs.existsSync(folderPath)) {
      return { size: 0, fileCount: 0 };
    }
    
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          const result = await getFolderSize(fullPath, progressCallback);
          totalSize += result.size;
          fileCount += result.fileCount;
        } else {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
          fileCount++;
          
          // 每扫描100个文件或遇到大文件时报告进度
          if (progressCallback && (fileCount % 100 === 0 || stats.size > 10 * 1024 * 1024)) {
            progressCallback(fullPath);
          }
        }
      } catch (error) {
        // 跳过无法访问的文件
      }
    }
  } catch (error) {
    console.error(`获取文件夹大小失败 ${folderPath}:`, error);
  }
  
  return { size: totalSize, fileCount };
}

/**
 * 扫描系统临时文件
 */
async function scanSystemTemp(progressCallback = null) {
  const items = [];
  
  // 系统临时文件夹
  if (progressCallback) progressCallback(TEMP_PATHS.system);
  const systemTempResult = await getFolderSize(TEMP_PATHS.system, progressCallback);
  if (systemTempResult.size > 0) {
    items.push({
      name: '系统临时文件',
      sizeMB: (systemTempResult.size / 1024 / 1024).toFixed(2),
      size: systemTempResult.size,
      path: TEMP_PATHS.system,
      type: 'system_temp',
      selected: true,
      description: 'Windows 系统临时文件',
    });
  }
  
  // 用户临时文件夹
  if (progressCallback) progressCallback(TEMP_PATHS.user);
  const userTempResult = await getFolderSize(TEMP_PATHS.user, progressCallback);
  if (userTempResult.size > 0) {
    items.push({
      name: '用户临时文件',
      sizeMB: (userTempResult.size / 1024 / 1024).toFixed(2),
      size: userTempResult.size,
      path: TEMP_PATHS.user,
      type: 'user_temp',
      selected: true,
      description: '用户临时文件夹',
    });
  }
  
  // Prefetch 文件
  if (progressCallback) progressCallback(TEMP_PATHS.prefetch);
  const prefetchResult = await getFolderSize(TEMP_PATHS.prefetch, progressCallback);
  if (prefetchResult.size > 0) {
    items.push({
      name: 'Prefetch 预读取文件',
      sizeMB: (prefetchResult.size / 1024 / 1024).toFixed(2),
      size: prefetchResult.size,
      path: TEMP_PATHS.prefetch,
      type: 'prefetch',
      selected: true,
      description: '系统预读取缓存文件',
    });
  }
  
  return items;
}

/**
 * 扫描浏览器缓存
 */
async function scanBrowserCache(progressCallback = null) {
  const items = [];
  
  for (const browser of BROWSER_CACHE_PATHS) {
    if (progressCallback) progressCallback(browser.path);
    const cacheResult = await getFolderSize(browser.path, progressCallback);
    if (cacheResult.size > 0) {
      items.push({
        name: `${browser.name}缓存`,
        sizeMB: (cacheResult.size / 1024 / 1024).toFixed(2),
        size: cacheResult.size,
        path: browser.path,
        type: 'browser_cache',
        selected: true,
        description: `${browser.name}浏览器缓存文件`,
      });
    }
  }
  
  return items;
}

/**
 * 扫描应用缓存
 */
async function scanAppCache(progressCallback = null) {
  const items = [];
  
  for (const app of APP_CACHE_PATHS) {
    if (progressCallback) progressCallback(app.path);
    const cacheResult = await getFolderSize(app.path, progressCallback);
    if (cacheResult.size > 0) {
      items.push({
        name: app.name,
        sizeMB: (cacheResult.size / 1024 / 1024).toFixed(2),
        size: cacheResult.size,
        path: app.path,
        type: 'app_cache',
        selected: true,
        description: `${app.name}缓存文件`,
      });
    }
  }
  
  if (progressCallback) progressCallback('扫描已卸载应用残留缓存...');
  const uninstalledItems = await scanUninstalledAppCache(progressCallback);
  items.push(...uninstalledItems);
  
  return items;
}

/**
 * 扫描大文件（超过 100MB）
 */
async function scanLargeFiles(drive = 'C:', progressCallback = null) {
  const largeFiles = [];
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  const foldersToScan = [
    path.join(drive, 'Users', process.env.USERNAME || ''),
    path.join(drive, 'Downloads'),
    path.join(drive, 'Desktop'),
    path.join(drive, 'Documents'),
  ];
  
  async function scanFolder(folderPath) {
    try {
      if (!fs.existsSync(folderPath)) return;
      
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        
        try {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await scanFolder(fullPath);
          } else if (entry.isFile()) {
            const stats = fs.statSync(fullPath);
            if (stats.size > maxSize) {
              if (progressCallback) progressCallback(fullPath);
              largeFiles.push({
                name: entry.name,
                sizeMB: (stats.size / 1024 / 1024).toFixed(2),
                size: stats.size,
                path: fullPath,
                type: 'large_file',
                selected: false,
                description: `大文件 (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
                modifiedTime: stats.mtime.toISOString(),
              });
            }
          }
        } catch (error) {
          // 跳过无法访问的文件
        }
      }
    } catch (error) {
      console.error(`扫描文件夹失败 ${folderPath}:`, error);
    }
  }
  
  for (const folder of foldersToScan) {
    await scanFolder(folder);
  }
  
  // 按大小排序
  largeFiles.sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB));
  
  return largeFiles.slice(0, 100); // 只返回前 100 个
}

/**
 * 清理文件
 */
async function cleanFiles(filePaths) {
  const results = {
    success: 0,
    failed: 0,
    totalSize: 0,
    errors: [],
  };
  
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
  }
  
  return results;
}

/**
 * 扫描注册表冗余
 */
async function scanRegistry(progressCallback = null) {
  const items = [];
  
  try {
    // 扫描无效的软件卸载项
    if (progressCallback) progressCallback('扫描软件卸载项...');
    const invalidUninstallEntries = await scanInvalidUninstallEntries();
    if (invalidUninstallEntries.length > 0) {
      items.push(...invalidUninstallEntries);
    }
    
    // 扫描无效的 COM 组件
    if (progressCallback) progressCallback('扫描 COM 组件...');
    const invalidComEntries = await scanInvalidComEntries();
    if (invalidComEntries.length > 0) {
      items.push(...invalidComEntries);
    }
    
    // 扫描无效的字体项
    if (progressCallback) progressCallback('扫描字体项...');
    const invalidFontEntries = await scanInvalidFontEntries();
    if (invalidFontEntries.length > 0) {
      items.push(...invalidFontEntries);
    }
    
    // 扫描无效的启动项
    if (progressCallback) progressCallback('扫描启动项...');
    const invalidStartupEntries = await scanInvalidStartupEntries();
    if (invalidStartupEntries.length > 0) {
      items.push(...invalidStartupEntries);
    }
  } catch (error) {
    console.error('注册表扫描失败:', error);
  }
  
  return items;
}

/**
 * 扫描无效的卸载项
 */
async function scanInvalidUninstallEntries() {
  const items = [];
  const registryPaths = [
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
  ];
  
  for (const regPath of registryPaths) {
    try {
      const { stdout } = await execAsync(`reg query "${regPath}" /s /f "" /k 2>nul`);
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const keyPath = lines[i].trim();
        if (!keyPath.startsWith('HKEY')) continue;
        
        try {
          const { stdout: displayNameOut } = await execAsync(`reg query "${keyPath}" /v DisplayName 2>nul`);
          const { stdout: uninstallOut } = await execAsync(`reg query "${keyPath}" /v UninstallString 2>nul`);
          
          if (displayNameOut && uninstallOut) {
            const displayNameMatch = displayNameOut.match(/DisplayName\s+REG_SZ\s+(.+)/);
            const uninstallStringMatch = uninstallOut.match(/UninstallString\s+REG_SZ\s+(.+)/);
            
            if (displayNameMatch && uninstallStringMatch) {
              const uninstallPath = uninstallStringMatch[1].trim().replace(/^"/, '').replace(/"$/, '');
              
              if (!fs.existsSync(uninstallPath) && !uninstallPath.includes('MsiExec')) {
                items.push({
                  name: `无效卸载项：${displayNameMatch[1].trim()}`,
                  size: 1024,
                  sizeMB: '0.00',
                  path: keyPath,
                  type: 'registry_uninstall',
                  selected: true,
                  description: '软件已卸载但注册表中仍有残留',
                  registryKey: keyPath
                });
              }
            }
          }
        } catch (error) {
        }
      }
    } catch (error) {
      console.error(`扫描注册表路径失败 ${regPath}:`, error);
    }
  }
  
  return items;
}

/**
 * 扫描无效的 COM 组件
 */
async function scanInvalidComEntries() {
  const items = [];
  
  try {
    const { stdout } = await execAsync('reg query "HKEY_CLASSES_ROOT\\CLSID" /s /f "" /k 2>nul');
    const lines = stdout.split('\n').filter(line => line.trim());
    let invalidCount = 0;
    
    for (let i = 1; i < lines.length && invalidCount < 50; i++) {
      const keyPath = lines[i].trim();
      if (!keyPath.startsWith('HKEY_CLASSES_ROOT\\CLSID\\{')) continue;
      
      try {
        const { stdout: inprocOut } = await execAsync(`reg query "${keyPath}\\InprocServer32" /ve 2>nul`);
        const pathMatch = inprocOut.match(/\(默认\)\s+REG_SZ\s+(.+)/);
        
        if (pathMatch) {
          const dllPath = pathMatch[1].trim();
          if (dllPath && !fs.existsSync(dllPath)) {
            invalidCount++;
            items.push({
              name: `无效 COM 组件：${keyPath.split('\\')[2]}`,
              size: 512,
              sizeMB: '0.00',
              path: keyPath,
              type: 'registry_com',
              selected: true,
              description: 'COM 组件对应的 DLL 文件不存在',
              registryKey: keyPath
            });
          }
        }
      } catch (error) {
      }
    }
  } catch (error) {
    console.error('扫描 COM 组件失败:', error);
  }
  
  return items;
}

/**
 * 扫描无效的字体项
 */
async function scanInvalidFontEntries() {
  const items = [];
  
  try {
    const fontsDir = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts');
    const { stdout } = await execAsync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" /s 2>nul');
    const lines = stdout.split('\n').filter(line => line.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.includes('REG_SZ')) continue;
      
      const fontMatch = line.match(/(.+)\s+REG_SZ\s+(.+)/);
      if (fontMatch) {
        const fontFile = fontMatch[2].trim();
        const fontPath = path.join(fontsDir, fontFile);
        
        if (!fs.existsSync(fontPath)) {
          items.push({
            name: `无效字体：${fontMatch[1].trim()}`,
            size: 256,
            sizeMB: '0.00',
            path: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts',
            type: 'registry_font',
            selected: true,
            description: '字体文件已删除但注册表中仍有记录',
            registryKey: fontFile
          });
        }
      }
    }
  } catch (error) {
    console.error('扫描字体项失败:', error);
  }
  
  return items;
}

/**
 * 扫描无效的启动项
 */
async function scanInvalidStartupEntries() {
  const items = [];
  const startupPaths = [
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
  ];
  
  for (const regPath of startupPaths) {
    try {
      const { stdout } = await execAsync(`reg query "${regPath}" /s 2>nul`);
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.includes('REG_SZ')) continue;
        
        const pathMatch = line.match(/(.+)\s+REG_SZ\s+(.+)/);
        if (pathMatch) {
          const programPath = pathMatch[2].trim().replace(/^"/, '').replace(/"$/, '');
          
          if (!fs.existsSync(programPath)) {
            items.push({
              name: `无效启动项：${pathMatch[1].trim()}`,
              size: 256,
              sizeMB: '0.00',
              path: regPath,
              type: 'registry_startup',
              selected: true,
              description: '启动项指向的程序不存在',
              registryKey: programPath
            });
          }
        }
      }
    } catch (error) {
      console.error(`扫描启动项失败 ${regPath}:`, error);
    }
  }
  
  return items;
}

/**
 * 执行系统清理命令
 */
async function runSystemCleanup() {
  try {
    // 使用 Windows 内置的磁盘清理工具
    await execAsync('cleanmgr /d C');
    return { success: true, message: '系统清理完成' };
  } catch (error) {
    return { 
      success: false, 
      message: '系统清理失败',
      error: error.message 
    };
  }
}

module.exports = {
  scanSystemTemp,
  scanBrowserCache,
  scanAppCache,
  scanLargeFiles,
  scanRegistry,
  cleanFiles,
  runSystemCleanup,
};
