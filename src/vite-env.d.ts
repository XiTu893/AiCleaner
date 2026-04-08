export {};

declare global {
  interface Window {
    electronAPI: {
      getSystemInfo: () => Promise<{
        platform: string;
        arch: string;
        cpus: Array<{ model: string; speed: number }>;
        totalMemory: number;
        freeMemory: number;
        hostname: string;
        release: string;
        uptime: number;
        gpu: Array<{
          name: string;
          adapterRAM: number;
          driverVersion: string;
          status: string;
        }>;
      }>;
      getGPUInfo: () => Promise<Array<{
        name: string;
        adapterRAM: number;
        driverVersion: string;
        status: string;
      }>>;
      getDiskInfo: () => Promise<Array<{
        name: string;
        freeSpace: number;
        size: number;
      }>>;
      getInstalledSoftware: () => Promise<Array<{
        name: string;
        publisher: string;
        version: string;
        uninstallString: string;
        installDate: string;
        location: string;
      }>>;
      uninstallSoftware: (software: any, forceUninstall?: boolean) => Promise<{ success: boolean; message: string; error?: string }>;
      getTemperature: () => Promise<{
        cpu: number;
        gpu: number;
        available?: boolean;
      }>;
      runBenchmark: () => Promise<{
        cpu: number;
        memory: number;
        total: number;
        timestamp: number;
      }>;
      scanSystem: () => Promise<any>;
      cleanSystem: (selectedItems?: any) => Promise<{ success: boolean; cleaned: boolean }>;
      getSystemUsage: () => Promise<{
        cpu: number;
        memory: number;
        freeMemory: number;
        totalMemory: number;
      }>;
      getProcessList: () => Promise<Array<{
        name: string;
        pid: number;
        memory: number;
        parentPid: number;
      }>>;
      killProcess: (pid: number) => Promise<{ success: boolean; message: string; error?: string }>;
      getTaskStatus: (taskId: string) => Promise<any>;
      clearCache: (taskType?: string) => Promise<any>;
      clearAllCache: () => Promise<any>;
      getCacheStats: () => Promise<any>;
      startMonitorRecording: (intervalMs?: number) => Promise<any>;
      stopMonitorRecording: () => Promise<any>;
      getRecordingStatus: () => Promise<any>;
      getMonitorHistory: (days?: number) => Promise<any>;
      clearMonitorHistory: (days?: number) => Promise<any>;
      onMonitorData: (callback: (data: any) => void) => void;
      scanJunk: () => Promise<any>;
      scanLargeFiles: (drive?: string) => Promise<any>;
      scanRegistry: () => Promise<any>;
      cleanFiles: (filePaths: string[]) => Promise<any>;
      getStartupItems: () => Promise<any>;
      toggleStartupItem: (item: any, enable: boolean) => Promise<any>;
      getSystemServices: () => Promise<any>;
      optimizeService: (serviceName: string, mode: string) => Promise<any>;
      releaseMemory: () => Promise<any>;
      toggleGameMode: (enable: boolean) => Promise<any>;
      getGameModeStatus: () => Promise<any>;
      getBatteryStatus: () => Promise<any>;
      analyzeCDrive: () => Promise<any>;
      moveLargeFiles: (files: any[], targetDrive: string) => Promise<any>;
      organizeDesktop: () => Promise<any>;
      quickOrganizeDesktop: () => Promise<any>;
      cleanBrokenShortcuts: () => Promise<any>;
      startAutoOrganize: () => Promise<any>;
      stopAutoOrganize: () => Promise<any>;
      startService: (serviceName: string) => Promise<any>;
      stopService: (serviceName: string) => Promise<any>;
      deleteService: (serviceName: string) => Promise<any>;
      setStartupItemType: (item: any, startupType: string) => Promise<any>;
      runStartupItem: (item: any) => Promise<any>;
      stopStartupItem: (item: any) => Promise<any>;
      onScanProgress: (callback: (data: any) => void) => void;
      onCleanProgress: (callback: (data: any) => void) => void;
      removeScanProgressListener: (callback?: any) => void;
      removeCleanProgressListener: (callback?: any) => void;
      getJunkScanState: () => Promise<any>;
      startJunkScan: () => Promise<any>;
      pauseJunkScan: () => Promise<any>;
      resumeJunkScan: () => Promise<any>;
      stopJunkScan: () => Promise<any>;
      resetJunkScan: () => Promise<any>;
      updateJunkItemSelection: (categoryId: string, itemUniqueId: string, selected: boolean) => Promise<any>;
      toggleJunkCategorySelection: (categoryId: string, selectAll: boolean) => Promise<any>;
      onJunkScanStateUpdate: (callback: (data: any) => void) => void;
      removeJunkScanStateUpdateListener: () => void;
      cleanSelectedJunk: (categoryId?: string) => Promise<any>;
      cleanAllSelectedJunk: () => Promise<any>;
      getCDriveScanState: () => Promise<any>;
      startCDriveScan: () => Promise<any>;
      toggleLargeFileSelection: (filePath: string, selected: boolean) => Promise<any>;
      selectAllLargeFiles: (selectAll: boolean) => Promise<any>;
      moveSelectedLargeFiles: (targetDrive: string) => Promise<any>;
      toggleCleanupItemSelection: (filePath: string, selected: boolean) => Promise<any>;
      selectAllCleanupItems: (selectAll: boolean) => Promise<any>;
      cleanSelectedItems: () => Promise<any>;
      resetCDriveScan: () => Promise<any>;
      toggleSoftwareSelection: (softwarePath: string, selected: boolean) => Promise<any>;
      selectAllMigratableSoftware: (selectAll: boolean) => Promise<any>;
      moveSelectedSoftware: (targetDrive: string) => Promise<any>;
      createTask: (options: any) => Promise<any>;
      getTask: (taskId: string) => Promise<any>;
      getAllTasks: () => Promise<any>;
      pauseTask: (taskId: string) => Promise<any>;
      resumeTask: (taskId: string) => Promise<any>;
      stopTask: (taskId: string) => Promise<any>;
      clearCompletedTasks: () => Promise<any>;
      restartTask: (taskId: string) => Promise<any>;
      onTaskUpdate: (callback: (data: any) => void) => void;
      removeTaskUpdateListener: () => void;
      toggleWidget: () => Promise<boolean>;
      getWidgetStatus: () => Promise<{ visible: boolean }>;
      closeWidget: () => Promise<{ success: boolean }>;
      onWidgetData: (callback: (data: { cpu: number; memory: number; timestamp: number }) => void) => void;
      removeWidgetDataListener: () => void;
    };
  }
}
