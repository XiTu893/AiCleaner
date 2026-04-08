const fs = require('fs').promises;
const path = require('path');
const systemCleaner = require('./systemCleaner');

const TASK_DIR = path.join(__dirname, '..', '..', 'cache', 'tasks');
const STATE_FILE = path.join(TASK_DIR, 'junk_scan_state.json');

// 初始化状态
let scanState = {
  isScanning: true,
  isPaused: false,
  shouldStop: false,
  scanProgress: 0,
  scanStatus: '',
  currentScanItem: '',
  currentCategoryIndex: -1,
  categories: [
    { id: 'system_temp', name: '系统临时文件', description: 'Windows 系统临时文件、更新残留、Prefetch 缓存', items: [], scanned: false, scanning: false },
    { id: 'app_cache', name: '应用缓存', description: '浏览器缓存、微信、QQ 等应用缓存文件', items: [], scanned: false, scanning: false },
    { id: 'registry', name: '注册表冗余', description: '无效注册表项、残留注册表', items: [], scanned: false, scanning: false },
    { id: 'large_files', name: '大文件', description: '超过 100MB 的大文件', items: [], scanned: false, scanning: false },
  ],
  lastUpdateTime: Date.now(),
};

// 确保任务目录存在
async function ensureTaskDir() {
  try {
    await fs.mkdir(TASK_DIR, { recursive: true });
  } catch (error) {
    console.error('[JunkScanWorker] 创建任务目录失败:', error);
  }
}

// 保存状态
async function saveState() {
  try {
    await ensureTaskDir();
    scanState.lastUpdateTime = Date.now();
    await fs.writeFile(STATE_FILE, JSON.stringify(scanState, null, 2), 'utf-8');
  } catch (error) {
    console.error('[JunkScanWorker] 保存状态失败:', error);
  }
}

// 读取控制命令
async function checkControlCommands() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    const currentState = JSON.parse(data);
    if (currentState.isPaused !== undefined) {
      scanState.isPaused = currentState.isPaused;
    }
    if (currentState.shouldStop !== undefined) {
      scanState.shouldStop = currentState.shouldStop;
    }
  } catch (error) {
    // 忽略
  }
}

// 更新当前扫描项
function updateCurrentScanItem(itemPath) {
  // 截断太长的路径，方便显示
  let displayPath = itemPath;
  if (displayPath.length > 60) {
    const halfLength = 25;
    displayPath = displayPath.substring(0, halfLength) + '...' + displayPath.substring(displayPath.length - halfLength);
  }
  scanState.currentScanItem = displayPath;
}

// 扫描单个类别
async function scanCategory(categoryId, index) {
  const category = scanState.categories.find(c => c.id === categoryId);
  if (!category) return;

  scanState.scanStatus = `正在扫描：${category.name}`;
  scanState.currentCategoryIndex = index;
  category.scanning = true;
  await saveState();

  try {
    let items = [];

    const progressCallback = (itemPath) => {
      updateCurrentScanItem(itemPath);
      saveState();
    };

    if (categoryId === 'system_temp') {
      items = await systemCleaner.scanSystemTemp(progressCallback);
    } else if (categoryId === 'app_cache') {
      const browserItems = await systemCleaner.scanBrowserCache(progressCallback);
      const appItems = await systemCleaner.scanAppCache(progressCallback);
      items = [...browserItems, ...appItems];
    } else if (categoryId === 'large_files') {
      items = await systemCleaner.scanLargeFiles('C:', progressCallback);
    } else if (categoryId === 'registry') {
      items = await systemCleaner.scanRegistry(progressCallback);
    }

    items = items.map((item, idx) => ({
      ...item,
      uniqueId: `${categoryId}-${item.id || idx}-${Date.now()}-${idx}`,
    }));

    category.items = items;
    category.scanned = true;
    category.scanning = false;

    console.log(`[JunkScanWorker] ${categoryId} 完成，找到 ${items.length} 项`);
  } catch (error) {
    console.error(`[JunkScanWorker] ${categoryId} 失败:`, error);
    category.scanning = false;
  }

  scanState.currentScanItem = '';
  await saveState();
}

// 主扫描函数
async function main() {
  console.log('[JunkScanWorker] 垃圾扫描工作进程启动');
  await ensureTaskDir();
  
  // 重置状态
  scanState.categories = scanState.categories.map(cat => ({
    ...cat,
    items: [],
    scanned: false,
    scanning: false,
  }));
  scanState.scanProgress = 0;
  scanState.isPaused = false;
  scanState.shouldStop = false;
  scanState.currentScanItem = '';
  await saveState();

  const categoryIds = ['system_temp', 'app_cache', 'registry', 'large_files'];

  for (let i = 0; i < categoryIds.length; i++) {
    // 检查停止命令
    await checkControlCommands();
    
    if (scanState.shouldStop) {
      console.log('[JunkScanWorker] 收到停止命令');
      break;
    }

    // 检查暂停
    while (scanState.isPaused && !scanState.shouldStop) {
      await checkControlCommands();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (scanState.shouldStop) {
      break;
    }

    await scanCategory(categoryIds[i], i);

    scanState.scanProgress = Math.round(((i + 1) / categoryIds.length) * 100);
    await saveState();

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('[JunkScanWorker] 扫描完成');
  scanState.isScanning = false;
  scanState.isPaused = false;
  scanState.shouldStop = false;
  scanState.currentCategoryIndex = -1;
  scanState.scanStatus = '';
  scanState.currentScanItem = '';
  await saveState();

  process.exit(0);
}

// 启动
main().catch(error => {
  console.error('[JunkScanWorker] 工作进程错误:', error);
  scanState.isScanning = false;
  saveState().then(() => {
    process.exit(1);
  });
});
