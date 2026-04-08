# 数据恢复与文件粉碎机 - 功能设计文档

## 📋 功能概述

### 数据恢复 (Data Recovery)
帮助用户恢复误删除的文件、照片等数据，支持多种文件系统和删除场景。

### 文件粉碎机 (File Shredder)
彻底删除敏感文件，通过多次覆盖写入确保数据无法被恢复，保护用户隐私。

---

## 🔧 数据恢复功能

### 功能特性

#### 1. 恢复场景支持
- ✅ **误删除文件** - 恢复被 Delete 删除的文件
- ✅ **误删除照片** - 专门针对图片格式优化
- ✅ **清空回收站** - 恢复回收站清空后的文件
- ✅ **格式化分区** - 恢复格式化后的数据（高级功能）
- ✅ **丢失分区** - 恢复丢失分区中的数据（高级功能）

#### 2. 支持的文件系统
- ✅ NTFS (Windows 主要文件系统)
- ✅ FAT32 (U 盘、存储卡)
- ✅ exFAT (大容量存储设备)
- ✅ ReFS (Windows 弹性文件系统)

#### 3. 支持的文件类型

**图片格式**
- JPG/JPEG, PNG, GIF, BMP, TIFF, RAW, PSD, AI

**文档格式**
- DOC/DOCX, XLS/XLSX, PPT/PPTX, PDF, TXT

**多媒体格式**
- MP3, MP4, AVI, MOV, WMV, FLAC, WAV

**压缩格式**
- ZIP, RAR, 7Z, TAR, GZ

**其他格式**
- EXE, DLL, SYS, APK, ISO

#### 4. 扫描模式

**快速扫描**
- 扫描最近删除的文件
- 扫描时间：1-5 分钟
- 适用场景：刚删除的文件

**深度扫描**
- 扇区级扫描整个磁盘
- 扫描时间：30 分钟 - 数小时
- 适用场景：格式化、丢失分区

**智能扫描**
- 根据文件特征智能识别
- 支持文件类型定制
- 扫描时间：10-30 分钟

### 技术实现方案

#### 方案一：使用现有库（推荐）
```javascript
// 使用 node-disk 或类似库
const disk = require('node-disk');

// 扫描可恢复文件
async function scanDeletedFiles(drive) {
  const files = await disk.scanDeleted(drive, {
    deep: false, // 快速扫描
    fileTypes: ['jpg', 'png', 'doc', 'pdf']
  });
  return files;
}

// 恢复文件
async function recoverFile(fileId, savePath) {
  await disk.recover(fileId, savePath);
}
```

**推荐库**
- `node-disk` - Node.js 磁盘操作库
- `ntfs-stream` - NTFS 文件系统访问
- `fatfs` - FAT 文件系统访问

#### 方案二：调用 Windows API
```javascript
const { exec } = require('child_process');

// 使用 Windows 自带的恢复工具
function recoverWithWindows(drive, filePath) {
  return new Promise((resolve, reject) => {
    exec(`windowsrecover "${drive}" "${filePath}"`, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}
```

#### 方案三：集成第三方工具
- **Recuva** - 免费数据恢复软件（可调用命令行）
- **TestDisk** - 开源数据恢复工具
- **PhotoRec** - 专门恢复照片

### UI 设计

#### 主界面
```
┌─────────────────────────────────────────┐
│  📊 数据恢复                            │
├─────────────────────────────────────────┤
│                                         │
│  选择扫描位置：                         │
│  ○ C 盘 (系统盘)                        │
│  ○ D 盘 (数据盘)                        │
│  ○ E 盘 (移动硬盘)                      │
│  ○ 自定义路径...                        │
│                                         │
│  扫描模式：                             │
│  ⚡ 快速扫描 (推荐)                     │
│  🔍 深度扫描 (更彻底)                   │
│  🎯 智能扫描 (平衡)                     │
│                                         │
│  文件类型：                             │
│  ☑ 图片  ☑ 文档  ☑ 视频  ☑ 音频       │
│  ☐ 压缩包  ☐ 程序  ☐ 全部              │
│                                         │
│  [开始扫描]                             │
│                                         │
└─────────────────────────────────────────┘
```

#### 扫描结果界面
```
┌─────────────────────────────────────────┐
│  扫描结果 - 找到 127 个可恢复文件       │
├─────────────────────────────────────────┤
│  📁 图片 (85)  📄 文档 (32)  🎵 其他 (10)│
├─────────────────────────────────────────┤
│  ☐ 📄 resume.docx      256 KB  优秀    │
│  ☐ 🖼️  photo_001.jpg   2.3 MB  良好    │
│  ☐ 📊 report.xlsx      128 KB  优秀    │
│  ☐ 🎵  song.mp3        4.5 MB  一般    │
│  ...                                    │
│                                         │
│  已选择：5 个文件 (15.6 MB)             │
│  恢复到：[D:\Recovered Files] [更改]    │
│                                         │
│  [恢复选中] [恢复全部] [取消]           │
└─────────────────────────────────────────┘
```

### 恢复成功率评估

**优秀 (90-100%)**
- 文件未被覆盖
- 删除时间短（<24 小时）
- 磁盘写入操作少

**良好 (70-89%)**
- 文件部分被覆盖
- 删除时间中等（1-7 天）
- 少量磁盘写入

**一般 (50-69%)**
- 文件大部分被覆盖
- 删除时间长（>7 天）
- 频繁磁盘写入

**较差 (<50%)**
- 文件严重损坏
- 磁盘已格式化
- 不建议恢复

---

## 🔒 文件粉碎机功能

### 功能特性

#### 1. 删除标准

**DoD 5220.22-M 标准**（美国国防部标准）
- 第 1 次：写入 0
- 第 2 次：写入 1
- 第 3 次：写入随机数
- 验证：检查是否完全覆盖

**Gutmann 算法**（35 次覆盖）
- 最安全的删除标准
- 适用于极度敏感数据
- 删除时间较长

**快速粉碎**（3 次覆盖）
- 日常使用推荐
- 删除速度快
- 安全性足够

#### 2. 支持的操作

**文件粉碎**
- 单个文件粉碎
- 批量文件粉碎
- 文件夹粉碎（递归）

**右键菜单集成**
- 右键"文件粉碎机"
- 右键"彻底删除"
- 快捷键支持

**拖放操作**
- 拖放文件到粉碎窗口
- 自动开始粉碎

#### 3. 安全特性

**粉碎前确认**
- 二次确认对话框
- 警告：此操作不可恢复
- 显示粉碎文件列表

**粉碎记录**
- 记录粉碎时间
- 记录文件信息
- 记录操作日志

**粉碎验证**
- 粉碎后验证文件是否消失
- 检查文件残留
- 报告粉碎结果

### 技术实现方案

#### 实现代码示例
```javascript
const fs = require('fs');
const crypto = require('crypto');

class FileShredder {
  // 生成随机数据
  generateRandomData(size) {
    return crypto.randomBytes(size);
  }

  // 覆盖写入
  async overwriteFile(filePath, pattern) {
    const stats = fs.statSync(filePath);
    const fd = fs.openSync(filePath, 'r+');
    
    const buffer = Buffer.from(pattern);
    const fileSize = stats.size;
    
    // 多次覆盖
    for (let i = 0; i < fileSize; i += buffer.length) {
      fs.writeSync(fd, buffer, 0, Math.min(buffer.length, fileSize - i), i);
    }
    
    fs.fsyncSync(fd); // 强制写入磁盘
    fs.closeSync(fd);
  }

  // DoD 标准粉碎
  async dodShred(filePath) {
    // 第 1 次：写入 0
    await this.overwriteFile(filePath, Buffer.alloc(1, 0));
    
    // 第 2 次：写入 1
    await this.overwriteFile(filePath, Buffer.alloc(1, 1));
    
    // 第 3 次：写入随机数
    await this.overwriteFile(filePath, this.generateRandomData(1));
    
    // 删除文件
    fs.unlinkSync(filePath);
  }

  // 批量粉碎
  async shredFiles(filePaths, options = {}) {
    const { method = 'dod', onProgress } = options;
    const results = [];
    
    for (let i = 0; i < filePaths.length; i++) {
      try {
        if (method === 'dod') {
          await this.dodShred(filePaths[i]);
        } else if (method === 'gutmann') {
          await this.gutmannShred(filePaths[i]);
        } else if (method === 'quick') {
          await this.quickShred(filePaths[i]);
        }
        
        results.push({ file: filePaths[i], success: true });
      } catch (error) {
        results.push({ file: filePaths[i], success: false, error: error.message });
      }
      
      if (onProgress) {
        onProgress(i + 1, filePaths.length);
      }
    }
    
    return results;
  }
}

module.exports = FileShredder;
```

### UI 设计

#### 主界面
```
┌─────────────────────────────────────────┐
│  🔒 文件粉碎机                          │
├─────────────────────────────────────────┤
│                                         │
│  将文件拖放到此处                       │
│  或点击选择文件                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │      📁 拖放文件到此处          │   │
│  │      或点击选择                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  粉碎模式：                             │
│  ⚡ 快速粉碎 (3 次覆盖)                 │
│  🛡️  标准粉碎 (DoD 标准) [推荐]        │
│  🔐  彻底粉碎 (Gutmann 35 次)           │
│                                         │
│  待粉碎文件：                           │
│  📄 secret.docx        256 KB          │
│  📊 data.xlsx          1.2 MB          │
│  🖼️  photo.jpg         3.4 MB          │
│                                         │
│  ⚠️  警告：此操作不可恢复！             │
│                                         │
│  [开始粉碎] [清空列表]                  │
│                                         │
└─────────────────────────────────────────┘
```

#### 粉碎进度
```
┌─────────────────────────────────────────┐
│  正在粉碎文件...                        │
├─────────────────────────────────────────┤
│                                         │
│  📄 secret.docx                         │
│  ████████████████░░░░  68%             │
│  正在写入第 2 次覆盖...                  │
│                                         │
│  剩余时间：约 15 秒                      │
│                                         │
│  [取消]                                 │
│                                         │
└─────────────────────────────────────────┘
```

#### 粉碎完成
```
┌─────────────────────────────────────────┐
│  ✅ 粉碎完成                            │
├─────────────────────────────────────────┤
│                                         │
│  成功粉碎：3 个文件                      │
│  失败：0 个文件                          │
│                                         │
│  📄 secret.docx      ✅ 成功            │
│  📊 data.xlsx        ✅ 成功            │
│  🖼️  photo.jpg       ✅ 成功            │
│                                         │
│  粉碎方式：DoD 5220.22-M 标准           │
│  覆盖次数：3 次                          │
│  总耗时：45 秒                          │
│                                         │
│  [查看日志] [关闭]                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📦 依赖库推荐

### 数据恢复
```json
{
  "dependencies": {
    "node-disk": "^1.0.0",
    "ntfs-stream": "^0.1.0",
    "fatfs": "^0.14.0"
  }
}
```

### 文件粉碎机
```json
{
  "dependencies": {
    "crypto": "builtin"
  }
}
```

---

## ⚠️ 注意事项

### 数据恢复
1. **越早恢复越好** - 删除后应立即停止写入操作
2. **不要恢复到原位置** - 避免覆盖原数据
3. **成功率非 100%** - 取决于删除时间和磁盘使用情况
4. **格式化恢复困难** - 需要深度扫描，时间长

### 文件粉碎机
1. **不可恢复** - 粉碎后无法恢复，请谨慎操作
2. **SSD 特殊处理** - SSD 建议使用 TRIM 命令
3. **系统文件勿删** - 避免粉碎系统关键文件
4. **权限要求** - 某些文件需要管理员权限

---

## 🎯 开发优先级

### P2 - 高优先级
- [ ] 文件粉碎机（基础版）
- [ ] 快速扫描恢复

### P3 - 中优先级
- [ ] 深度扫描恢复
- [ ] 文件粉碎机（增强版）
- [ ] 右键菜单集成

### P4 - 低优先级
- [ ] 格式化分区恢复
- [ ] Gutmann 算法
- [ ] 云端恢复服务

---

**文档版本**: v1.0  
**创建时间**: 2026-03-16  
**状态**: 规划中
