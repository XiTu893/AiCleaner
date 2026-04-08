const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let widgetWindow = null;
let widgetInterval = null;

function createWidgetWindow() {
  if (widgetWindow) {
    widgetWindow.show();
    return;
  }

  widgetWindow = new BrowserWindow({
    width: 400,
    height: 60,
    x: 100,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged;
  
  if (isDev) {
    widgetWindow.loadURL('http://localhost:5173#widget');
  } else {
    widgetWindow.loadFile(path.join(__dirname, '../dist/index.html#widget'));
  }

  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show();
  });

  widgetWindow.on('closed', () => {
    widgetWindow = null;
    if (widgetInterval) {
      clearInterval(widgetInterval);
      widgetInterval = null;
    }
  });

  startWidgetUpdate();
}

function closeWidgetWindow() {
  if (widgetWindow) {
    widgetWindow.close();
    widgetWindow = null;
  }
  if (widgetInterval) {
    clearInterval(widgetInterval);
    widgetInterval = null;
  }
}

function toggleWidgetWindow() {
  if (widgetWindow) {
    closeWidgetWindow();
    return false;
  } else {
    createWidgetWindow();
    return true;
  }
}

function startWidgetUpdate() {
  if (widgetInterval) {
    clearInterval(widgetInterval);
  }

  widgetInterval = setInterval(async () => {
    if (!widgetWindow || widgetWindow.isDestroyed()) {
      return;
    }

    try {
      const { exec } = require('child_process');
      const os = require('os');

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

        if (widgetWindow && !widgetWindow.isDestroyed()) {
          widgetWindow.webContents.send('widget-data', {
            cpu: cpuUsage,
            memory: memoryUsage,
            timestamp: Date.now()
          });
        }
      });
    } catch (error) {
      console.error('[Widget] 更新失败:', error);
    }
  }, 1000);
}

function setupDesktopWidgetIpc() {
  ipcMain.handle('toggle-widget', async () => {
    return toggleWidgetWindow();
  });

  ipcMain.handle('get-widget-status', async () => {
    return { visible: !!widgetWindow };
  });

  ipcMain.handle('close-widget', async () => {
    closeWidgetWindow();
    return { success: true };
  });
}

module.exports = {
  createWidgetWindow,
  closeWidgetWindow,
  toggleWidgetWindow,
  setupDesktopWidgetIpc
};
