const { ipcMain, BrowserWindow } = require('electron');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const taskExecutor = require('./taskExecutor');
const softwareMigration = require('./softwareMigration');

const TASK_DIR = path.join(__dirname, '..', '..', 'cache', 'tasks');
const STATE_FILE = path.join(TASK_DIR, 'cdrive_scan_state.json');

async function ensureTaskDir() {
  try {
    await fs.mkdir(TASK_DIR, { recursive: true });
  } catch (error) {
    console.error('[CDriveScanner] 创建任务目录失败:', error);
  }
}

async function initState() {
  await ensureTaskDir();
  const defaultState = {
    isScanning: false,
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
  };
  
  try {
    await fs.writeFile(STATE_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
    return defaultState;
  } catch (error) {
    console.error('[CDriveScanner] 初始化状态失败:', error);
    return defaultState;
  }
}

async function getState() {
  try {
    await ensureTaskDir();
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return await initState();
  }
}

async function updateState(updates) {
  try {
    const state = await getState();
    const newState = { ...state, ...updates };
    await fs.writeFile(STATE_FILE, JSON.stringify(newState, null, 2), 'utf-8');
    return newState;
  } catch (error) {
    console.error('[CDriveScanner] 更新状态失败:', error);
  }
}

async function startCDriveScan() {
  console.log('[CDriveScanner] 收到启动扫描请求');
  const result = await taskExecutor.startCDriveScanTask();
  console.log('[CDriveScanner] 扫描任务已启动:', result);
  return result;
}

async function toggleLargeFileSelection(filePath, selected) {
  try {
    const state = await getState();
    const file = state.largeFiles.find(f => f.path === filePath);
    if (file) {
      file.selected = selected;
      await updateState({ largeFiles: state.largeFiles });
      return { success: true };
    }
    return { success: false, message: '未找到文件' };
  } catch (error) {
    console.error('[CDriveScanner] 更新选中状态失败:', error);
    return { success: false, message: error.message };
  }
}

async function selectAllLargeFiles(selectAll) {
  try {
    const state = await getState();
    state.largeFiles.forEach(file => {
      file.selected = selectAll;
    });
    await updateState({ largeFiles: state.largeFiles });
    return { success: true };
  } catch (error) {
    console.error('[CDriveScanner] 全选操作失败:', error);
    return { success: false, message: error.message };
  }
}

async function moveSelectedLargeFiles(targetDrive) {
  try {
    const state = await getState();
    const filesToMove = state.largeFiles.filter(f => f.selected);
    
    if (filesToMove.length === 0) {
      return { success: false, message: '没有选中的文件' };
    }
    
    const targetPath = path.join(targetDrive, 'AICleaner_Migrated_Files');
    
    if (!fsSync.existsSync(targetPath)) {
      fsSync.mkdirSync(targetPath, { recursive: true });
    }
    
    let successCount = 0;
    let totalSize = 0;
    
    for (const file of filesToMove) {
      try {
        const fileName = path.basename(file.path);
        const targetFilePath = path.join(targetPath, fileName);
        
        fsSync.copyFileSync(file.path, targetFilePath);
        fsSync.unlinkSync(file.path);
        
        successCount++;
        totalSize += file.size;
      } catch (error) {
        console.error('[CDriveScanner] 迁移文件失败:', file.path, error);
      }
    }
    
    state.largeFiles = state.largeFiles.filter(f => !f.selected);
    await updateState({ largeFiles: state.largeFiles });
    
    return {
      success: true,
      successCount,
      totalSize,
    };
  } catch (error) {
    console.error('[CDriveScanner] 迁移文件失败:', error);
    return { success: false, message: error.message };
  }
}

async function toggleCleanupItemSelection(filePath, selected) {
  try {
    const state = await getState();
    const item = state.cleanupItems?.find(f => f.path === filePath);
    if (item) {
      item.selected = selected;
      await updateState({ cleanupItems: state.cleanupItems });
      return { success: true };
    }
    return { success: false, message: '未找到项目' };
  } catch (error) {
    console.error('[CDriveScanner] 更新选中状态失败:', error);
    return { success: false, message: error.message };
  }
}

async function selectAllCleanupItems(selectAll) {
  try {
    const state = await getState();
    if (state.cleanupItems) {
      state.cleanupItems.forEach(item => {
        item.selected = selectAll;
      });
    }
    await updateState({ cleanupItems: state.cleanupItems });
    return { success: true };
  } catch (error) {
    console.error('[CDriveScanner] 全选操作失败:', error);
    return { success: false, message: error.message };
  }
}

async function cleanSelectedItems() {
  try {
    const state = await getState();
    const itemsToClean = state.cleanupItems?.filter(f => f.selected);
    
    if (!itemsToClean || itemsToClean.length === 0) {
      return { success: false, message: '没有选中的项目' };
    }
    
    let successCount = 0;
    let totalSize = 0;
    
    for (const item of itemsToClean) {
      try {
        if (fsSync.existsSync(item.path)) {
          const stats = fsSync.statSync(item.path);
          let sizeToAdd = 0;
          
          if (stats.isDirectory()) {
            sizeToAdd = getFolderSizeSync(item.path);
            fsSync.rmSync(item.path, { recursive: true, force: true });
          } else {
            sizeToAdd = stats.size;
            fsSync.unlinkSync(item.path);
          }
          
          successCount++;
          totalSize += sizeToAdd;
        }
      } catch (error) {
        console.error('[CDriveScanner] 清理项目失败:', item.path, error);
      }
    }
    
    state.cleanupItems = state.cleanupItems?.filter(f => !f.selected) || [];
    await updateState({ cleanupItems: state.cleanupItems });
    
    return {
      success: true,
      successCount,
      totalSize,
    };
  } catch (error) {
    console.error('[CDriveScanner] 清理项目失败:', error);
    return { success: false, message: error.message };
  }
}

function getFolderSizeSync(folderPath) {
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
          totalSize += getFolderSizeSync(fullPath);
        } else {
          const stats = fsSync.statSync(fullPath);
          totalSize += stats.size;
        }
      } catch (error) {
      }
    }
  } catch (error) {
    console.error('[CDriveScanner] 获取文件夹大小失败:', error);
  }
  
  return totalSize;
}

async function resetCDriveScan() {
  await initState();
  return { success: true };
}

async function toggleSoftwareSelection(softwarePath, selected) {
  try {
    const state = await getState();
    const software = state.migratableSoftware?.find(s => s.path === softwarePath);
    if (software) {
      software.selected = selected;
      await updateState({ migratableSoftware: state.migratableSoftware });
      return { success: true };
    }
    return { success: false, message: '未找到软件' };
  } catch (error) {
    console.error('[CDriveScanner] 更新软件选中状态失败:', error);
    return { success: false, message: error.message };
  }
}

async function selectAllMigratableSoftware(selectAll) {
  try {
    const state = await getState();
    if (state.migratableSoftware) {
      state.migratableSoftware.forEach(software => {
        software.selected = selectAll;
      });
    }
    await updateState({ migratableSoftware: state.migratableSoftware });
    return { success: true };
  } catch (error) {
    console.error('[CDriveScanner] 全选软件操作失败:', error);
    return { success: false, message: error.message };
  }
}

async function moveSelectedSoftware(targetDrive) {
  try {
    const state = await getState();
    const softwareToMove = state.migratableSoftware?.filter(s => s.selected) || [];
    
    if (softwareToMove.length === 0) {
      return { success: false, message: '没有选中的软件' };
    }
    
    let successCount = 0;
    let totalSize = 0;
    let errors = [];
    
    for (const software of softwareToMove) {
      try {
        const result = await softwareMigration.moveSoftware(software, targetDrive);
        if (result.success) {
          successCount++;
          totalSize += software.size;
        } else {
          errors.push(`${software.name}: ${result.message}`);
        }
      } catch (error) {
        console.error('[CDriveScanner] 迁移软件失败:', software.name, error);
        errors.push(`${software.name}: ${error.message}`);
      }
    }
    
    state.migratableSoftware = state.migratableSoftware?.filter(s => !s.selected) || [];
    await updateState({ migratableSoftware: state.migratableSoftware });
    
    return {
      success: true,
      successCount,
      totalSize,
      errors,
    };
  } catch (error) {
    console.error('[CDriveScanner] 迁移软件失败:', error);
    return { success: false, message: error.message };
  }
}

function setupCDriveScannerIpc() {
  ipcMain.handle('get-cdrive-scan-state', async () => {
    return await taskExecutor.getTaskStatus('cdriveScan');
  });

  ipcMain.handle('start-cdrive-scan', async () => {
    console.log('[CDriveScanner] 收到启动扫描请求');
    return await startCDriveScan();
  });

  ipcMain.handle('toggle-large-file-selection', async (event, filePath, selected) => {
    return await toggleLargeFileSelection(filePath, selected);
  });

  ipcMain.handle('select-all-large-files', async (event, selectAll) => {
    return await selectAllLargeFiles(selectAll);
  });

  ipcMain.handle('move-selected-large-files', async (event, targetDrive) => {
    return await moveSelectedLargeFiles(targetDrive);
  });

  ipcMain.handle('toggle-cleanup-item-selection', async (event, filePath, selected) => {
    return await toggleCleanupItemSelection(filePath, selected);
  });

  ipcMain.handle('select-all-cleanup-items', async (event, selectAll) => {
    return await selectAllCleanupItems(selectAll);
  });

  ipcMain.handle('clean-selected-items', async () => {
    return await cleanSelectedItems();
  });

  ipcMain.handle('reset-cdrive-scan', async () => {
    return await resetCDriveScan();
  });

  ipcMain.handle('toggle-software-selection', async (event, softwarePath, selected) => {
    return await toggleSoftwareSelection(softwarePath, selected);
  });

  ipcMain.handle('select-all-migratable-software', async (event, selectAll) => {
    return await selectAllMigratableSoftware(selectAll);
  });

  ipcMain.handle('move-selected-software', async (event, targetDrive) => {
    return await moveSelectedSoftware(targetDrive);
  });
}

module.exports = {
  getCDriveScanState: getState,
  startCDriveScan,
  toggleLargeFileSelection,
  selectAllLargeFiles,
  moveSelectedLargeFiles,
  toggleCleanupItemSelection,
  selectAllCleanupItems,
  cleanSelectedItems,
  resetCDriveScan,
  toggleSoftwareSelection,
  selectAllMigratableSoftware,
  moveSelectedSoftware,
  setupCDriveScannerIpc,
};
