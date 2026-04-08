const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Script is loading...');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: async () => {
    console.log('[electronAPI] getSystemInfo called');
    const result = await ipcRenderer.invoke('get-system-info');
    console.log('[electronAPI] getSystemInfo result:', result);
    return result;
  },
  getGPUInfo: async () => {
    console.log('[electronAPI] getGPUInfo called');
    return ipcRenderer.invoke('get-gpu-info');
  },
  getDiskInfo: async () => {
    console.log('[electronAPI] getDiskInfo called');
    return ipcRenderer.invoke('get-disk-info');
  },
  getInstalledSoftware: async () => {
    console.log('[electronAPI] getInstalledSoftware called');
    return ipcRenderer.invoke('get-installed-software');
  },
  uninstallSoftware: (software, forceUninstall = false) => {
    console.log('[electronAPI] uninstallSoftware called:', software.name, 'force:', forceUninstall);
    return ipcRenderer.invoke('uninstall-software', software, forceUninstall);
  },
  getTemperature: async () => {
    console.log('[electronAPI] getTemperature called');
    return ipcRenderer.invoke('get-temperature');
  },
  runBenchmark: async () => {
    console.log('[electronAPI] runBenchmark called');
    return ipcRenderer.invoke('run-benchmark');
  },
  scanSystem: async () => {
    console.log('[electronAPI] scanSystem called');
    return ipcRenderer.invoke('scan-system');
  },
  cleanSystem: async (selectedItems) => {
    console.log('[electronAPI] cleanSystem called with items:', selectedItems?.length);
    return ipcRenderer.invoke('clean-system', selectedItems);
  },
  // 新增真实功能 API
  getSystemUsage: async () => {
    console.log('[electronAPI] getSystemUsage called');
    return ipcRenderer.invoke('get-system-usage');
  },
  getProcessList: async () => {
    console.log('[electronAPI] getProcessList called');
    return ipcRenderer.invoke('get-process-list');
  },
  killProcess: async (pid) => {
    console.log('[electronAPI] killProcess called:', pid);
    return ipcRenderer.invoke('kill-process', pid);
  },
  // 后台任务和缓存 API
  getTaskStatus: async (taskId) => {
    console.log('[electronAPI] getTaskStatus called:', taskId);
    return ipcRenderer.invoke('get-task-status', taskId);
  },
  clearCache: async (taskType) => {
    console.log('[electronAPI] clearCache called:', taskType);
    return ipcRenderer.invoke('clear-cache', taskType);
  },
  clearAllCache: async () => {
    console.log('[electronAPI] clearAllCache called');
    return ipcRenderer.invoke('clear-all-cache');
  },
  getCacheStats: async () => {
    console.log('[electronAPI] getCacheStats called');
    return ipcRenderer.invoke('get-cache-stats');
  },
  // 监控记录 API
  startMonitorRecording: async (intervalMs = 3000) => {
    console.log('[electronAPI] startMonitorRecording called');
    return ipcRenderer.invoke('start-monitor-recording', intervalMs);
  },
  stopMonitorRecording: async () => {
    console.log('[electronAPI] stopMonitorRecording called');
    return ipcRenderer.invoke('stop-monitor-recording');
  },
  getRecordingStatus: async () => {
    console.log('[electronAPI] getRecordingStatus called');
    return ipcRenderer.invoke('get-recording-status');
  },
  getMonitorHistory: async (days = 7) => {
    console.log('[electronAPI] getMonitorHistory called:', days);
    return ipcRenderer.invoke('get-monitor-history', days);
  },
  clearMonitorHistory: async (days = 0) => {
    console.log('[electronAPI] clearMonitorHistory called:', days);
    return ipcRenderer.invoke('clear-monitor-history', days);
  },
  onMonitorData: (callback) => {
    ipcRenderer.on('monitor-data', (event, data) => callback(data));
  },
  // 系统清理 API
  scanJunk: async () => {
    console.log('[electronAPI] scanJunk called');
    return ipcRenderer.invoke('scan-junk');
  },
  scanLargeFiles: async (drive = 'C:') => {
    console.log('[electronAPI] scanLargeFiles called:', drive);
    return ipcRenderer.invoke('scan-large-files', drive);
  },
  scanRegistry: async () => {
    console.log('[electronAPI] scanRegistry called');
    return ipcRenderer.invoke('scan-registry');
  },
  cleanFiles: async (filePaths) => {
    console.log('[electronAPI] cleanFiles called');
    return ipcRenderer.invoke('clean-files', filePaths);
  },
  // 系统优化 API
  getStartupItems: async () => {
    console.log('[electronAPI] getStartupItems called');
    return ipcRenderer.invoke('get-startup-items');
  },
  toggleStartupItem: async (item, enable) => {
    console.log('[electronAPI] toggleStartupItem called');
    return ipcRenderer.invoke('toggle-startup-item', item, enable);
  },
  setStartupItemType: async (item, startupType) => {
    console.log('[electronAPI] setStartupItemType called');
    return ipcRenderer.invoke('set-startup-item-type', item, startupType);
  },
  runStartupItem: async (item) => {
    console.log('[electronAPI] runStartupItem called');
    return ipcRenderer.invoke('run-startup-item', item);
  },
  stopStartupItem: async (item) => {
    console.log('[electronAPI] stopStartupItem called');
    return ipcRenderer.invoke('stop-startup-item', item);
  },
  getSystemServices: async () => {
    console.log('[electronAPI] getSystemServices called');
    return ipcRenderer.invoke('get-system-services');
  },
  optimizeService: async (serviceName, mode) => {
    console.log('[electronAPI] optimizeService called');
    return ipcRenderer.invoke('optimize-service', serviceName, mode);
  },
  startService: async (serviceName) => {
    console.log('[electronAPI] startService called');
    return ipcRenderer.invoke('start-service', serviceName);
  },
  stopService: async (serviceName) => {
    console.log('[electronAPI] stopService called');
    return ipcRenderer.invoke('stop-service', serviceName);
  },
  deleteService: async (serviceName) => {
    console.log('[electronAPI] deleteService called');
    return ipcRenderer.invoke('delete-service', serviceName);
  },
  releaseMemory: async () => {
    console.log('[electronAPI] releaseMemory called');
    return ipcRenderer.invoke('release-memory');
  },
  toggleGameMode: async (enable) => {
    console.log('[electronAPI] toggleGameMode called');
    return ipcRenderer.invoke('toggle-game-mode', enable);
  },
  getGameModeStatus: async () => {
    console.log('[electronAPI] getGameModeStatus called');
    return ipcRenderer.invoke('get-game-mode-status');
  },
  getBatteryStatus: async () => {
    console.log('[electronAPI] getBatteryStatus called');
    return ipcRenderer.invoke('get-battery-status');
  },
  analyzeCDrive: async () => {
    console.log('[electronAPI] analyzeCDrive called');
    return ipcRenderer.invoke('analyze-c-drive');
  },
  moveLargeFiles: async (files, targetDrive) => {
    console.log('[electronAPI] moveLargeFiles called');
    return ipcRenderer.invoke('move-large-files', files, targetDrive);
  },
  // 桌面整理 API
  organizeDesktop: async () => {
    console.log('[electronAPI] organizeDesktop called');
    return ipcRenderer.invoke('organize-desktop');
  },
  quickOrganizeDesktop: async () => {
    console.log('[electronAPI] quickOrganizeDesktop called');
    return ipcRenderer.invoke('quick-organize-desktop');
  },
  cleanBrokenShortcuts: async () => {
    console.log('[electronAPI] cleanBrokenShortcuts called');
    return ipcRenderer.invoke('clean-broken-shortcuts');
  },
  startAutoOrganize: async () => {
    console.log('[electronAPI] startAutoOrganize called');
    return ipcRenderer.invoke('start-auto-organize');
  },
  stopAutoOrganize: async () => {
    console.log('[electronAPI] stopAutoOrganize called');
    return ipcRenderer.invoke('stop-auto-organize');
  },
  // 进度监听 API
  onScanProgress: (callback) => {
    ipcRenderer.on('scan-progress', (event, data) => callback(data));
  },
  onCleanProgress: (callback) => {
    ipcRenderer.on('clean-progress', (event, data) => callback(data));
  },
  removeScanProgressListener: (callback) => {
    ipcRenderer.removeAllListeners('scan-progress');
  },
  removeCleanProgressListener: (callback) => {
    ipcRenderer.removeAllListeners('clean-progress');
  },
  // 垃圾扫描管理器 API
  getJunkScanState: async () => {
    console.log('[electronAPI] getJunkScanState called');
    return ipcRenderer.invoke('get-junk-scan-state');
  },
  startJunkScan: async () => {
    console.log('[electronAPI] startJunkScan called');
    return ipcRenderer.invoke('start-junk-scan');
  },
  pauseJunkScan: async () => {
    console.log('[electronAPI] pauseJunkScan called');
    return ipcRenderer.invoke('pause-junk-scan');
  },
  resumeJunkScan: async () => {
    console.log('[electronAPI] resumeJunkScan called');
    return ipcRenderer.invoke('resume-junk-scan');
  },
  stopJunkScan: async () => {
    console.log('[electronAPI] stopJunkScan called');
    return ipcRenderer.invoke('stop-junk-scan');
  },
  resetJunkScan: async () => {
    console.log('[electronAPI] resetJunkScan called');
    return ipcRenderer.invoke('reset-junk-scan');
  },
  updateJunkItemSelection: async (categoryId, itemUniqueId, selected) => {
    console.log('[electronAPI] updateJunkItemSelection called');
    return ipcRenderer.invoke('update-junk-item-selection', categoryId, itemUniqueId, selected);
  },
  toggleJunkCategorySelection: async (categoryId, selectAll) => {
    console.log('[electronAPI] toggleJunkCategorySelection called');
    return ipcRenderer.invoke('toggle-junk-category-selection', categoryId, selectAll);
  },
  onJunkScanStateUpdate: (callback) => {
    ipcRenderer.on('junk-scan-state-update', (event, data) => callback(data));
  },
  removeJunkScanStateUpdateListener: () => {
    ipcRenderer.removeAllListeners('junk-scan-state-update');
  },
  // 清理垃圾项目 API
  cleanSelectedJunk: async (categoryId) => {
    console.log('[electronAPI] cleanSelectedJunk called:', categoryId);
    return ipcRenderer.invoke('clean-selected-junk', categoryId);
  },
  cleanAllSelectedJunk: async () => {
    console.log('[electronAPI] cleanAllSelectedJunk called');
    return ipcRenderer.invoke('clean-all-selected-junk');
  },
  // C 盘瘦身 API
  getCDriveScanState: async () => {
    console.log('[electronAPI] getCDriveScanState called');
    return ipcRenderer.invoke('get-cdrive-scan-state');
  },
  startCDriveScan: async () => {
    console.log('[electronAPI] startCDriveScan called');
    return ipcRenderer.invoke('start-cdrive-scan');
  },
  toggleLargeFileSelection: async (filePath, selected) => {
    console.log('[electronAPI] toggleLargeFileSelection called');
    return ipcRenderer.invoke('toggle-large-file-selection', filePath, selected);
  },
  selectAllLargeFiles: async (selectAll) => {
    console.log('[electronAPI] selectAllLargeFiles called');
    return ipcRenderer.invoke('select-all-large-files', selectAll);
  },
  moveSelectedLargeFiles: async (targetDrive) => {
    console.log('[electronAPI] moveSelectedLargeFiles called');
    return ipcRenderer.invoke('move-selected-large-files', targetDrive);
  },
  toggleCleanupItemSelection: async (filePath, selected) => {
    console.log('[electronAPI] toggleCleanupItemSelection called');
    return ipcRenderer.invoke('toggle-cleanup-item-selection', filePath, selected);
  },
  selectAllCleanupItems: async (selectAll) => {
    console.log('[electronAPI] selectAllCleanupItems called');
    return ipcRenderer.invoke('select-all-cleanup-items', selectAll);
  },
  cleanSelectedItems: async () => {
    console.log('[electronAPI] cleanSelectedItems called');
    return ipcRenderer.invoke('clean-selected-items');
  },
  resetCDriveScan: async () => {
    console.log('[electronAPI] resetCDriveScan called');
    return ipcRenderer.invoke('reset-cdrive-scan');
  },
  // 软件迁移 API
  toggleSoftwareSelection: async (softwarePath, selected) => {
    console.log('[electronAPI] toggleSoftwareSelection called');
    return ipcRenderer.invoke('toggle-software-selection', softwarePath, selected);
  },
  selectAllMigratableSoftware: async (selectAll) => {
    console.log('[electronAPI] selectAllMigratableSoftware called');
    return ipcRenderer.invoke('select-all-migratable-software', selectAll);
  },
  moveSelectedSoftware: async (targetDrive) => {
    console.log('[electronAPI] moveSelectedSoftware called');
    return ipcRenderer.invoke('move-selected-software', targetDrive);
  },
  // 高级任务管理器 API
  createTask: async (options) => {
    console.log('[electronAPI] createTask called:', options);
    return ipcRenderer.invoke('create-task', options);
  },
  getTask: async (taskId) => {
    console.log('[electronAPI] getTask called:', taskId);
    return ipcRenderer.invoke('get-task', taskId);
  },
  getAllTasks: async () => {
    console.log('[electronAPI] getAllTasks called');
    return ipcRenderer.invoke('get-all-tasks');
  },
  pauseTask: async (taskId) => {
    console.log('[electronAPI] pauseTask called:', taskId);
    return ipcRenderer.invoke('pause-task', taskId);
  },
  resumeTask: async (taskId) => {
    console.log('[electronAPI] resumeTask called:', taskId);
    return ipcRenderer.invoke('resume-task', taskId);
  },
  stopTask: async (taskId) => {
    console.log('[electronAPI] stopTask called:', taskId);
    return ipcRenderer.invoke('stop-task', taskId);
  },
  clearCompletedTasks: async () => {
    console.log('[electronAPI] clearCompletedTasks called');
    return ipcRenderer.invoke('clear-completed-tasks');
  },
  restartTask: async (taskId) => {
    console.log('[electronAPI] restartTask called:', taskId);
    return ipcRenderer.invoke('restart-task', taskId);
  },
  onTaskUpdate: (callback) => {
    ipcRenderer.on('task-update', (event, data) => callback(data));
  },
  removeTaskUpdateListener: () => {
    ipcRenderer.removeAllListeners('task-update');
  },
  // 桌面 widget API
  toggleWidget: async () => {
    console.log('[electronAPI] toggleWidget called');
    return ipcRenderer.invoke('toggle-widget');
  },
  getWidgetStatus: async () => {
    console.log('[electronAPI] getWidgetStatus called');
    return ipcRenderer.invoke('get-widget-status');
  },
  closeWidget: async () => {
    console.log('[electronAPI] closeWidget called');
    return ipcRenderer.invoke('close-widget');
  },
  onWidgetData: (callback) => {
    ipcRenderer.on('widget-data', (event, data) => callback(data));
  },
  removeWidgetDataListener: () => {
    ipcRenderer.removeAllListeners('widget-data');
  },
});

console.log('[Preload] Script loaded successfully!');
console.log('[Preload] window.electronAPI exposed:', typeof window.electronAPI);
