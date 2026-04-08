const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function getMigratableSoftware() {
  const softwareList = [];
  
  try {
    console.log('[SoftwareMigration] 开始扫描可迁移软件...');
    
    const { stdout } = await execAsync('wmic logicaldisk get DeviceID');
    const drives = stdout.trim().split('\n').slice(1)
      .map(d => d.trim())
      .filter(d => d && d !== 'C:')
      .map(d => d.replace(':', ''));
    
    console.log('[SoftwareMigration] 可用目标驱动器:', drives);
    
    const softwareLocations = [
      'C:\\Program Files',
      'C:\\Program Files (x86)',
    ];
    
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\' + (process.env.USERNAME || '');
    if (userProfile) {
      softwareLocations.push(path.join(userProfile, 'AppData', 'Local'));
      softwareLocations.push(path.join(userProfile, 'AppData', 'Roaming'));
    }
    
    console.log('[SoftwareMigration] 扫描位置:', softwareLocations);
    
    const minSizeMB = 10;
    console.log('[SoftwareMigration] 最小扫描尺寸:', minSizeMB, 'MB');
    
    for (const basePath of softwareLocations) {
      if (fsSync.existsSync(basePath)) {
        try {
          console.log('[SoftwareMigration] 正在扫描:', basePath);
          const entries = fsSync.readdirSync(basePath, { withFileTypes: true });
          
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const fullPath = path.join(basePath, entry.name);
              
              try {
                let size = 0;
                const getDirSize = (dir) => {
                  let total = 0;
                  if (fsSync.existsSync(dir)) {
                    try {
                      const items = fsSync.readdirSync(dir, { withFileTypes: true });
                      for (const item of items) {
                        const itemPath = path.join(dir, item.name);
                        try {
                          if (item.isDirectory()) {
                            total += getDirSize(itemPath);
                          } else {
                            const stats = fsSync.statSync(itemPath);
                            total += stats.size;
                          }
                        } catch (e) {}
                      }
                    } catch (e) {}
                  }
                  return total;
                };
                
                size = getDirSize(fullPath);
                const sizeMB = size / 1024 / 1024;
                
                if (size > minSizeMB * 1024 * 1024) {
                  console.log('[SoftwareMigration] 发现可迁移软件:', entry.name, '大小:', sizeMB.toFixed(2), 'MB');
                  softwareList.push({
                    name: entry.name,
                    path: fullPath,
                    size: size,
                    sizeMB: sizeMB.toFixed(2),
                    sizeGB: (size / 1024 / 1024 / 1024).toFixed(2),
                    availableDrives: drives,
                    selected: false,
                  });
                }
              } catch (error) {
                console.error('[SoftwareMigration] 获取软件大小失败:', fullPath, error);
              }
            }
          }
        } catch (error) {
          console.error('[SoftwareMigration] 读取目录失败:', basePath, error);
        }
      } else {
        console.log('[SoftwareMigration] 目录不存在，跳过:', basePath);
      }
    }
    
    softwareList.sort((a, b) => b.size - a.size);
    console.log('[SoftwareMigration] 扫描完成，共发现', softwareList.length, '个可迁移软件');
    
  } catch (error) {
    console.error('[SoftwareMigration] 获取可迁移软件失败:', error);
  }
  
  return softwareList;
}

async function moveSoftware(software, targetDrive) {
  try {
    const targetPath = path.join(targetDrive + ':', 'AICLeaner_Moved_Software', software.name);
    
    if (!fsSync.existsSync(targetPath)) {
      fsSync.mkdirSync(targetPath, { recursive: true });
    }
    
    console.log('[SoftwareMigration] 开始迁移:', software.name, '到', targetPath);
    
    const copyDir = async (src, dest) => {
      const entries = fsSync.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          if (!fsSync.existsSync(destPath)) {
            fsSync.mkdirSync(destPath, { recursive: true });
          }
          await copyDir(srcPath, destPath);
        } else {
          fsSync.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    await copyDir(software.path, targetPath);
    
    fsSync.rmSync(software.path, { recursive: true, force: true });
    
    console.log('[SoftwareMigration] 迁移完成:', software.name);
    
    return {
      success: true,
      message: `${software.name} 已成功迁移到 ${targetDrive}`,
      size: software.size,
    };
    
  } catch (error) {
    console.error('[SoftwareMigration] 迁移失败:', software.name, error);
    return {
      success: false,
      message: `迁移失败: ${error.message}`,
      error: error,
    };
  }
}

module.exports = {
  getMigratableSoftware,
  moveSoftware,
};
