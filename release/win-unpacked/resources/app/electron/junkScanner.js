const { ipcMain, BrowserWindow } = require('electron');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const taskExecutor = require('./taskExecutor');

const TASK_DIR = path.join(__dirname, '..', '..', 'cache', 'tasks');
const STATE_FILE = path.join(TASK_DIR, 'junk_scan_state.json');

// 确保任务目录存在
async function ensureTaskDir() {
  try {
    await fs.mkdir(TASK_DIR, { recursive: true });
  } catch (error) {
    console.error('[JunkScanner] 创建任务目录失败:', error);
  }
}

// 更新项目选中状态
async function updateItemSelection(categoryId, itemUniqueId, selected) {
  try {
    await ensureTaskDir();
    let state;
    
    try {
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      state = JSON.parse(data);
    } catch (error) {
      return { success: false, message: '未找到扫描状态' };
    }

    const category = state.categories.find(c => c.id === categoryId);
    if (category) {
      const item = category.items.find(i => i.uniqueId === itemUniqueId);
      if (item) {
        item.selected = selected;
        await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
        return { success: true };
      }
    }
    
    return { success: false, message: '未找到项目' };
  } catch (error) {
    console.error('[JunkScanner] 更新选中状态失败:', error);
    return { success: false, message: error.message };
  }
}

// 全选/取消全选类别
async function toggleCategorySelection(categoryId, selectAll) {
  try {
    await ensureTaskDir();
    let state;
    
    try {
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      state = JSON.parse(data);
    } catch (error) {
      return { success: false, message: '未找到扫描状态' };
    }

    const category = state.categories.find(c => c.id === categoryId);
    if (category) {
      category.items.forEach(item => {
        item.selected = selectAll;
      });
      await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
      return { success: true };
    }
    
    return { success: false, message: '未找到类别' };
  } catch (error) {
    console.error('[JunkScanner] 全选操作失败:', error);
    return { success: false, message: error.message };
  }
}

// 清理选中的垃圾项目
async function cleanSelectedJunk(categoryId) {
  try {
    await ensureTaskDir();
    let state;
    
    try {
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      state = JSON.parse(data);
    } catch (error) {
      return { success: false, message: '未找到扫描状态' };
    }

    const category = state.categories.find(c => c.id === categoryId);
    if (!category) {
      return { success: false, message: '未找到类别' };
    }

    const selectedItems = category.items.filter(item => item.selected);
    let totalSize = 0;
    let cleanedCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const item of selectedItems) {
      try {
        if (item.path && fsSync.existsSync(item.path)) {
          const stats = fsSync.statSync(item.path);
          
          if (stats.isDirectory()) {
            fsSync.rmSync(item.path, { recursive: true, force: true });
          } else {
            fsSync.unlinkSync(item.path);
          }
          
          totalSize += stats.size;
          cleanedCount++;
        } else if (categoryId === 'registry') {
          // 注册表项，这里暂时记录，实际删除需要管理员权限
          cleanedCount++;
        }
      } catch (error) {
        failedCount++;
        errors.push({
          item: item.name,
          error: error.message,
        });
      }
    }

    // 从扫描状态中移除已清理的项目
    category.items = category.items.filter(item => !item.selected);

    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');

    return {
      success: cleanedCount > 0,
      cleanedCount,
      failedCount,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      errors,
    };
  } catch (error) {
    console.error('[JunkScanner] 清理垃圾失败:', error);
    return { success: false, message: error.message };
  }
}

// 清理所有选中的垃圾项目
async function cleanAllSelectedJunk() {
  try {
    await ensureTaskDir();
    let state;
    
    try {
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      state = JSON.parse(data);
    } catch (error) {
      return { success: false, message: '未找到扫描状态' };
    }

    let totalSize = 0;
    let totalCleanedCount = 0;
    let totalFailedCount = 0;
    const allErrors = [];

    for (const category of state.categories) {
      const selectedItems = category.items.filter(item => item.selected);
      if (selectedItems.length === 0) continue;

      for (const item of selectedItems) {
        try {
          if (item.path && fsSync.existsSync(item.path)) {
            const stats = fsSync.statSync(item.path);
            
            if (stats.isDirectory()) {
              fsSync.rmSync(item.path, { recursive: true, force: true });
            } else {
              fsSync.unlinkSync(item.path);
            }
            
            totalSize += stats.size;
            totalCleanedCount++;
          } else if (category.id === 'registry') {
            // 注册表项
            totalCleanedCount++;
          }
        } catch (error) {
          totalFailedCount++;
          allErrors.push({
            category: category.name,
            item: item.name,
            error: error.message,
          });
        }
      }

      // 从扫描状态中移除已清理的项目
      category.items = category.items.filter(item => !item.selected);
    }

    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');

    return {
      success: totalCleanedCount > 0,
      cleanedCount: totalCleanedCount,
      failedCount: totalFailedCount,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      errors: allErrors,
    };
  } catch (error) {
    console.error('[JunkScanner] 清理所有垃圾失败:', error);
    return { success: false, message: error.message };
  }
}

// 重置扫描状态
async function resetScanState() {
  try {
    await ensureTaskDir();
    
    const defaultState = {
      isScanning: false,
      isPaused: false,
      shouldStop: false,
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
    
    await fs.writeFile(STATE_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('[JunkScanner] 重置状态失败:', error);
    return { success: false, message: error.message };
  }
}

// IPC 处理器
function setupJunkScannerIpc() {
  // 获取当前扫描状态
  ipcMain.handle('get-junk-scan-state', async () => {
    return await taskExecutor.getTaskStatus('junkScan');
  });

  // 开始扫描 - 立即返回，任务在后台运行
  ipcMain.handle('start-junk-scan', async () => {
    console.log('[JunkScanner] 收到启动扫描请求');
    const result = await taskExecutor.startJunkScanTask();
    console.log('[JunkScanner] 扫描任务已启动:', result);
    return result;
  });

  // 暂停扫描
  ipcMain.handle('pause-junk-scan', async () => {
    return await taskExecutor.pauseJunkScanTask();
  });

  // 继续扫描
  ipcMain.handle('resume-junk-scan', async () => {
    return await taskExecutor.resumeJunkScanTask();
  });

  // 停止扫描
  ipcMain.handle('stop-junk-scan', async () => {
    return await taskExecutor.stopJunkScanTask();
  });

  // 重置扫描
  ipcMain.handle('reset-junk-scan', async () => {
    return await resetScanState();
  });

  // 更新项目选中状态
  ipcMain.handle('update-junk-item-selection', async (event, categoryId, itemUniqueId, selected) => {
    return await updateItemSelection(categoryId, itemUniqueId, selected);
  });

  // 全选/取消全选类别
  ipcMain.handle('toggle-junk-category-selection', async (event, categoryId, selectAll) => {
    return await toggleCategorySelection(categoryId, selectAll);
  });

  // 清理选中的垃圾项目
  ipcMain.handle('clean-selected-junk', async (event, categoryId) => {
    console.log('[JunkScanner] 清理选中的垃圾:', categoryId);
    return await cleanSelectedJunk(categoryId);
  });

  // 清理所有选中的垃圾项目
  ipcMain.handle('clean-all-selected-junk', async () => {
    console.log('[JunkScanner] 清理所有选中的垃圾');
    return await cleanAllSelectedJunk();
  });
}

module.exports = {
  setupJunkScannerIpc,
};
