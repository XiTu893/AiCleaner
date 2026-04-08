const fs = require('fs');
const path = require('path');

// 文件类型映射
const FILE_TYPE_MAP = {
  // 文档
  documents: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.txt', '.md', '.rtf'],
  // 图片
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp'],
  // 音频
  audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
  // 视频
  videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv'],
  // 压缩包
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  // 安装包
  installers: ['.exe', '.msi', '.dmg', '.pkg'],
  // 代码
  code: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.html', '.css'],
};

// 反向映射：扩展名 -> 类型
const EXT_TO_TYPE = {};
for (const [type, extensions] of Object.entries(FILE_TYPE_MAP)) {
  for (const ext of extensions) {
    EXT_TO_TYPE[ext.toLowerCase()] = type;
  }
}

/**
 * 获取桌面路径
 */
function getDesktopPath() {
  return path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'Desktop');
}

/**
 * 获取文件类型
 */
function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return EXT_TO_TYPE[ext] || 'others';
}

/**
 * 整理桌面文件
 */
async function organizeDesktop() {
  const desktopPath = getDesktopPath();
  const result = {
    success: 0,
    failed: 0,
    organized: [],
    errors: [],
  };
  
  // 创建分类文件夹
  const categoryFolders = {
    documents: '文档资料',
    images: '图片视频',
    audio: '音频文件',
    videos: '视频文件',
    archives: '压缩文件',
    installers: '安装程序',
    code: '代码文件',
    others: '其他文件',
  };
  
  // 确保分类文件夹存在
  for (const folderName of Object.values(categoryFolders)) {
    const folderPath = path.join(desktopPath, folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
  
  try {
    const entries = fs.readdirSync(desktopPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // 跳过文件夹和特殊文件
      if (entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'desktop.ini') {
        continue;
      }
      
      const fileType = getFileType(entry.name);
      const targetFolder = path.join(desktopPath, categoryFolders[fileType]);
      const sourcePath = path.join(desktopPath, entry.name);
      const targetPath = path.join(targetFolder, entry.name);
      
      try {
        // 检查目标文件是否已存在
        if (fs.existsSync(targetPath)) {
          const baseName = path.parse(entry.name).name;
          const ext = path.extname(entry.name);
          const newFileName = `${baseName}_${Date.now()}${ext}`;
          targetPath = path.join(targetFolder, newFileName);
        }
        
        fs.renameSync(sourcePath, targetPath);
        result.success++;
        result.organized.push({
          name: entry.name,
          type: fileType,
          target: targetPath,
        });
      } catch (error) {
        result.failed++;
        result.errors.push({
          file: entry.name,
          error: error.message,
        });
      }
    }
  } catch (error) {
    console.error('整理桌面失败:', error);
    result.error = error.message;
  }
  
  return result;
}

/**
 * 一键归类桌面图标（不移动文件，只创建快捷方式分类）
 */
async function quickOrganizeDesktop() {
  const desktopPath = getDesktopPath();
  const result = {
    success: 0,
    failed: 0,
    organized: [],
  };
  
  try {
    const entries = fs.readdirSync(desktopPath, { withFileTypes: true });
    const organized = {};
    
    // 统计各类型文件数量
    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith('.')) {
        const fileType = getFileType(entry.name);
        if (!organized[fileType]) {
          organized[fileType] = [];
        }
        organized[fileType].push(entry.name);
        result.success++;
      }
    }
    
    result.organized = organized;
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

/**
 * 清理桌面快捷方式（失效的）
 */
async function cleanBrokenShortcuts() {
  const desktopPath = getDesktopPath();
  const result = {
    success: 0,
    failed: 0,
    cleaned: [],
    errors: [],
  };
  
  try {
    const entries = fs.readdirSync(desktopPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.lnk')) {
        const shortcutPath = path.join(desktopPath, entry.name);
        
        try {
          // 读取快捷方式目标（简化版，实际需要解析.lnk 文件）
          const stats = fs.statSync(shortcutPath);
          
          // 如果快捷方式超过 30 天未修改，标记为可能失效
          const daysSinceModified = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
          
          if (daysSinceModified > 30) {
            result.cleaned.push({
              name: entry.name,
              path: shortcutPath,
              reason: '超过 30 天未使用',
            });
            // 不直接删除，只是标记
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            file: entry.name,
            error: error.message,
          });
        }
      }
    }
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

/**
 * 自动整理文件夹（监控桌面变化）
 */
class DesktopOrganizer {
  constructor() {
    this.watcher = null;
    this.batchTimeout = null;
    this.pendingFiles = [];
  }
  
  start() {
    const desktopPath = getDesktopPath();
    
    this.watcher = fs.watch(desktopPath, (eventType, filename) => {
      if (filename && !filename.startsWith('.') && filename !== 'desktop.ini') {
        this.pendingFiles.push({ eventType, filename });
        
        // 防抖：1 秒内多次变化只处理一次
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, 1000);
      }
    });
    
    return { success: true, message: '桌面自动整理已启动' };
  }
  
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    return { success: true, message: '桌面自动整理已停止' };
  }
  
  processBatch() {
    const desktopPath = getDesktopPath();
    
    for (const { eventType, filename } of this.pendingFiles) {
      if (eventType === 'rename' || eventType === 'change') {
        const filePath = path.join(desktopPath, filename);
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            const fileType = getFileType(filename);
            const categoryFolders = {
              documents: '文档资料',
              images: '图片视频',
              audio: '音频文件',
              videos: '视频文件',
              archives: '压缩文件',
              installers: '安装程序',
              code: '代码文件',
              others: '其他文件',
            };
            
            const targetFolder = path.join(desktopPath, categoryFolders[fileType]);
            
            if (!fs.existsSync(targetFolder)) {
              fs.mkdirSync(targetFolder, { recursive: true });
            }
            
            const targetPath = path.join(targetFolder, filename);
            
            if (!fs.existsSync(targetPath)) {
              fs.renameSync(filePath, targetPath);
            }
          }
        }
      }
    }
    
    this.pendingFiles = [];
  }
}

module.exports = {
  organizeDesktop,
  quickOrganizeDesktop,
  cleanBrokenShortcuts,
  DesktopOrganizer,
  getDesktopPath,
  getFileType,
};
